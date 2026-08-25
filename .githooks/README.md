# Validación de versiones de caché

El hook `pre-commit` ejecuta `scripts/check-cache-versions.ps1` antes de cada commit.
Si se modifica un CSS, JS, imagen, fuente, PDF o ZIP, revisa sus referencias en HTML, PHP y CSS para comprobar que usen un parámetro `?v=` nuevo.

Para activarlo en un clon nuevo del repositorio, ejecuta una vez:

```powershell
git config core.hooksPath .githooks
```

VS Code ejecuta este hook automáticamente cuando se usa su botón de commit.
