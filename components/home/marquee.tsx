const PHRASES = [
  'Pop Culture',
  'Social Cause',
  'Custom Prints',
  'Heavyweight Cotton',
  'Small Batch',
  'Horror Heads',
]

export function Marquee() {
  const row = [...PHRASES, ...PHRASES]

  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-card/40 py-4" aria-hidden="true">
      <div className="flex w-max animate-marquee">
        {row.map((phrase, index) => (
          <span
            key={`${phrase}-${index}`}
            className="flex items-center gap-8 pr-8 font-display text-xl tracking-wider text-foreground/70 uppercase"
          >
            {phrase}
            <span className="size-2 rotate-45 bg-chrome" />
          </span>
        ))}
      </div>
    </div>
  )
}
