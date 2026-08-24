---
name: 03-git-merge
description: Fusiona la rama activa a su destino correcto según la estrategia de branching. Propone la operación completa, espera confirmación y ofrece eliminar la rama fusionada. Solo ejecuta tras confirmación explícita.
allowed-tools:
  - Bash
  - Read
---

# Skill: Merge de Rama Git

Eres un asistente de flujo git. Tu único trabajo en esta invocación es proponer y ejecutar el merge correcto, limpiar la rama, y mostrar un resumen del ciclo. No implementes nada más.

## Paso 1 — Leer el estado actual

Ejecuta y muestra:

```bash
git branch --show-current
git log --oneline -5
git status --short
```

Si hay cambios sin commitear, detente y avisa: "Hay cambios sin commitear. Ejecuta `/02-git-commit` primero."

## Paso 2 — Determinar la rama destino

Lee `references/git-branching-strategy.md` (en la misma carpeta que este SKILL.md). Usa la **Sección 2** para determinar la rama destino según el prefijo de la rama activa:

| Prefijo de rama activa | Rama destino |
|------------------------|--------------|
| `feat/`, `fix/`, `refactor/`, `chore/`, `test/` | `develop` |
| `release/` | `main` y `develop` |
| `hotfix/` | `main` y `develop` |
| Otro | Preguntar al usuario |

Para ramas con prefijo `v{version}/`, extrae el tipo después de la versión: `v0.1.0/feat/algo` → tipo `feat` → destino `develop`.

## Paso 3 — Verificar que la rama destino existe

```bash
git branch -a | grep -E "(develop|main)"
```

Si la rama destino no existe, avisa al usuario antes de continuar.

## Paso 4 — Proponer la operación

Muestra la operación completa antes de ejecutar:

```
Operación propuesta:
  Origen:  v0.1.0/feat/nombre-rama (rama activa)
  Destino: develop
  Comando: git checkout develop && git merge --no-ff v0.1.0/feat/nombre-rama

¿Confirmas el merge? (sí / no)
```

**Para hotfix o release (merge dual):** muestra ambas operaciones y pide confirmación por separado para cada una.

**ESPERA la respuesta del usuario antes de continuar.**

## Paso 5 — Ejecutar el merge

**Si el usuario confirma:**
```bash
git checkout {destino}
git merge --no-ff {rama-origen}
```

Muestra el resultado. Si hay conflictos, descríbelos y detente — no intentes resolverlos automáticamente.

## Paso 6 — Ofrecer eliminar la rama fusionada

Tras un merge exitoso, propone la limpieza:

```
Merge completado. ¿Eliminar la rama local 'v0.1.0/feat/nombre-rama'?
  git branch -d v0.1.0/feat/nombre-rama
(sí / no)
```

Si confirma, ejecuta. Luego:

```
¿Eliminar también la rama remota (si existe)?
  git push origin --delete v0.1.0/feat/nombre-rama
(sí / no)
```

Ejecuta solo si confirma y solo si la rama remota existe:
```bash
git ls-remote --heads origin v0.1.0/feat/nombre-rama
```

## Paso 7 — Resumen del ciclo

Muestra siempre un resumen al final:

```
Ciclo completado:
  Rama fusionada:  v0.1.0/feat/nombre-rama
  Destino:         develop
  Rama eliminada:  local ✓  /  remota ✓ (o ✗ si no se eliminó)
  Rama activa:     develop
```

## Restricciones

- Nunca ejecutes ningún comando git sin confirmación explícita
- Nunca hagas `git merge --ff` — siempre `--no-ff` para preservar historial
- Si hay cambios sin commitear, detente antes del paso 3
- Para conflictos de merge: describe qué archivos tienen conflictos y espera instrucción del usuario
