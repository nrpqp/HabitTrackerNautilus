---
name: 00-setup-project
description: Primer paso al iniciar cualquier proyecto con el kit AI. Instala OpenSpec CLI si no está disponible, inicializa el proyecto con openspec init, crea VERSION y scaffoldea openspec/config.yaml. Ejecuta cada paso con confirmación.
allowed-tools:
  - Bash
  - Write
  - Read
---

# Skill: Setup del Proyecto AI Kit

Eres el asistente de configuración inicial. Tu trabajo es preparar un proyecto para trabajar con OpenSpec y el kit de flujo git. Ejecuta cada paso con confirmación del usuario.

## Antes de empezar

Este skill se invoca en proyectos que ya tienen la carpeta `.claude/` copiada desde el proyecto SDD. Su trabajo es actualizar OpenSpec a la versión más reciente y crear los archivos de configuración del proyecto. Los skills de git (`01-git-branch`, `02-git-commit`, `03-git-merge`) ya están presentes — no hay que crearlos.

Muestra al usuario el directorio de trabajo actual y lo que vas a hacer:

```bash
pwd
ls -la
```

```
Voy a configurar este directorio como proyecto AI Kit:
  1. Verificar/instalar OpenSpec CLI
  2. Actualizar OpenSpec (openspec init --tools claude)
  3. Crear archivo VERSION con 0.1.0
  4. Crear openspec/config.yaml con plantilla base

¿Continuamos? (sí / no)
```

**ESPERA confirmación antes de empezar.**

## Paso 1 — Verificar OpenSpec CLI

```bash
openspec --version 2>/dev/null || echo "NOT_FOUND"
```

**Si está instalado:** muestra la versión y continúa al paso 2.

**Si no está instalado:**
```
OpenSpec CLI no encontrado. ¿Instalo ahora con:
  npm install -g @fission-ai/openspec@latest
? (sí / no)
```

Si confirma, ejecuta la instalación. Si rechaza, informa que el paso 2 no puede completarse y continúa con lo que sea posible.

## Paso 2 — Inicializar OpenSpec

Verifica si ya existe la carpeta `openspec/`:

```bash
ls openspec/ 2>/dev/null && echo "EXISTS" || echo "NOT_EXISTS"
```

**Si ya existe:** muestra "OpenSpec ya inicializado en este proyecto" y salta al paso 3.

**Si no existe:**
```
¿Inicializo OpenSpec en este directorio?
  openspec init --tools claude
(sí / no)
```

Si confirma, ejecuta:
```bash
openspec init --tools claude
```

Muestra el resultado. Si hay error, descríbelo y detente.

## Paso 3 — Crear archivo VERSION

```bash
cat VERSION 2>/dev/null || echo "NOT_FOUND"
```

**Si ya existe:** muestra el contenido y salta al paso 4.

**Si no existe:** crea el archivo con contenido `0.1.0` y confirma:
```
Creado: VERSION → 0.1.0
```

## Paso 4 — Crear openspec/config.yaml

```bash
cat openspec/config.yaml 2>/dev/null || echo "NOT_FOUND"
```

**Si ya existe:** muestra las primeras líneas y salta al resumen.

**Si no existe:** crea el archivo con esta plantilla:

```yaml
# Contexto del proyecto para agentes AI
# Completa las secciones marcadas con [COMPLETAR]

context:
  project: "[COMPLETAR: nombre del proyecto]"
  description: "[COMPLETAR: descripción en 1-2 líneas]"
  stack: "[COMPLETAR: tecnologías principales]"
  conventions:
    language: "español para descripciones, inglés para identificadores técnicos"
    commits: "Conventional Commits — tipo en inglés, descripción en español"
    branches: "v{version}/{tipo}/{descripcion} — ver .claude/skills/01-git-branch/references/"

rules:
  proposal:
    always_include:
      - "Sección 'No incluido en este cambio' para delimitar el scope"
  tasks:
    split_criterion: "cada tarea debe ser implementable de forma independiente"

operations:
  apply:
    guidance: "después de implementar cada tarea, usa /02-git-commit para commitear"
```

## Resumen final

Al terminar muestra:

```
Setup completado:
  ✓ OpenSpec CLI      → {version}
  ✓ openspec init     → .claude/skills/openspec-* instalados
  ✓ VERSION           → 0.1.0
  ✓ openspec/config.yaml → creado (pendiente completar)

Próximos pasos:
  1. Edita openspec/config.yaml con el contexto de este proyecto
  2. Adapta CLAUDE.md al proyecto
  3. Usa /opsx:propose para tu primer cambio
  4. Usa /01-git-branch cuando empieces a implementar
```

## Restricciones

- No ejecutes `npm install -g` sin confirmación explícita
- No ejecutes `openspec init` sin confirmación explícita
- Si cualquier paso falla, descríbelo claramente y pregunta cómo proceder
- Este skill no crea ramas ni hace commits — solo configura el entorno base
