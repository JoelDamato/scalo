import { useEffect } from "react";
import studioBloomFinanceEmbedHtml from "../../public/studio-bloom-finanzas-embed.html?raw";

export default function StudioBloomFinance() {
  useEffect(() => {
    document.title = "Studio Bloom x Scalo — Gestión financiera";
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <iframe
        srcDoc={studioBloomFinanceEmbedHtml}
        title="Studio Bloom x Scalo — Gestión financiera"
        className="h-full w-full border-0"
      />
    </main>
  );
}
