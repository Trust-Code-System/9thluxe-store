"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { Reveal } from "@/components/motion"
import { cn } from "@/lib/utils"

const OCCASIONS = [
  { value: "daily", label: "Everyday wear" },
  { value: "evening", label: "Evening / special occasions" },
  { value: "work", label: "Office / professional" },
  { value: "date", label: "Date night" },
]

const NOTES = [
  { value: "citrus", label: "Citrus" },
  { value: "rose", label: "Rose" },
  { value: "oud", label: "Oud" },
  { value: "vanilla", label: "Vanilla" },
  { value: "woody", label: "Woody" },
  { value: "amber", label: "Amber" },
  { value: "sandalwood", label: "Sandalwood" },
  { value: "bergamot", label: "Bergamot" },
  { value: "patchouli", label: "Patchouli" },
]

const INTENSITY = [
  { value: "light", label: "Light & fresh" },
  { value: "medium", label: "Moderate" },
  { value: "bold", label: "Bold & long-lasting" },
]

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "h-11 cursor-pointer border px-5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all duration-200",
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-accent/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function QuestionBlock({
  index,
  title,
  hint,
  children,
}: {
  index: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="border-t border-border py-8">
      <legend className="sr-only">{title}</legend>
      <div className="grid gap-5 sm:grid-cols-[3rem_1fr]">
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">
          {String(index).padStart(2, "0")}
        </span>
        <div>
          <p className="font-serif text-2xl font-light">{title}</p>
          {hint && (
            <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">{children}</div>
        </div>
      </div>
    </fieldset>
  )
}

export default function FindYourFragrancePage() {
  const router = useRouter()
  const [occasion, setOccasion] = useState<string>("")
  const [notes, setNotes] = useState<string[]>([])
  const [intensity, setIntensity] = useState<string>("")

  const toggleNote = (value: string) => {
    setNotes((prev) =>
      prev.includes(value) ? prev.filter((n) => n !== value) : [...prev, value]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (occasion) params.set("occasion", occasion)
    if (notes.length) params.set("note", notes[0])
    if (intensity) params.set("intensity", intensity)
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <MainLayout>
      <section
        data-surface="night"
        className="veil grain relative min-h-[80vh] bg-background text-foreground"
      >
        <div className="container relative z-10 mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
          <Reveal>
            <div className="mb-12">
              <span className="eyebrow">Find your scent</span>
              <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
                Compose your <em className="text-accent">profile</em>.
              </h1>
              <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                Three questions, no wrong answers. Prefer to talk it through?{" "}
                <a
                  href="/concierge"
                  className="text-accent underline underline-offset-4 transition-opacity hover:opacity-80"
                >
                  Ask the Scent Concierge
                </a>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={handleSubmit}>
              <QuestionBlock index={1} title="When will you wear it?">
                {OCCASIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={occasion === opt.value}
                    onClick={() => setOccasion(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </QuestionBlock>

              <QuestionBlock
                index={2}
                title="Which notes call to you?"
                hint="Pick one or more."
              >
                {NOTES.map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={notes.includes(opt.value)}
                    onClick={() => toggleNote(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </QuestionBlock>

              <QuestionBlock index={3} title="How loud should it speak?">
                {INTENSITY.map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={intensity === opt.value}
                    onClick={() => setIntensity(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </QuestionBlock>

              <div className="border-t border-border pt-8">
                <button
                  type="submit"
                  className="group inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2.5 bg-primary px-8 font-mono text-[12px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Find my fragrances
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </form>
          </Reveal>
        </div>
      </section>
    </MainLayout>
  )
}
