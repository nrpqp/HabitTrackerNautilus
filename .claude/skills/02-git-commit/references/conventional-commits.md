## 1. Estructura Estándar

```text
<tipo>[alcance opcional]: <descripción imperativa y concisa>

[cuerpo opcional: detalles y motivación del cambio]

[pie opcional: referencias a tickets, breaking changes, etc.]
```

### Ejemplo completo:
```text
feat(auth): agregar soporte para inicio de sesión con Apple

Implementa el flujo OAuth 2.0 para dispositivos iOS y validación de tokens JWT en backend.

Closes #142
```
## 2. Tipos de Commit (`<tipo>`)

| Tipo       | Propósito                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| `feat`     | Nueva característica o funcionalidad para el usuario.                          |
| `fix`      | Corrección de un bug o falla de comportamiento.                                |
| `docs`     | Cambios exclusivos en documentación (README, guías, swagger).                  |
| `style`    | Formato, espacios en blanco, comas faltantes (sin cambio de lógica).           |
| `refactor` | Cambio de código que no arregla un bug ni añade una feature.                   |
| `perf`     | Mejora de rendimiento o consumo de recursos.                                   |
| `test`     | Añadir o corregir pruebas (unitarias, integración, e2e).                       |
| `build`    | Cambios que afectan el sistema de compilación o dependencias externas.         |
| `ci`       | Cambios en scripts y configuración de CI/CD (GitHub Actions, Jenkins).         |
| `chore`    | Tareas rutinarias de mantenimiento que no tocan código de producción ni tests. |
| `revert`   | Revierte un commit previo.                                                     |
## 3. Matriz de Decisión para Nombrar Commits

| ¿Qué hiciste en este commit?                                  | Tipo recomendado  | Ejemplo de mensaje                                   |
| ------------------------------------------------------------- | ----------------- | ---------------------------------------------------- |
| Agregué un endpoint o botón nuevo                             | `feat`            | `feat(api): add endpoint to export users to pdf`     |
| Arreglé un error de cálculo o crash                           | `fix`             | `fix(checkout): resolve zero division in cart total` |
| Modifiqué el README o comentarios                             | `docs`            | `docs: update deployment instructions for staging`   |
| Reordené funciones o simplifiqué código                       | `refactor`        | `refactor(auth): simplify token validation pipeline` |
| Optimicé una consulta SQL pesada                              | `perf`            | `perf(database): add index on orders.created_at`     |
| Agregué tests de regresión                                    | `test`            | `test(payment): add unit tests for stripe webhook`   |
| Actualicé una librería en `package.json` / `requirements.txt` | `build` o `chore` | `build(deps): bump axios from 1.6.0 to 1.7.0`        |
| Modifiqué el archivo `.github/workflows/ci.yml`               | `ci`              | `ci: add automated linting step to pr workflow`      |
## 4. Reglas de Redacción

1. Usa modo imperativo en presente.
2. Primera letra en minúscula: `fix: resolve issue` (no `fix: Resolve issue`).
3. Sin punto al final de la primera línea: Mantenlo limpio y conciso (máximo 50-72 caracteres).