## Context

`cellState(habit, dayIndex)` en `src/store.js` es el único lugar donde se decide si una celda es editable. Actualmente retorna `'today' | 'unlocked' | 'locked'`. El renderer en `src/render/svg.js` usa ese valor para asignar clases CSS y registrar o no el event listener de click.

## Goals / Non-Goals

**Goals:**
- Extender `cellState` a 4 estados sin romper la interfaz que consume `svg.js`
- Congelar visualmente los días `old` sin eliminar su check almacenado
- Mantener compatibilidad con datos existentes en localStorage (no requiere migración)

**Non-Goals:**
- Hacer la ventana configurable por el usuario
- Permitir desmarcar días `old` ya marcados
- Añadir lógica de notificaciones (change separado)

## Decisions

### 1. Extender `cellState` en lugar de crear función nueva

`cellState` ya es la fuente de verdad consumida por `svg.js`. Añadir estados nuevos (`'yesterday'`, `'old'`) al mismo retorno es la extensión mínima: un solo cambio en `store.js` propaga el comportamiento correcto sin duplicar lógica.

_Alternativa descartada_: añadir `isEditable(habit, dayIndex)` como función separada. Requeriría dos llamadas por celda y fragmentaría la lógica de estado.

### 2. `yesterdayISO()` como utilidad en `date.js`

Calcular "ayer" en línea dentro de `cellState` es posible pero genera código duplicado si se necesita en otros lugares. Una función `yesterdayISO()` en `utils/date.js` mantiene la cohesión del módulo de fechas.

### 3. Días `old` marcados: visualmente completos, no clickeables

Los checks existentes representan logros reales. Eliminarlos o volverlos invisibles sería confuso y potencialmente frustrante. La solución es congelar el estado visual (mostrar el color del hábito) pero no registrar el event listener — exactamente como se hace con `locked`.

La diferencia visual entre `old` marcado y `locked` (futuro) debe ser clara: `old` marcado usa el color del hábito; `old` no marcado usa el color de "perdido" (gris oscuro); `locked` usa el color neutro actual.

## Risks / Trade-offs

- **Riesgo**: Usuario que acostumbraba registrar hábitos con varios días de retraso encontrará días bloqueados al actualizar.  
  → No hay migración de datos, pero sí un cambio de comportamiento perceptible. Es intencional per diseño.

- **Trade-off**: `old` no marcado se ve "igual" que `locked` en términos de no-interacción. Se distinguen por color/estilo pero no por acción — aceptable porque la semántica es la misma: "no puedes hacer nada aquí".
