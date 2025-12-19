"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function QuoteForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      website: formData.get("website"),
      message: formData.get("message"),
    }

    try {
      const response = await fetch("/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Error al enviar el formulario")
      }

      setIsSuccess(true)
      form.reset()
    } catch (err) {
      setError("Hubo un error al enviar el formulario. Por favor, intenta nuevamente.")
      console.error("Error sending email:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-[500] text-white">¡Gracias por contactarnos!</h3>
          <p className="text-white/90 font-light">
            Hemos recibido tu solicitud. Te responderemos dentro de las próximas 24 horas con una propuesta
            personalizada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 text-left">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/90">
            Nombre
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Tu nombre completo"
            className="bg-black border-gray-800 text-white placeholder:text-white/50"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/90">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            className="bg-black border-gray-800 text-white placeholder:text-white/50"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website" className="text-white/90">
          Sitio web actual (opcional)
        </Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          className="bg-black border-gray-800 text-white placeholder:text-white/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-white/90">
          ¿Qué necesitás?
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Contanos un poco sobre tu proyecto y objetivos..."
          className="min-h-[120px] bg-black border-gray-800 text-white placeholder:text-white/50"
          required
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-white hover:bg-white/90 text-black py-6 text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar solicitud"
        )}
      </Button>
    </form>
  )
}
