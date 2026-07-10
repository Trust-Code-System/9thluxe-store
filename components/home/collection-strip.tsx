import Link from 'next/link'
import type { Collection } from '@/components/home/types'

type CollectionStripProps = {
  collections: Collection[]
}

export function CollectionStrip({ collections }: CollectionStripProps) {
  return (
    <section className="py-10">
      <div className="container mx-auto max-w-[1200px] px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.link}
              className="glass-panel glass-panel-soft flex flex-col justify-between rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(2,6,23,0.25)]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  {collection.title}
                </p>
                <h3 className="mt-2 text-lg font-serif font-semibold text-foreground">{collection.title}</h3>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">{collection.description}</div>
              <span className="mt-6 text-xs font-semibold uppercase tracking-[0.4em] text-primary">Browse →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
