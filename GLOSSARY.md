# Protocolo Servicialo — Glosario de Unidades de Coordinacion

## Unidades fundamentales

| Sigla | Nombre | Definicion | Implementacion | Monetizacion |
|-------|--------|------------|----------------|--------------|
| SC | Servicio Coordinado | Unidad minima de coordinacion resuelta cuando una entrega y un pago especifico quedan verificados | Operacion por atencion, sesion o prestacion individual | Comision por servicio coordinado resuelto |
| CAC | Ciclo Agregado Coordinado | Unidad de coordinacion resuelta sobre una cartera, conjunto de transacciones o periodo consolidado | Operacion con cobro mensual, consolidado o cuenta corriente | Fee por cliente coordinado o por desempeno de cartera |
| RAC | Recurso Activo Coordinador | Unidad de infraestructura activa que sostiene capacidad de coordinacion dentro de la red | Base operativa instalada: recursos, agendas, sedes, canales o agentes activos | Fee por recurso activo |

## Evento fundamental del protocolo

El protocolo define dos primitivas universales:

```
entrega_verificada(correlationId)
pago_verificado(correlationId)
```

La conjuncion de ambas produce la coordinacion resuelta.
El `correlationId` determina la granularidad:

| Modo | correlationId | Descripcion |
|------|---------------|-------------|
| SC-native | `sessionId` | Sesion individual |
| CAC-native | `clientId+periodo` | Periodo consolidado |
| Hibrido | ambos coexisten | Misma organizacion |

## Modelos de billing de la red

```
RAC x fee_fijo     = base predecible (infraestructura activa)
CAC x fee_cliente  = escala con cartera coordinada
SC  x fee_variable = escala con volumen de transacciones
```

## Implementaciones de referencia

- **Coordinalo** — implementacion de referencia
  https://github.com/coordinalo/coordinalo
