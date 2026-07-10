import { Shield, Truck, RotateCcw, CreditCard } from 'lucide-react'

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Secure Payment',
      note: 'Your data is safe',
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      note: 'On orders over ₦50,000',
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      note: '7-day comfort policy',
    },
    {
      icon: CreditCard,
      title: 'Trusted Platform',
      note: 'Paystack & Bank Transfer',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {badges.map((badge) => (
        <div
          key={badge.title}
          className="glass-panel glass-panel-soft flex flex-col items-center gap-3 rounded-[24px] px-4 py-6 text-center backdrop-blur-[20px]"
        >
          <badge.icon className="h-8 w-8 text-primary" />
          <div className="text-sm font-semibold tracking-tight">{badge.title}</div>
          <div className="text-xs text-muted-foreground">{badge.note}</div>
        </div>
      ))}
    </div>
  )
}



