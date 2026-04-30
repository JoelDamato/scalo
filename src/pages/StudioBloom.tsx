import { useEffect } from "react";

export default function StudioBloom() {
  useEffect(() => {
    document.title = "Studio Bloom x Scalo";
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <iframe
        src="/studio-bloom-embed.html"
        title="Studio Bloom x Scalo"
        className="h-full w-full border-0"
      />
    </main>
  );
}
