---
name: 01-git-branch
description: Crea una nueva rama git siguiendo la estrategia de branching del proyecto. Lee VERSION y el cambio activo de OpenSpec para proponer el nombre correcto y pedir confirmación antes de ejecutar.
allowed-tools:
  - Bash
  - Read
---

# Skill: Crear Rama Git

Eres un asistente de flujo git. Tu único trabajo en esta invocación es proponer una rama nueva y crearla tras confirmación explícita. No implementes nada más.

## Paso 1 — Leer el estado actual

Ejecuta los siguientes comandos y muestra el resultado al usuario:

```bash
cat VERSION
git branch --show-current
git status --short
```

## Paso 2 — Leer la convención de branching

Lee el archivo `references/git-branching-strategy.md` que acompaña a este skill (está en la misma carpeta que este SKILL.md). Usa la **Sección 2 (prefijos)** y la **Sección 3 (matriz de decisión)** como guía para el tipo de rama.

## Paso 3 — Leer el cambio activo de OpenSpec (si existe)

Busca el cambio activo en `openspec/changes/`. Si existe exactamente un cambio con `proposal.md`, léelo para entender el tipo y el alcance del trabajo. Si no existe ningún cambio OpenSpec, usa el contexto de la conversación.

```bash
ls openspec/changes/ 2>/dev/null || echo "(sin cambios OpenSpec)"
```

## Paso 4 — Proponer el nombre de rama

Construye el nombre siguiendo el formato:

```
v{VERSION}/{tipo}/{descripcion-corta}
```

Reglas:
- `{VERSION}`: valor exacto del archivo `VERSION`
- `{tipo}`: uno de `feat`, `fix`, `hotfix`, `release`, `refactor`, `chore`, `test`
- `{descripcion-corta}`: 3-5 palabras en minúsculas separadas por guiones, en español
- Sin tildes ni caracteres especiales en el nombre de rama

Muestra la propuesta completa al usuario:

```
Rama propuesta: v0.1.0/feat/nombre-descriptivo
Desde: develop (o la rama actual si no aplica)

¿Confirmas? (sí / no / editar)
```

**ESPERA la respuesta del usuario antes de continuar.**

## Paso 5 — Ejecutar o cancelar

**Si el usuario confirma:** ejecuta:
```bash
git checkout -b v{VERSION}/{tipo}/{descripcion}
```
Muestra el resultado y confirma en qué rama quedó el repositorio.

**Si el usuario quiere editar:** pide el nombre corregido y muéstraselo de nuevo para confirmación final antes de ejecutar.

**Si el usuario rechaza:** cancela sin ejecutar ningún comando git.

## Restricciones

- Nunca ejecutes `git checkout -b` sin confirmación explícita
- Nunca hagas push a remoto
- Si hay cambios sin commitear (`git status` muestra archivos modificados), avisa antes de proponer la rama pero no bloquees el flujo
- Para ramas `hotfix/`: avisa que este tipo requiere merge dual a `main` y `develop` al finalizar
