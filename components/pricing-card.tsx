import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: string[]
  mostPopular?: boolean
}

export function PricingCard({ title, price, description, features, mostPopular }: PricingCardProps) {
  return (
    <Card className={cn("p-4 border-gray-800 bg-black", mostPopular && "border-2 border-primary")}>
      <div className="space-y-4">
        <h3 className="text-2xl font-[500]">{title}</h3>
        <p className="text-muted-foreground font-light">{description}</p>
        <div className="text-3xl font-bold">{price}</div>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full">Get Started</Button>
      </div>
    </Card>
  )
}
