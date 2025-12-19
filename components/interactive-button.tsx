"use client" import { Button } from "@/components/ui/button" 
import { ChevronRight } from "lucide-react" 
import type { ButtonProps } from "@/components/ui/button" 

interface InteractiveButtonProps extends ButtonProps { scrollTo?: string } export function InteractiveButton({ scrollTo, children, ...props }: InteractiveButtonProps) { const handleClick = () => { if (scrollTo) { document.querySelector(scrollTo)?.scrollIntoView({ behavior: "smooth" }) } } return ( <Button onClick={handleClick} {...props}> {children} <ChevronRight className="ml-2 h-4 w-4" /> </Button> ) }.
