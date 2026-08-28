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

Este proyecto usa trunk-based development: todas las ramas de feature mergean directamente a `main`.

| Prefijo de rama activa | Rama destino |
|------------------------|--------------|
| `feat/`, `fix/`, `refactor/`, `chore/`, `test/` | `main` |
| `hotfix/` | `main` |
| Otro | Preguntar al usuario |

Para ramas con prefijo `v{version}/`, extrae el tipo después de la versión: `v0.1.0/feat/algo` → tipo `feat` → destino `main`.

## Paso 3 — Verificar que la rama destino existe

```bash
git branch -a | grep "main"
```

Si la rama destino no existe, avisa al usuario antes de continuar.

## Paso 4 — Proponer la operación

Muestra la operación completa antes de ejecutar:

```
Operación propuesta:
  Origen:  v0.1.0/feat/nombre-rama (rama activa)
  Destino: main
  Comando: git checkout main && git merge --no-ff v0.1.0/feat/nombre-rama

¿Confirmas el merge? (sí / no)
```

**ESPERA la respuesta del usuario antes de continuar.**

## Paso 5 — Ejecutar el merge

**Si el usuario confirma:**
```bash
git checkout {destino}
git merge --no-ff {rama-origen}
```

Muestra el resultado. Si hay conflictos, descríbelos y detente — no intentes resolverlos automáticamente.

## Paso 6 — Ofrecer actualizar la versión

Tras un merge exitoso a `main`, lee la versión actual:

```bash
cat VERSION
```

Pregunta al usuario:

```
Merge completado. Versión actual: X.Y.Z
¿Querés actualizar la versión?
  [1] patch  → X.Y.(Z+1)  — corrección de bug
  [2] minor  → X.(Y+1).0  — feature nueva
  [3] major  → (X+1).0.0  — cambio grande
  [4] no     — mantener X.Y.Z
```

**ESPERA la respuesta del usuario.**

Si elige 1, 2 o 3, calcula la nueva versión y ejecuta:

```bash
echo "X.Y.Z_NUEVA" > VERSION
```

Luego actualiza `package.json` usando Node:
```bash
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json')); p.version='X.Y.Z_NUEVA'; fs.writeFileSync('package.json', JSON.stringify(p, null, 2)+'\n');"
```

Luego commitea el bump:
```bash
git add VERSION package.json
git commit -m "chore: actualizar version a X.Y.Z_NUEVA"
```

Si elige 4, continúa sin modificar nada.

## Paso 7 — Ofrecer eliminar la rama fusionada

Propone la limpieza:

```
¿Eliminar la rama local 'v0.1.0/feat/nombre-rama'?
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

## Paso 8 — Resumen del ciclo

Muestra siempre un resumen al final:

```
Ciclo completado:
  Rama fusionada:  v0.1.0/feat/nombre-rama
  Destino:         main
  Versión:         X.Y.Z → X.Y.Z_NUEVA (o sin cambio)
  Rama eliminada:  local ✓  /  remota ✓ (o ✗ si no se eliminó)
  Rama activa:     main
```

## Restricciones

- Nunca ejecutes ningún comando git sin confirmación explícita
- Nunca hagas `git merge --ff` — siempre `--no-ff` para preservar historial
- Si hay cambios sin commitear, detente antes del paso 3
- Para conflictos de merge: describe qué archivos tienen conflictos y espera instrucción del usuario
