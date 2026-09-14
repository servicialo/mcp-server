# docs/archive

Documentos históricos del whitepaper. Ninguno se sirve desde el sitio; su contenido no se edita.

## Originales sin estampar de los PDF servidos

Originales sin estampar de los PDF del whitepaper v0.9 (marzo 2026). Son la entrada de `scripts/stamp-whitepaper-archive-note.py`, que les antepone una página con la nota de archivo y escribe los binarios servidos en `public/docs/`.

| Archivo | Equivale a (antes del 2026-09-13) | md5 |
|---|---|---|
| `servicialo-whitepaper-v0.9-es.original.pdf` | `public/docs/servicialo-whitepaper.pdf` (19 pp.) | `1a2609f4dea572b10c3e5e9499914880` |
| `servicialo-whitepaper-v0.9-en.original.pdf` | `public/docs/servicialo-whitepaper-en.pdf` (18 pp.) | `8a596983332f7c0310388fe95c717839` |

El contenido de estos PDF es un corte histórico y no se edita. Los generadores originales son `scripts/generate-whitepaper-es.py` y `scripts/generate-whitepaper.py` (ReportLab); reproducen el texto de cada página de forma idéntica.

## Ediciones anteriores, nunca servidas

Dos ediciones anteriores a la v0.9 que estaban sueltas en el árbol — una en la raíz del repositorio, otra en `docs/` — sin nota de archivo, sin enlace desde el sitio y sin referencia desde ningún documento del repositorio. Se archivan aquí tal cual, con el binario intacto: **no se estampan, porque no se sirven**; basta este README. Por la misma razón no llevan el sufijo `.original` de las filas anteriores — no son la entrada de ningún PDF servido ni tienen contraparte estampada.

En orden cronológico:

| Archivo | Procedencia en el árbol | Fecha del documento | Páginas | md5 |
|---|---|---|---|---|
| `servicialo-whitepaper-v1.2-es.pdf` | `servicialo-whitepaper.pdf` (raíz) | 2026-03-04 | 10 | `9958ed0ade26e96aa3d049accc8a5358` |
| `servicialo-whitepaper-v0.6.0-es.pdf` | `docs/whitepaper.pdf` | 2026-03-06 | 30 | `a8e7910da01976c0c58ac9dd9cc877a3` |

Las dos versiones no son comparables entre sí y ninguna corresponde al número del protocolo: la `v1.2` es la edición del documento de divulgación, la `v0.6.0` sí es una versión del protocolo, anterior a la v0.9.

### `servicialo-whitepaper-v1.2-es.pdf`

«servicialo — El estándar abierto para servicios profesionales en la era de agentes de inteligencia artificial», Franco Danioni, marzo 2026. Documento de divulgación en ocho secciones, no una especificación. Sus metadatos son anónimos (`/Author` y `/Title` son ambos `(anonymous)`), y el `v1.2` de la portada es la edición del documento: no existe ni existió un protocolo v1.2.

Habla en presente de capacidades que no están todas implementadas: «Servicialo ya está funcionando. No es una idea futura ni una promesa», un registro con descubrimiento, disponibilidad en tiempo real, emparejamiento multidimensional e inteligencia de mercado, y «ya opera con un caso real: una clínica con nueve profesionales».

### `servicialo-whitepaper-v0.6.0-es.pdf`

«Servicialo: Un Protocolo Abierto para la Orquestación de Servicios Profesionales en la Economía de Agentes de Inteligencia Artificial», versión 0.6.0, marzo 2026. Es una especificación, y anterior a toda la serie registrada: `CHANGELOG.md` no recoge ninguna v0.6.0 — salta de la v0.3 (febrero 2025) a la v0.7 del 10 de marzo de 2026, cuatro días después de este documento, y de ahí a v0.8, v0.9 y la vigente v0.10.

Declara **licencia MIT** en portada y en el resumen ejecutivo («un protocolo abierto, licenciado bajo MIT»). Describe un ciclo de vida de «9 estados universales» que «cualquier servicio debe recorrer», «estrictamente ordenados» — «no se pueden saltar estados universales», «la secuencia es invariante» —, auto-verificación tras una ventana de silencio, y un libro mayor (*ledger*) computado que «se actualiza automáticamente».

No lo genera `docs/generate_pdf.py`, pese a que ese script escribía justo en la ruta que este PDF ocupaba (`docs/whitepaper.pdf`). Su entrada, `docs/whitepaper.md`, es otro documento: «The Destination Layer for Human Services in the Age of AI Agents», en inglés, versión 1.0.0 y Apache-2.0. El binario archivado aquí ya estaba desalineado de esa entrada. El script conserva su `OUTPUT_FILE` original, de modo que ejecutarlo escribiría un PDF nuevo y distinto en la ruta ahora libre, no una copia de este.

### Advertencia: ninguno describe el estado vigente

La referencia normativa es `PROTOCOL.md` (v0.10, Apache-2.0), y `protocol/manifest.yaml` es la fuente única de versión, estados y herramientas. Divergencias que importan:

- **Licencia.** La v0.6.0 declara MIT. La licencia del proyecto es **Apache-2.0** (`LICENSE`, `protocol/manifest.yaml`).
- **«9 estados universales».** Retirados como tales: el ciclo vigente son **6 estados núcleo (obligatorios) + 3 financieros (opcionales)** (`PROTOCOL.md` §6). Los estados 7–9 ya no son universales, y una implementación puede gestionarlos por separado o no exponerlos.
- **Orden estricto e invariante.** El orden estricto rige ahora solo *dentro* de la secuencia que cada implementación expone (`PROTOCOL.md` §6.1). El protocolo «no establece un orden total entre entrega, evidencia, aceptación y liquidación» (§6.0): las cuatro dimensiones avanzan de forma independiente. La «secuencia invariante» de la v0.6.0 no sobrevive.
- **Auto-verificación tras ventana de silencio.** Sigue descrita en la especificación como disparador del estado `verified` (`PROTOCOL.md` §6, estado 9), pero **no está implementada**: no hay ventana de silencio ni verificación automática en `packages/mcp-server/`. `lifecycle.transition` exige un `actor` explícito en toda transición, `charged→verified` incluida.
- **Actualización automática del libro mayor.** No corre. `service_orders.get_ledger` figura en `specified_unimplemented_tools` de `protocol/manifest.yaml`, junto con el resto de la superficie de Órdenes de Servicio.

Estado vigente en [servicialo.com/spec](https://servicialo.com/spec).
