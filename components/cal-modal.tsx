"use client"

import { useEffect } from "react"

export function CalModal() {
  useEffect(() => {
    // Cargar el script de LeadConnector
    const script = document.createElement("script")
    script.src = "https://link.msgsndr.com/js/form_embed.js"
    script.type = "text/javascript"
    script.async = true

    // Agregar el script solo si no existe ya
    const existingScript = document.querySelector(`script[src="${script.src}"]`)
    if (!existingScript) {
      document.body.appendChild(script)
    }

    return () => {
      // Cleanup en desmontaje
      const scriptToRemove = document.querySelector(`script[src="${script.src}"]`)
      if (scriptToRemove && document.body.contains(scriptToRemove)) {
        document.body.removeChild(scriptToRemove)
      }
    }
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto bg-black text-white rounded-xl overflow-hidden border border-gray-800">
      <div className="p-6">
        <h3 className="text-2xl font-[500] mb-6 text-center">Agenda tu consulta</h3>
        <iframe
          src="https://api.leadconnectorhq.com/widget/booking/J0u1c5fQisXeeJlE6hiy"
          style={{
            width: "100%",
            border: "none",
            minHeight: "800px",
          }}
          scrolling="no"
          id="J0u1c5fQisXeeJlE6hiy_1766114296347"
          title="Reserva tu cita"
          allow="payment"
        />
      </div>
    </div>
  )
}
