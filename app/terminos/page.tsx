import Link from "next/link"
import Image from "next/image"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Scalo" width={120} height={40} className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-[500] mb-8">Términos y Condiciones</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400 mb-6">Última actualización: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-400">
                Al acceder y utilizar este sitio web, aceptas estar sujeto a estos términos y condiciones de uso. Si no
                estás de acuerdo con alguna parte de estos términos, no podrás acceder al sitio web.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">2. Servicios</h2>
              <p className="text-gray-400 mb-4">
                Scalo ofrece servicios de diseño web y marketing digital especializados para profesionales de la salud
                mental. Nuestros servicios incluyen:
              </p>
              <ul className="list-disc pl-6 text-gray-400 space-y-2">
                <li>Diseño y desarrollo de sitios web</li>
                <li>Optimización SEO</li>
                <li>Estrategias de marketing digital</li>
                <li>Consultoría y soporte técnico</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">3. Propiedad Intelectual</h2>
              <p className="text-gray-400">
                Todo el contenido presente en este sitio web, incluyendo pero no limitado a textos, gráficos, logotipos,
                imágenes, clips de audio, descargas digitales y compilaciones de datos, es propiedad de Scalo o sus
                proveedores de contenido y está protegido por las leyes de propiedad intelectual.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">4. Limitación de Responsabilidad</h2>
              <p className="text-gray-400">
                Scalo no será responsable por cualquier daño directo, indirecto, incidental, consecuente o punitivo que
                surja del uso o la imposibilidad de usar nuestros servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">5. Modificaciones</h2>
              <p className="text-gray-400">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán
                en vigor inmediatamente después de su publicación en el sitio web.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">6. Contacto</h2>
              <p className="text-gray-400">
                Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos en{" "}
                <a href="mailto:scalo.online@gmail.com" className="text-white hover:underline">
                  scalo.online@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
