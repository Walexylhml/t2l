import { cn } from '@/lib/utils'

type PillVariant = 'solid' | 'outline' | 'ghost'
type PillSize = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0'

const variants: Record<PillVariant, string> = {
  solid:
    'bg-primary text-primary-foreground shadow-[0_8px_30px_-8px_oklch(0.97_0.004_290/35%)] hover:bg-primary/90 hover:shadow-[0_10px_40px_-8px_oklch(0.63_0.24_296/55%)]',
  outline:
    'border border-foreground/25 bg-foreground/5 text-foreground backdrop-blur-sm hover:border-foreground/50 hover:bg-foreground/10',
  ghost: 'text-foreground hover:bg-foreground/10',
}

const sizes: Record<PillSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
}

export function pillClass(
  { variant = 'solid', size = 'md' }: { variant?: PillVariant; size?: PillSize } = {},
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className)
}
