$ErrorActionPreference = 'Stop'

# Antes de cada commit, asigna a los recursos modificados una versión basada en
# su hash de Git. Así el navegador descarga la versión nueva sin que haya que
# modificar manualmente el parámetro ?v=.
$cacheableResourcePattern = '\.(css|js|mjs|png|jpe?g|gif|webp|svg|pdf|zip|woff2?|ttf|eot)$'
$referenceFilePattern = '\.(html?|php|css)$'

function Get-GitFileContent {
  param([Parameter(Mandatory = $true)][string]$Path)

  $content = & git show (":$Path") 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  return ($content -join "`n")
}

function Update-ResourceVersion {
  param(
    [Parameter(Mandatory = $true)][string]$Content,
    [Parameter(Mandatory = $true)][string]$ResourcePath,
    [Parameter(Mandatory = $true)][string]$Version
  )

  $escapedPath = [regex]::Escape($ResourcePath)
  $pattern = $escapedPath + '(?<query>\?[^\s"''<>\)]*)?'
  return [regex]::Replace($Content, $pattern, {
    param($match)
    $query = $match.Groups['query'].Value
    if ([string]::IsNullOrEmpty($query)) { return "$ResourcePath?v=$Version" }

    # Conserva otros parámetros y deja exactamente una versión al inicio.
    $otherParameters = @(
      $query.Substring(1).Split('&') |
        Where-Object { $_ -and $_ -notmatch '^v=' }
    )
    $updatedQuery = "?v=$Version"
    if ($otherParameters.Count -gt 0) { $updatedQuery += '&' + ($otherParameters -join '&') }
    return "$ResourcePath$updatedQuery"
  })
}

function Update-StagedFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  $indexEntry = & git ls-files -s -- $Path
  if ($LASTEXITCODE -ne 0 -or -not $indexEntry) { throw "No se pudo leer $Path del área de preparación." }
  $mode = ($indexEntry -split '\s+')[0]
  $temporaryFile = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($temporaryFile, $Content, [System.Text.UTF8Encoding]::new($false))
    $blobOutput = & git hash-object -w --no-filters -- $temporaryFile
    if ($LASTEXITCODE -ne 0 -or -not $blobOutput) { throw "No se pudo preparar $Path para el commit." }
    $blob = $blobOutput.Trim()
    & git update-index --cacheinfo "$mode,$blob,$Path"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar $Path en el área de preparación." }
  }
  finally { Remove-Item -LiteralPath $temporaryFile -Force -ErrorAction SilentlyContinue }
}

$stagedFiles = @(& git diff --cached --name-only --diff-filter=ACMR)
if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer el área de preparación de Git.' }
$changedResources = @($stagedFiles | Where-Object { $_ -match $cacheableResourcePattern })
if ($changedResources.Count -eq 0) { exit 0 }

$trackedFiles = @(& git ls-files)
$referenceFiles = @($trackedFiles + $stagedFiles | Where-Object { $_ -match $referenceFilePattern } | Sort-Object -Unique)
$updatedReferences = [System.Collections.Generic.HashSet[string]]::new()

foreach ($resource in $changedResources) {
  $resourceHash = (& git rev-parse (":$resource")).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $resourceHash) { throw "No se pudo obtener la versión de $resource." }
  $version = $resourceHash.Substring(0, 12)

  foreach ($referenceFile in $referenceFiles) {
    $stagedContent = Get-GitFileContent -Path $referenceFile
    if ($null -eq $stagedContent -or $stagedContent -notmatch [regex]::Escape($resource)) { continue }

    $updatedStagedContent = Update-ResourceVersion -Content $stagedContent -ResourcePath $resource -Version $version
    $workingPath = Join-Path (Get-Location) $referenceFile
    $workingContent = $null
    $updatedWorkingContent = $null
    if (Test-Path -LiteralPath $workingPath -PathType Leaf) {
      $workingContent = [System.IO.File]::ReadAllText($workingPath)
      $updatedWorkingContent = Update-ResourceVersion -Content $workingContent -ResourcePath $resource -Version $version
    }

    if ($updatedStagedContent -ne $stagedContent) {
      # Si no hay otros cambios locales, conserva exactamente los saltos de
      # línea del archivo abierto en el editor.
      $contentToStage = $updatedStagedContent
      if ($workingContent -eq $stagedContent -or $workingContent -eq ($stagedContent + "`n")) {
        $contentToStage = $updatedWorkingContent
      }
      Update-StagedFile -Path $referenceFile -Content $contentToStage
      $updatedReferences.Add($referenceFile) | Out-Null
    }

    # Mantiene el editor sincronizado sin añadir otros cambios locales al commit.
    if ($null -ne $workingContent -and $updatedWorkingContent -ne $workingContent) {
      [System.IO.File]::WriteAllText($workingPath, $updatedWorkingContent, [System.Text.UTF8Encoding]::new($false))
    }
  }
}

if ($updatedReferences.Count -gt 0) {
  Write-Host 'Versiones de caché actualizadas automáticamente:' -ForegroundColor Green
  $updatedReferences | Sort-Object | ForEach-Object { Write-Host "- $_" -ForegroundColor Green }
}

exit 0
