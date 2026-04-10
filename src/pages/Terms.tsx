import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="scalo-landing flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Scalo" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      <main className="container flex-1 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-medium">Terminos y Condiciones</h1>

          <p className="mb-6 text-gray-400">Ultima actualizacion: {new Date().toLocaleDateString()}</p>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">1. Aceptacion de los Terminos</h2>
            <p className="text-gray-400">
              Al acceder y utilizar este sitio web, aceptas estar sujeto a estos terminos y condiciones de uso. Si no
              estas de acuerdo con alguna parte de estos terminos, no podras acceder al sitio web.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">2. Servicios</h2>
            <p className="text-gray-400">
              Scalo ofrece servicios de diseno web y marketing digital especializados para profesionales. Nuestros
              servicios incluyen:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-400">
              <li>Diseno y desarrollo de sitios web</li>
              <li>Optimizacion SEO</li>
              <li>Estrategias de marketing digital</li>
              <li>Consultoria y soporte tecnico</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">3. Propiedad Intelectual</h2>
            <p className="text-gray-400">
              Todo el contenido presente en este sitio web, incluyendo pero no limitado a textos, graficos, logotipos,
              imagenes, clips de audio, descargas digitales y compilaciones de datos, es propiedad de Scalo o sus
              proveedores de contenido y esta protegido por las leyes de propiedad intelectual.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">4. Limitacion de Responsabilidad</h2>
            <p className="text-gray-400">
              Scalo no sera responsable por cualquier dano directo, indirecto, incidental, consecuente o punitivo que
              surja del uso o la imposibilidad de usar nuestros servicios.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">5. Modificaciones</h2>
            <p className="text-gray-400">
              Nos reservamos el derecho de modificar estos terminos en cualquier momento. Las modificaciones entraran
              en vigor inmediatamente despues de su publicacion en el sitio web.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-medium">6. Contacto</h2>
            <p className="text-gray-400">
              Si tienes preguntas sobre estos Terminos y Condiciones, puedes contactarnos en{" "}
              <a href="mailto:scalo.online@gmail.com" className="text-white hover:underline">
                scalo.online@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
