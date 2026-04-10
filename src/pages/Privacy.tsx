import { Link } from "react-router-dom";

export default function Privacy() {
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
          <h1 className="mb-8 text-4xl font-medium">Politica de Privacidad</h1>

          <p className="mb-6 text-gray-400">Ultima actualizacion: {new Date().toLocaleDateString()}</p>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">1. Informacion que Recopilamos</h2>
            <p className="text-gray-400">En Scalo, recopilamos informacion que nos proporcionas directamente cuando:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-400">
              <li>Te comunicas con nosotros a traves del formulario de contacto</li>
              <li>Programas una consulta o llamada</li>
              <li>Te suscribes a nuestro newsletter</li>
              <li>Interactuas con nuestro sitio web</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">2. Uso de la Informacion</h2>
            <p className="text-gray-400">Utilizamos la informacion recopilada para:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-400">
              <li>Proporcionar y mantener nuestros servicios</li>
              <li>Responder a tus consultas y solicitudes</li>
              <li>Mejorar nuestro sitio web y servicios</li>
              <li>Enviar informacion relevante sobre nuestros servicios</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-medium">3. Proteccion de Datos</h2>
            <p className="text-gray-400">
              Implementamos medidas de seguridad apropiadas para proteger tu informacion personal contra acceso,
              alteracion, divulgacion o destruccion no autorizada. Sin embargo, ningun metodo de transmision por
              Internet o metodo de almacenamiento electronico es 100% seguro.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-medium">4. Contacto</h2>
            <p className="text-gray-400">
              Si tienes preguntas sobre esta Politica de Privacidad, puedes contactarnos en{" "}
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
