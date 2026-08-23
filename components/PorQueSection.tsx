import { SectionTitle } from "./SectionTitle";

// § 02 — El porqué, antes del modelo. Dos argumentos distintos:
//   (a) por qué esto tiene que ser un protocolo y no un producto;
//   (b) por qué existe — quién define el objeto determina de quién es el registro.
// Cierra con arte previo y trabajo adyacente, sin reclamar prioridad.

// Enlaces canónicos verificados por el autor: RAILS (arXiv), AP2 y la
// OpenActive Open Booking API.
// TODO(autor): FHIR y GS1 EPCIS quedan nombrados sin enlace — sus URLs
// canónicas no están verificadas. Enlazarlos cuando lo estén.

export function PorQueSection() {
  return (
    <section id="por-que" className="mb-16 md:mb-24 scroll-mt-16">
      <SectionTitle
        tag="02 — Por qué un protocolo"
        title="Por qué protocolo y no producto"
        subtitle="La diferencia no es de tamaño ni de ambición: es que dos de los tres problemas anteriores no admiten solución de producto."
      />

      <div className="space-y-5 mb-10 md:mb-12 max-w-[640px]">
        <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
          Un producto puede resolver el primer problema para sus propios
          usuarios: guardar bien la evidencia y devolvérsela a quien la generó.
          No puede resolver el segundo, porque el problema N×M es precisamente
          el de sistemas que no comparten dueño; un producto que lo resolviera
          para todos tendría que ser adoptado por todos, y sería entonces el
          intermediario del que la declaración de rol dice que no hay que
          depender.
        </p>
        <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
          Por eso lo que se publica es una especificación bajo Apache-2.0, no
          un servicio. Cualquier plataforma puede implementarla sin permiso, y
          una implementación es conforme sin registrarse en ninguna red ni
          compartir dato alguno. El costo de esa decisión es real: sin producto
          no hay distribución, y la adopción hay que ganarla documento por
          documento.
        </p>
      </div>

      {/* Argumento de autoría */}
      <div className="border-t border-border pt-8 md:pt-9 mb-10 md:mb-12">
        <h3 className="font-serif text-[22px] md:text-[26px] font-medium text-text leading-[1.2] mb-5">
          Por qué existe
        </h3>
        <div className="space-y-5 max-w-[640px]">
          <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
            Esta función va a ser definida por alguien. El volumen agéntico lo
            obliga: en cuanto un agente coordina servicios a escala necesita
            saber qué cuenta como entrega y qué cuenta como prueba, y si nadie
            lo escribió, lo escribe de facto el primero que llegue con
            tracción.
          </p>
          <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
            Quien define el objeto determina de quién es el registro. Si el
            objeto lo define el runtime de una plataforma, la evidencia es de
            la plataforma y el profesional la usa prestada. Si lo define una
            vertical, la evidencia existe pero no cruza: sirve dentro de salud,
            o dentro de educación, y se detiene en el borde. Si lo define una
            especificación neutral, la evidencia es del profesional y viaja con
            él.
          </p>
          <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
            Este no es un argumento de que Servicialo sea esa especificación.
            Es el argumento de por qué conviene que exista alguna, y por qué
            esta está escrita. Si otra la define mejor, el resultado buscado
            igual se cumple.
          </p>
          {/* Línea no normativa: enuncia el principio, no obliga. La cláusula
              con lenguaje RFC 2119 se publica cuando exista el mecanismo que
              la haga verificable, no antes. */}
          <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
            De ese argumento se sigue una consecuencia directa: la
            portabilidad del registro es un principio del protocolo — si la
            evidencia es del profesional, tiene que poder salir. Su
            especificación normativa está en desarrollo y todavía no forma
            parte del documento.
          </p>
        </div>
      </div>

      {/* Arte previo y trabajo adyacente */}
      <div className="border border-border bg-surface-alt py-5 px-5 md:px-6 mb-8">
        <div className="font-mono text-[10px] font-semibold text-text uppercase tracking-[0.1em] mb-3">
          Arte previo y trabajo adyacente
        </div>
        <p className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.75] mb-4">
          Nada de esto se inventa en un vacío. Hay modelado de dominio con años
          de producción encima — la{" "}
          <a
            href="https://openactive.io/open-booking-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-text underline decoration-border hover:decoration-accent hover:text-accent underline-offset-4 transition-colors"
          >
            Open Booking API de OpenActive
          </a>{" "}
          en booking,{" "}
          <strong className="font-semibold text-text">FHIR</strong> en salud,{" "}
          <strong className="font-semibold text-text">GS1 EPCIS</strong> en
          eventos de bienes — y una línea de trabajo reciente sobre la capa
          agéntica:{" "}
          <a
            href="https://ap2-protocol.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-text underline decoration-border hover:decoration-accent hover:text-accent underline-offset-4 transition-colors"
          >
            AP2
          </a>{" "}
          en autorización, y{" "}
          <a
            href="https://arxiv.org/abs/2606.08790"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-text underline decoration-border hover:decoration-accent hover:text-accent underline-offset-4 transition-colors"
          >
            RAILS: Verification-Native Clearing For Agentic Commerce
          </a>{" "}
          (de Valois-Franklin y Bogdan, Evolutionairy AI, junio 2026) en
          clearing y verificación de obligaciones.
        </p>
        <p className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.75] mb-4">
          Servicialo se posiciona como complementario, no como reemplazo. Esos
          trabajos modelan el mecanismo de verificación y clearing; Servicialo
          modela los objetos de dominio que ese mecanismo consume, para
          servicios prestados por humanos: qué se prometió, qué entrega
          concreta ocurrió, qué la respalda. No reclama prioridad sobre ninguno
          de ellos.
        </p>
        <p className="text-[12px] text-text-muted leading-[1.7]">
          El mapeo concreto entre los objetos de Servicialo y cada uno de estos
          estándares — perfiles de interoperabilidad, correspondencia de campos
          — no está especificado hoy y no se presenta como si lo estuviera.
        </p>
      </div>

      {/* Enlace cruzado al manifiesto: el porqué filosófico no vive acá.
          TODO(autor): el contenido de grupodigitalo.com/manifiesto no se pudo
          leer al escribir esto, así que el reparto — manifiesto = porqué
          filosófico, spec = cómo técnico — está enunciado sin verificar contra
          el texto. Falta además el enlace recíproco desde el manifiesto hacia
          /spec, que vive en otro sitio y no se toca desde este repo. */}
      <p className="max-w-[640px] font-serif text-[15px] md:text-[16px] text-text-body leading-[1.75]">
        El argumento filosófico completo — por qué la soberanía del registro
        importa, y para quién — vive en el{" "}
        <a
          href="https://grupodigitalo.com/manifiesto"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          manifiesto de Grupo Digitalo
        </a>
        . Esta página y la{" "}
        <a
          href="/spec"
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          especificación
        </a>{" "}
        son el cómo técnico: qué obliga el protocolo, y qué no.
      </p>
    </section>
  );
}
