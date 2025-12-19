import { NextResponse } from "next/server"
import emailjs from "@emailjs/browser"

// Configuración de EmailJS
const EMAILJS_KEY = process.env.EMAILJS_KEY || ""
const SERVICE_ID = "service_2yq3zwn"
const NOTIFICATION_TEMPLATE_ID = "template_9x4oglj"
const CONFIRMATION_TEMPLATE_ID = "template_13417hk"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validar datos
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Inicializar EmailJS con la clave del servidor
    emailjs.init(EMAILJS_KEY)

    // Enviar notificación al equipo
    await emailjs.send(SERVICE_ID, NOTIFICATION_TEMPLATE_ID, data)

    // Enviar confirmación al usuario
    await emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE_ID, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 })
  }
}
