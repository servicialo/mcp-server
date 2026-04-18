# Protocolo Servicialo — Glosario

El protocolo opera sobre dos capas conceptuales distintas:

- **Primitivas de evento** — lo que emite la red al resolver 
  coordinación.
- **Modelos de billing** — cómo se monetiza sobre esos eventos.

Mezclar ambas capas genera ambigüedad. Este glosario las 
mantiene separadas.

---

## 1. Evento fundamental

El protocolo define dos primitivas universales:

    entrega_verificada(correlationId)
    pago_verificado(correlationId)

Su conjunción produce la coordinación resuelta. El 
`correlationId` determina la granularidad del evento.

---

## 2. Primitivas de evento (lo que emite la red)

| Sigla | Nombre | Definición | correlationId |
|-------|--------|------------|---------------|
| SC | Servicio Coordinado | Unidad mínima de coordinación resuelta. Existe cuando una entrega específica y su pago asociado quedan verificados. | `sessionId` |
| CAC | Ciclo Agregado Coordinado | Unidad de coordinación resuelta sobre una cartera o período consolidado. Existe cuando la coordinación se evalúa a nivel de conjunto, no por evento aislado. | `clientId + periodo` |

Una organización puede operar en modelo SC-nativo, CAC-nativo 
o híbrido. El protocolo soporta los tres sin distinción.

---

## 3. Modelos de billing (cómo se cobra sobre los eventos)

| Sigla | Qué cobra | Sobre qué evento |
|-------|-----------|------------------|
| SC billing | Comisión por servicio resuelto | Cada evento SC |
| CAC billing | Fee por cliente coordinado en el período | Cada evento CAC |
| RAC billing | Fee por recurso activo | Base instalada, no evento |

Las tres modalidades pueden coexistir en una misma 
organización sobre la misma red.

---

## 4. Medida de capacidad (PdC)

- **RC — Recursos Coordinados**: cantidad de recursos 
  (profesionales, sedes, agentes, canales) que participaron 
  al menos en un SC durante el período. Componente de la 
  Prueba de Coordinación: `PdC = f(SC, CC, RC)`.

RC y RAC refieren a la misma realidad operativa (recursos 
activos) observada desde ángulos distintos: RAC es unidad de 
billing de infraestructura; RC es medida de capacidad activa 
para el cálculo del PdC.

---

## 5. Implementaciones de referencia

- **Coordinalo** — implementación de referencia en producción 
  (Mamá Pro, go-live 31 marzo 2026).
