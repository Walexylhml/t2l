import type { GarmentView, StudioSettings } from "@/lib/garments"

// ---------------------------------------------------------------------------
// Design Studio shared types + pricing. A customer's in-progress design is a
// set of "layers" placed on each view of the garment. Everything here is
// framework-free so the studio UI and (later) checkout can both use it.
// ---------------------------------------------------------------------------

export type LayerKind = "design" | "text"

export type PlacedLayer = {
  id: string
  kind: LayerKind
  // design layers
  designId?: string
  image?: string
  // text layers
  text?: string
  color?: string
  fontFamily?: string
  // transform, as percentages of the stage box (0..100)
  xPct: number // center x
  yPct: number // center y
  widthPct: number // width relative to stage width
  rotation: number // degrees
}

export type Placements = Record<GarmentView, PlacedLayer[]>

export function emptyPlacements(): Placements {
  return { front: [], back: [], arm: [] }
}

export function countLayers(placements: Placements): number {
  return (Object.values(placements) as PlacedLayer[][]).reduce(
    (sum, layers) => sum + layers.length,
    0
  )
}

// Default print area (the printable region) per view, as a box in stage
// percentages. Used to show a guide and to center newly added layers. These
// are sensible defaults for the placeholder garments; real mockups can refine
// them later.
export type PrintArea = { xPct: number; yPct: number; wPct: number; hPct: number }

export const PRINT_AREAS: Record<GarmentView, PrintArea> = {
  front: { xPct: 50, yPct: 46, wPct: 46, hPct: 52 },
  back: { xPct: 50, yPct: 44, wPct: 50, hPct: 56 },
  arm: { xPct: 50, yPct: 50, wPct: 24, hPct: 60 },
}

export type PriceLine = { label: string; amount: number }

export type PriceBreakdown = {
  base: number
  lines: PriceLine[]
  total: number
}

const VIEW_LABEL: Record<GarmentView, string> = {
  front: "Front print",
  back: "Back print",
  arm: "Arm print",
}

// Price = garment base + a print fee for each VIEW that has at least one design
// + a fee per text block. (A single configurable model; adjust the fees in the
// admin Garments tab, or change this rule if you want per-design pricing.)
export function computePrice(
  basePrice: number,
  placements: Placements,
  settings: StudioSettings
): PriceBreakdown {
  const feeByView: Record<GarmentView, number> = {
    front: settings.printFeeFront,
    back: settings.printFeeBack,
    arm: settings.printFeeArm,
  }

  const lines: PriceLine[] = []
  let textCount = 0

  ;(Object.keys(placements) as GarmentView[]).forEach((view) => {
    const layers = placements[view]
    if (layers.some((l) => l.kind === "design")) {
      const fee = feeByView[view]
      if (fee > 0) lines.push({ label: VIEW_LABEL[view], amount: fee })
    }
    textCount += layers.filter((l) => l.kind === "text").length
  })

  if (textCount > 0 && settings.textFee > 0) {
    lines.push({
      label: `Text ${textCount === 1 ? "block" : `blocks (${textCount})`}`,
      amount: textCount * settings.textFee,
    })
  }

  const total = basePrice + lines.reduce((sum, l) => sum + l.amount, 0)
  return { base: basePrice, lines, total }
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
