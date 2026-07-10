interface CategoryHeaderProps {
  title: string
  subtitle: string
  description: string
}

export function CategoryHeader({ title, subtitle, description }: CategoryHeaderProps) {
  return (
    <section className="border-b border-border bg-background py-12 md:py-16">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-primary mb-4">{subtitle}</p>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  )
}





