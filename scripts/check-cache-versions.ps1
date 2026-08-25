$ErrorActionPreference = 'Stop'

# Recursos que el navegador puede conservar en caché. Si uno cambia, todas sus
# referencias publicadas deben recibir una nueva versión en el parámetro ?v=.
$cacheableResourcePattern = '\.(css|js|mjs|png|jpe?g|gif|webp|svg|pdf|zip|woff2?|ttf|eot)$'
$referenceFilePattern = '\.(html?|php|css)$'

function Get-GitFileContent {
  param([Parameter(Mandatory = $true)][string]$Path)

  $content = & git show (":$Path") 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $null
  }

  return ($content -join "`n")
}

function Get-HeadFileContent {
  param([Parameter(Mandatory = $true)][string]$Path)

  # Un archivo nuevo no existe todavía en HEAD. Silenciamos esa comprobación
  # esperada sin cambiar el comportamiento estricto del resto del hook.
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'SilentlyContinue'
    $content = & git show ("HEAD:$Path") 2>$null
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($LASTEXITCODE -ne 0) {
    return ''
  }

  return ($content -join "`n")
}

function Get-ResourceReferences {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
    [Parameter(Mandatory = $true)][string]$ResourcePath
  )

  $escapedPath = [regex]::Escape($ResourcePath)
  $pattern = $escapedPath + '(?<query>\?[^\s"''<>\)]*)?'
  $references = @()

  foreach ($match in [regex]::Matches($Content, $pattern)) {
    $query = $match.Groups['query'].Value
    $versionMatch = [regex]::Match($query, '^\?v=(?<version>[A-Za-z0-9._-]+)(?:&|$)')
    $references += [PSCustomObject]@{
      Url = $match.Value
      Version = if ($versionMatch.Success) { $versionMatch.Groups['version'].Value } else { $null }
    }
  }

  return $references
}

$stagedFiles = @(& git diff --cached --name-only --diff-filter=ACMR)
if ($LASTEXITCODE -ne 0) {
  throw 'No se pudo leer el área de preparación de Git.'
}

$changedResources = @($stagedFiles | Where-Object { $_ -match $cacheableResourcePattern })
if ($changedResources.Count -eq 0) {
  exit 0
}

$trackedFiles = @(& git ls-files)
$referenceFiles = @($trackedFiles + $stagedFiles | Where-Object { $_ -match $referenceFilePattern } | Sort-Object -Unique)
$errors = [System.Collections.Generic.List[string]]::new()

foreach ($resource in $changedResources) {
  $foundReference = $false

  foreach ($referenceFile in $referenceFiles) {
    $stagedContent = Get-GitFileContent -Path $referenceFile
    if ($null -eq $stagedContent) {
      continue
    }

    $currentReferences = @(Get-ResourceReferences -Content $stagedContent -ResourcePath $resource)
    if ($currentReferences.Count -eq 0) {
      continue
    }

    $foundReference = $true
    $headContent = Get-HeadFileContent -Path $referenceFile
    $previousVersions = @(Get-ResourceReferences -Content $headContent -ResourcePath $resource |
      ForEach-Object { $_.Version } |
      Where-Object { $_ })

    foreach ($reference in $currentReferences) {
      if (-not $reference.Version) {
        $errors.Add("$referenceFile referencia $resource sin un parámetro ?v=.")
        continue
      }

      if ($previousVersions -contains $reference.Version) {
        $errors.Add("$referenceFile aún usa ?v=$($reference.Version) para $resource. Incrementa esa versión antes de confirmar el cambio.")
      }
    }
  }

  if (-not $foundReference) {
    Write-Host "Aviso: $resource cambio, pero no se encontro una referencia HTML, PHP o CSS que validar." -ForegroundColor Yellow
  }
}

if ($errors.Count -gt 0) {
  Write-Host ''
  Write-Host 'Commit bloqueado: actualiza el parametro ?v= de los recursos modificados.' -ForegroundColor Red
  $errors | Sort-Object -Unique | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
  Write-Host ''
  Write-Host 'Ejemplo: css/index.css?v=7 -> css/index.css?v=8' -ForegroundColor Cyan
  exit 1
}

exit 0
