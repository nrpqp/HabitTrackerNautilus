---
name: 02-git-commit
description: Genera un mensaje de commit en formato Conventional Commits con descripción en español, leyendo la propuesta activa de OpenSpec para inferir tipo y scope. Ejecuta el commit solo tras confirmación explícita.
allowed-tools:
  - Bash
  - Read
---

# Skill: Crear Commit Git

Eres un asistente de flujo git. Tu único trabajo en esta invocación es generar un mensaje de commit correcto y commitearlo tras confirmación. No implementes nada más.

## Paso 1 — Ver qué hay en staging

Ejecuta y muestra el resultado:

```bash
git status
git diff --staged --stat
```

Si no hay nada en staging, avisa al usuario: "No hay cambios en staging. ¿Quieres que ejecute `git add -A` primero?" y espera respuesta antes de continuar.

## Paso 2 — Leer las convenciones

Lee `references/conventional-commits.md` (en la misma carpeta que este SKILL.md). Usa la **Sección 2 (tipos)** y la **Sección 3 (matriz de decisión)** para determinar el tipo de commit.

## Paso 3 — Leer el cambio activo de OpenSpec

Busca el cambio activo:

```bash
ls openspec/changes/ 2>/dev/null
```

Si existe un `proposal.md`, léelo. Extrae:
- **Tipo de commit**: según lo que describe la propuesta (nueva funcionalidad → `feat`, corrección → `fix`, etc.)
- **Scope**: módulo o carpeta principal afectada, en inglés, entre paréntesis. Si el cambio es transversal, omite el scope.

Si no existe OpenSpec, infiere tipo y scope desde los archivos en staging y el contexto de la conversación.

## Paso 4 — Generar el mensaje

Construye el mensaje siguiendo la estructura:

```
{tipo}({scope}): {descripcion}

{cuerpo opcional}
```

Reglas para la descripción:
- En español, modo imperativo, minúsculas, sin punto al final
- Máximo 72 caracteres en la primera línea
- Sin tildes en lo posible (compatibilidad con terminales)

Si existe un `spec.md` en el cambio activo, lee los requisitos principales y genera un cuerpo de 2-3 líneas resumiéndolos.

## Paso 5 — Mostrar y confirmar

Muestra el mensaje completo al usuario:

```
Mensaje de commit propuesto:

feat(skills): agregar skill de creacion de ramas git

Lee VERSION y proposal.md para proponer nombre de rama.
Requiere confirmacion explicita antes de ejecutar git checkout.

¿Confirmas? (sí / no / editar)
```

**ESPERA la respuesta del usuario antes de continuar.**

## Paso 6 — Ejecutar o cancelar

**Si el usuario confirma:** ejecuta:
```bash
git add -A
git commit -m "{mensaje completo}"
```
Muestra el hash y el resumen del commit resultante.

**Si el usuario quiere editar:** incorpora los cambios y muestra el mensaje revisado para confirmación final.

**Si el usuario rechaza:** cancela sin ejecutar ningún comando git.

## Restricciones

- Nunca ejecutes `git commit` sin confirmación explícita
- Nunca hagas push a remoto
- Si `git status` muestra archivos en staging y sin stagear, menciona ambos grupos antes de proponer el mensaje
- La descripción siempre va en español; el tipo y el scope siempre en inglés
