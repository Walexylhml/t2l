import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Thoughts2Lyfe home"
      className={cn(
        'font-display text-2xl leading-none tracking-wide uppercase text-chrome transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring rounded-sm',
        className,
      )}
    >
      Thoughts<span className="px-px">2</span>Lyfe
    </Link>
  )
}
