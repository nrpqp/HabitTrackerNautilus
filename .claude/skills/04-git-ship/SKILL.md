# Skill: Ship (rama + commit + push + merge en un solo paso)

Eres un asistente de flujo git. Combinas `01-git-branch` → `02-git-commit` → push → `03-git-merge` → bump de versión en una sola operación, con **una única confirmación** en vez de una por cada comando. Pensado para el ciclo repetitivo de "ya implementé el cambio, mándalo a main": evita pedir sí/no en cada paso cuando el usuario ya aprobó el flujo completo.

## El ciclo del proyecto: publicar primero, probar después

En este proyecto **publicar no es el final de la validación, es el principio**. El ciclo real es:

1. Se implementa y se verifica lo que se puede verificar desde el entorno de desarrollo.
2. Se manda a `main` y se pushea.
3. **Recién ahí** el usuario prueba en sus dispositivos móviles (iOS, Android) sobre lo publicado, y reporta lo que encuentre.

Por lo tanto: **no preguntes si conviene esperar a probar en un dispositivo real antes de shippear.** Que falte esa prueba es el estado normal y esperado al momento de publicar, no un motivo de duda. Shippeá, y dejá que el usuario pruebe después.

Sí corresponde **mencionar** en el cuerpo del commit qué quedó sin verificar (una línea, p. ej. "No probado aún en dispositivo real"), para que el historial lo registre — pero como dato, no como pregunta.

## Cuándo usar este skill en vez de los individuales

- El usuario pide explícitamente enviar/shippear/subir un cambio ya implementado a `main` (p. ej. "dale con todo el flujo", "shippealo", "manda esto a main").
- El usuario ya confirmó una vez que quiere branch+commit+push+merge sin pausas intermedias para este cambio.

Usa los skills individuales (`01-git-branch`, `02-git-commit`, `03-git-merge`) en su lugar cuando:
- El usuario pide un paso puntual y no el ciclo completo.
- El cambio es sensible, esperás conflictos, o el usuario quiere revisar cada mensaje/nombre por separado.

## Paso 1 — Leer el estado

```bash
git branch --show-current
git status --short
git diff --stat
cat VERSION
```

Si hay cambios sin commitear y la rama activa ya es una rama de feature/fix (no `main`), reusala tal cual — no crear una rama nueva encima. Si la rama activa es `main`, se crea una rama nueva siguiendo la Sección 2/3 de `01-git-branch/references/git-branching-strategy.md`.

## Paso 2 — Armar el plan completo de una vez

Determiná en un solo pase, sin preguntar por partes:
- **Rama**: `v{VERSION}/{tipo}/{descripcion-corta}` (mismas reglas que `01-git-branch`) — o "se reutiliza la actual" si ya corresponde.
- **Commit**: tipo + scope + descripción en español, Conventional Commits (mismas reglas que `02-git-commit`), leyendo el `proposal.md` activo de OpenSpec si existe, o el contexto de la conversación si no.
- **Bump de versión sugerido**: patch para `fix`, minor para `feat`, ninguno para `chore`/`refactor`/`docs` salvo que el usuario pida lo contrario — mostralo como parte del plan, no lo apliques todavía.

## Paso 3 — Mostrar el plan completo y pedir UNA sola confirmación

```
Plan de envío:
  Rama:     v0.8.0/fix/nombre-rama (nueva, desde main)
  Commit:   fix(ui): descripcion del cambio
            <resumen del cuerpo en 1-2 lineas>
  Merge:    → main (--no-ff)
  Versión:  0.8.0 → 0.8.1 (patch)

¿Confirmas todo el flujo? (sí / no / editar)
```

**ESPERA la respuesta del usuario antes de ejecutar nada.** Si pide editar una parte (nombre de rama, mensaje, si bumpear versión o no), ajustá y volvé a mostrar el plan completo — no ejecutes con un plan a medio confirmar.

## Paso 4 — Ejecutar todo en secuencia, sin pausas intermedias

Con la confirmación del Paso 3, ejecutá en orden y mostrá el resultado de cada comando a medida que corre (no hace falta parar a preguntar entre uno y otro):

```bash
git checkout -b {rama}              # sólo si Paso 2 decidió crear una nueva
git add -A
git commit -m "{mensaje completo}"
git push -u origin {rama}
git checkout main
git merge --no-ff {rama} -m "Merge branch '{rama}'"
```

Si el merge tiene conflictos: parar, describir qué archivos chocan, y esperar instrucción — nunca resolver solo.

Si el Paso 2 incluía bump de versión y no hubo conflictos:

```bash
echo "{nueva_version}" > VERSION
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json')); p.version='{nueva_version}'; fs.writeFileSync('package.json', JSON.stringify(p, null, 2)+'\n');"
git add VERSION package.json
git commit -m "chore: actualizar version a {nueva_version}"
```

```bash
git push origin main
```

## Paso 5 — Resumen final y limpieza opcional

Mostrá el resumen (mismo formato que `03-git-merge`, Paso 8) y preguntá **una sola vez** si se borra la rama de feature/fix (local + remota juntas, no por separado):

```
¿Eliminar la rama v0.8.0/fix/nombre-rama (local y remota)?
(sí / no)
```

## Restricciones

- Nunca `git push --force`, nunca `--no-verify`, nunca saltar hooks.
- Nunca ejecutar el Paso 4 sin la confirmación explícita del Paso 3 — "una sola confirmación" significa una, no cero.
- Si hay conflictos de merge: detenerse y describirlos, no resolverlos automáticamente.
- **No preguntar si conviene esperar a probar en un dispositivo real**: publicar es el paso previo a esa prueba, no el posterior (ver "El ciclo del proyecto" arriba). Anotá lo no verificado en el cuerpo del commit y seguí.
- Esta es la única automatización del proyecto que encadena push+merge sin paradas intermedias; para cualquier otra combinación de comandos git seguí pidiendo confirmación paso a paso con los skills individuales.
