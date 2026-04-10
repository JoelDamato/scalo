import { useEffect } from "react";

export function LandingCalEmbed() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://link.msgsndr.com/js/form_embed.js";
    script.type = "text/javascript";
    script.async = true;

    const existingScript = document.querySelector(`script[src="${script.src}"]`);
    if (!existingScript) {
      document.body.appendChild(script);
    }

    return () => {
      const currentScript = document.querySelector(`script[src="${script.src}"]`);
      if (currentScript && document.body.contains(currentScript)) {
        document.body.removeChild(currentScript);
      }
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-gray-800 bg-black text-white">
      <div className="p-6">
        <h3 className="mb-6 text-center text-2xl font-medium">Agenda tu consulta</h3>
        <iframe
          src="https://api.leadconnectorhq.com/widget/booking/J0u1c5fQisXeeJlE6hiy"
          title="Reserva tu cita"
          allow="payment"
          scrolling="no"
          className="min-h-[800px] w-full border-0"
        />
      </div>
    </div>
  );
}
