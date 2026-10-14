# Features del frontend móvil

Cada feature encapsula su propio contexto, hooks, servicios y lógica de pantalla para mantener la app más legible y mantenible.

## Bloques recomendados por feature

- context/
- hooks/
- services/
- types/
- utils/

## Principios

- la vista solo renderiza
- los hooks manejan la lógica del dominio
- shared concentra transporte, storage y utilidades comunes
- los sockets y eventos en tiempo real se mantienen separados del UI
