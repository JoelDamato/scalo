import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface LandingCTAButtonProps extends ButtonProps {
  scrollTo?: string;
}

export function LandingCTAButton({ scrollTo, children, onClick, ...props }: LandingCTAButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !scrollTo) {
      return;
    }

    document.querySelector(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Button
      onClick={handleClick}
      {...props}
      className={`transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(255,255,255,0.16)] ${props.className || ""}`}
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}
