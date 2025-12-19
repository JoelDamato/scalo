import Link from "next/link"
import Image from "next/image"

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-[500] mb-8">Política de Privacidad</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400 mb-6">Última actualización: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-400 mb-4">
                En Scalo, recopilamos información que nos proporcionas directamente cuando:
              </p>
              <ul className="list-disc pl-6 text-gray-400 space-y-2">
                <li>Te comunicas con nosotros a través del formulario de contacto</li>
                <li>Programas una consulta o llamada</li>
                <li>Te suscribes a nuestro newsletter</li>
                <li>Interactúas con nuestro sitio web</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">2. Uso de la Información</h2>
              <p className="text-gray-400 mb-4">Utilizamos la información recopilada para:</p>
              <ul className="list-disc pl-6 text-gray-400 space-y-2">
                <li>Proporcionar y mantener nuestros servicios</li>
                <li>Responder a tus consultas y solicitudes</li>
                <li>Mejorar nuestro sitio web y servicios</li>
                <li>Enviar información relevante sobre nuestros servicios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">3. Protección de Datos</h2>
              <p className="text-gray-400">
                Implementamos medidas de seguridad apropiadas para proteger tu información personal contra acceso,
                alteración, divulgación o destrucción no autorizada. Sin embargo, ningún método de transmisión por
                Internet o método de almacenamiento electrónico es 100% seguro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-[500] mb-4">4. Contacto</h2>
              <p className="text-gray-400">
                Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en{" "}
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
