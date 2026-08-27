## Purpose

Sistema que asigna una identidad elemental a cada hábito para generar una progresión cromática única a lo largo de los 21 días del reto, con animaciones por fase y feedback visual de partículas al interactuar con las celdas.

## ADDED Requirements

### Requirement: Identidad elemental por hábito

El sistema SHALL asignar un elemento a cada hábito en el momento de su creación. Los siete elementos disponibles son: `fire`, `water`, `plant`, `lightning`, `ice`, `earth`, `air`. El elemento se auto-asigna por índice de slot (posición 0–6 en el array de hábitos), de forma cíclica si se reutiliza una posición. El campo `element` SHALL persistirse en localStorage junto con los demás datos del hábito.

#### Scenario: Auto-asignación al crear hábito

- **WHEN** el usuario añade un nuevo hábito y no especifica un elemento
- **THEN** el sistema asigna el elemento correspondiente al índice actual del hábito (`ELEMENTS[habits.length % 7]`) antes de guardar

#### Scenario: Persistencia del elemento

- **WHEN** el usuario recarga la aplicación
- **THEN** el elemento de cada hábito es el mismo que tenía antes de la recarga, leído desde localStorage

#### Scenario: Migración de hábitos existentes

- **WHEN** se carga un hábito desde localStorage que no tiene campo `element`
- **THEN** el sistema le asigna el elemento correspondiente a su posición en el array en ese momento, sin borrar ningún otro dato del hábito

### Requirement: Progresión cromática de 21 días

El sistema SHALL calcular el color de cada celda completada mediante interpolación lineal entre el color inicial (`t=0`) y el color final (`t=1`) del elemento activo, donde `t = dayIndex / 20`. Dos celdas de distinto día nunca SHALL tener el mismo color si pertenecen al mismo hábito y están completadas. Las celdas vacías y bloqueadas no participan de la interpolación.

#### Scenario: Color único por día

- **WHEN** una celda del día `d` está completada
- **THEN** su color se calcula como `hsl(h0 + (h1-h0)·t, s0 + (s1-s0)·t, l0 + (l1-l0)·t)` donde `t = d/20` y `(h0,s0,l0)` / `(h1,s1,l1)` son los extremos de la paleta del elemento

#### Scenario: Celda vacía no colorida

- **WHEN** una celda no está completada
- **THEN** se renderiza con el color neutro del tema (vacío/bloqueado/ayer), sin usar la paleta del elemento

#### Scenario: Cambio de elemento recalcula colores

- **WHEN** el usuario cambia el elemento de un hábito desde el sheet de edición
- **THEN** el SVG se re-renderiza con los nuevos colores interpolados para todas las celdas completadas de ese hábito

### Requirement: Animaciones de fase en celdas completadas

El sistema SHALL aplicar una animación CSS distinta a cada celda completada según la fase a la que pertenece su día:

- **Fase 1** (días 1–7): sin animación activa; la celda es estática con su color interpolado.
- **Fase 2** (días 8–14): la celda respira con una animación de opacidad cíclica lenta (aprox. 3–4 s por ciclo).
- **Fase 3** (días 15–21): la celda tiene una animación más intensa y rápida (aprox. 1.5–2 s por ciclo) con efecto de glow o brillo superior al de Fase 2.

Las animaciones SHALL respetar `prefers-reduced-motion: reduce`; en ese caso todas las celdas se muestran estáticas independientemente de la fase.

#### Scenario: Celda en Fase 1 no se mueve

- **WHEN** una celda del día 1 al 7 está completada y `prefers-reduced-motion` no está activo
- **THEN** la celda es completamente estática; no hay animación de opacidad ni movimiento

#### Scenario: Celda en Fase 2 pulsa suavemente

- **WHEN** una celda del día 8 al 14 está completada y `prefers-reduced-motion` no está activo
- **THEN** la celda tiene una animación de opacidad cíclica visible pero sutil

#### Scenario: Celda en Fase 3 tiene animación completa

- **WHEN** una celda del día 15 al 21 está completada y `prefers-reduced-motion` no está activo
- **THEN** la celda tiene una animación más intensa y rápida que la de Fase 2, con efecto de glow perceptible

#### Scenario: Sin animaciones con reduced-motion

- **WHEN** el sistema operativo o navegador tiene `prefers-reduced-motion: reduce` activo
- **THEN** todas las celdas completadas, independientemente de su fase, se muestran estáticas

### Requirement: Feedback de partículas al interactuar con celdas

El sistema SHALL mostrar un burst de partículas específicas del elemento al interactuar con una celda (marcar, desmarcar, o hacer click en una ya marcada). Las partículas se renderizan en un canvas overlay (`#effect-overlay`) posicionado sobre el SVG con `pointer-events: none`, de modo que el re-render del SVG no interrumpa ni elimine las partículas en vuelo. El burst SHALL constar siempre de 5–7 partículas independientemente de la fase de la celda (Opción C: base siempre satisfactoria).

#### Scenario: Partículas al marcar una celda

- **WHEN** el usuario hace click en la celda del día siguiente (siguiente a completar)
- **THEN** aparece un burst de partículas con la forma y movimiento específicos del elemento desde el centro de esa celda

#### Scenario: Partículas al visitar una celda ya completada

- **WHEN** el usuario hace click en una celda ya completada
- **THEN** aparece el mismo burst de partículas; el estado de la celda no cambia

#### Scenario: Partículas no se interrumpen por re-render del SVG

- **WHEN** el SVG se re-renderiza (por cualquier cambio de estado) mientras hay partículas en vuelo en el overlay
- **THEN** las partículas continúan su animación hasta el final sin verse afectadas

#### Scenario: Burst proporcional en milestone

- **WHEN** el usuario completa exactamente el día 7, 14 o 21
- **THEN** el burst de partículas es notablemente mayor (aprox. 20 partículas) y parte desde el centro del ring, adicionalmente al burst normal de la celda

### Requirement: Celebración de milestone

El sistema SHALL mostrar un toast de celebración cuando el usuario complete exactamente el día 7, 14 o 21 de cualquier hábito. El toast SHALL incluir un ícono, un título y una línea descriptiva específica del hito alcanzado. El toast desaparece automáticamente tras aprox. 2.5–3 s sin intervención del usuario.

#### Scenario: Milestone en día 7

- **WHEN** el usuario marca el día 7 de un hábito como completado
- **THEN** aparece un toast con el mensaje de primera semana completada y desaparece automáticamente

#### Scenario: Milestone en día 14

- **WHEN** el usuario marca el día 14 de un hábito como completado
- **THEN** aparece un toast con el mensaje de dos semanas completadas y desaparece automáticamente

#### Scenario: Milestone en día 21

- **WHEN** el usuario marca el día 21 de un hábito como completado
- **THEN** aparece un toast con el mensaje de reto completo y desaparece automáticamente

#### Scenario: Sin milestone en días intermedios

- **WHEN** el usuario marca cualquier día que no sea 7, 14 ni 21
- **THEN** no aparece ningún toast de milestone; solo ocurre el burst normal de partículas
