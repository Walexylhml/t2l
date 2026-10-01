import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = 'h2',
  className,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  as?: 'h1' | 'h2'
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl space-y-3">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.25em] text-brand-teal uppercase">
            {eyebrow}
          </p>
        )}
        <Tag className="font-display text-4xl leading-[0.95] tracking-wide text-balance uppercase sm:text-5xl lg:text-6xl">
          {title}
        </Tag>
        {description && (
          <p className="text-pretty leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
