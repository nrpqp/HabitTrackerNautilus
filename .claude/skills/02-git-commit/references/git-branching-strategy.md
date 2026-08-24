## 1. Estructura de Ramas Principales

| Rama              | Propósito                                                        | Nivel de Estabilidad               |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `main` / `master` | Código en producción. Siempre desplegable y estable.             | Alta (Bloqueada para push directo) |
| `develop`         | Integración de nuevas funcionalidades para la siguiente versión. | Media/Alta                         |
|                   |                                                                  |                                    |
## 2. Prefijos Estándar para Ramas Temporales

Usa la convención: `<version-software>/<tipo>/<descripcion-corta>`

| Prefijo              | ¿Cuándo usarlo?                                                  | Rama de origen | Rama de destino    | Ejemplo                                     |
| -------------------- | ---------------------------------------------------------------- | -------------- | ------------------ | ------------------------------------------- |
| `feature/` o `feat/` | Nuevas funcionalidades o requerimientos.                         | `develop`      | `develop`          | `v0.9.1/feature/AUTH-102-google-login       |
| `bugfix/` o `fix/`   | Corrección de errores encontrados en QA o desarrollo.            | `develop`      | `develop`          | `v0.9.1`/fix/CART-45-null-pointer-discount` |
| `hotfix/`            | Errores críticos bloqueantes directamente en producción.         | `main`         | `main` y `develop` | `v0.9.1/hotfix/payment-gateway-timeout`     |
| `release/`           | Preparación y estabilización de una versión antes de producción. | `develop`      | `main` y `develop` | `v0.9.1/release`                            |
| `refactor/`          | Reestructuración de código sin alterar funcionalidad externa.    | `develop`      | `develop`          | `v0.9.1/refactor/user-service-cleanup`      |
| `chore/`             | Mantenimiento, configs, actualización de dependencias.           | `develop`      | `develop`          | `v0.9.1/chore/upgrade-node-20`              |
| `test/`              | Creación o ajuste exclusivo de suites de pruebas automatizadas.  | `develop`      | `develop`          | `v0.9.1/test/checkout-e2e-suite`            |

---

## 3. Matriz de Decisión Rápida

- **¿Es algo nuevo para el usuario final?** → `feature/...`
- **¿Es un bug reportado en pruebas / staging?** → `fix/...` o `bugfix/...`
- **¿Está caído o roto el entorno de producción ahora mismo?** → `hotfix/...`
- **¿Vas a empaquetar una versión con número de tag?** → `release/...`
- **¿Mejoraste la arquitectura/código sin cambiar la lógica de negocio?** → `refactor/...`
- **¿Actualizaste paquetes, Docker o CI/CD?** → `chore/...`

---

## 4. Reglas de Oro

1. **Nombres en minúsculas y separados por guiones:** `feature/add-export-csv` (Evitar camelCase o espacios).
2. **Conciso y específico:** Máximo 3 a 5 palabras clave descriptivas.
3. **Eliminar tras merge:** Borrar la rama remota y local una vez completada la integración.


