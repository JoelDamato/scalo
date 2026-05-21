import { useEffect } from "react";
import studioBloomEmbedHtml from "../../public/studio-bloom-embed.html?raw";

export default function StudioBloom() {
  useEffect(() => {
    document.title = "Studio Bloom x Scalo";
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <iframe
        srcDoc={studioBloomEmbedHtml}
        title="Studio Bloom x Scalo"
        className="h-full w-full border-0"
      />
    </main>
  );
}
