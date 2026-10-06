"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { formatPrice } from "@/lib/products"
import {
  getGarments,
  getStudioSettings,
  VIEW_LABELS,
  DEFAULT_STUDIO_SETTINGS,
  type Garment,
  type GarmentView,
  type StudioSettings,
} from "@/lib/garments"
import { getDesigns, PLACEMENT_LABELS, type Design, type DesignPlacement } from "@/lib/designs"
import {
  computePrice,
  emptyPlacements,
  PRINT_AREAS,
  uid,
  type PlacedLayer,
  type Placements,
} from "@/lib/studio"

const FILTERS: ("all" | GarmentView)[] = ["all", "front", "back", "arm"]
const FONT_OPTIONS = [
  { label: "Display", value: "var(--font-anton), system-ui, sans-serif" },
  { label: "Sans", value: "var(--font-inter), system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'Courier New', monospace" },
]

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

// A simple generic t-shirt silhouette used as a placeholder garment. Tinted by
// the chosen color; swapped for a real mockup once one is uploaded in admin.
function GarmentSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 400 480" className="h-full w-full" aria-hidden="true">
      <path
        d="M140 40 L100 70 L40 120 L70 180 L110 160 L110 430 Q110 450 130 450 L270 450 Q290 450 290 430 L290 160 L330 180 L360 120 L300 70 L260 40 Q230 72 200 72 Q170 72 140 40 Z"
        fill={color}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="2"
      />
    </svg>
  )
}

type Gesture = {
  id: string
  mode: "move" | "resize" | "rotate"
  originView: GarmentView
  startX: number
  startY: number
  origin: PlacedLayer
  startDist: number
  startAngle: number
  cx: number
  cy: number
}

export function Studio() {
  const [loading, setLoading] = useState(true)
  const [garments, setGarments] = useState<Garment[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS)

  const [garment, setGarment] = useState<Garment | null>(null)
  const [size, setSize] = useState<string>("")
  const [color, setColor] = useState<string | null>(null)
  const [view, setView] = useState<GarmentView>("front")
  const [filter, setFilter] = useState<"all" | GarmentView>("all")
  const [placements, setPlacements] = useState<Placements>(emptyPlacements())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const stageRef = useRef<HTMLDivElement>(null)
  const stageWidthRef = useRef<number>(400)
  const [, forceTick] = useState(0)
  const gesture = useRef<Gesture | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [g, d, s] = await Promise.all([getGarments(), getDesigns(), getStudioSettings()])
        if (!active) return
        setGarments(g)
        setDesigns(d)
        setSettings(s)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // Track the stage pixel width so text layers can be sized in px.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      stageWidthRef.current = el.getBoundingClientRect().width
      forceTick((t) => t + 1)
    })
    ro.observe(el)
    stageWidthRef.current = el.getBoundingClientRect().width
    return () => ro.disconnect()
  }, [garment])

  function chooseGarment(g: Garment) {
    setGarment(g)
    setSize(g.sizes[0] ?? "")
    setColor(g.colors[0] ?? null)
    setView((g.views[0] as GarmentView) ?? "front")
    setPlacements(emptyPlacements())
    setSelectedId(null)
    setFilter("all")
  }

  const layers = garment ? placements[view] : []
  const mockup =
    garment && (view === "front" ? garment.imageFront : view === "back" ? garment.imageBack : garment.imageArm)

  const q = search.trim().toLowerCase()
  const visibleDesigns = designs.filter((d) => {
    const okFilter = filter === "all" ? true : d.placement === filter || d.placement === "any"
    const okSearch = q === "" ? true : d.name.toLowerCase().includes(q)
    return okFilter && okSearch
  })

  function addLayer(layer: Omit<PlacedLayer, "id">) {
    const id = uid()
    setPlacements((prev) => {
      // Stagger each new layer slightly so they don't stack exactly on top
      // of each other (which made them hard to select/delete).
      const off = (prev[view].length % 6) * 3
      const placed: PlacedLayer = {
        ...layer,
        id,
        xPct: clamp(layer.xPct + off, 4, 96),
        yPct: clamp(layer.yPct + off, 4, 96),
      }
      return { ...prev, [view]: [...prev[view], placed] }
    })
    setSelectedId(id)
  }

  function addDesignCentered(design: Design) {
    const area = PRINT_AREAS[view]
    addLayer({
      kind: "design",
      designId: design.id,
      image: design.image,
      xPct: area.xPct,
      yPct: area.yPct,
      widthPct: Math.min(30, area.wPct * 0.7),
      rotation: 0,
    })
  }

  function addDesignAt(design: Design, xPct: number, yPct: number) {
    const area = PRINT_AREAS[view]
    addLayer({
      kind: "design",
      designId: design.id,
      image: design.image,
      xPct: clamp(xPct, area.xPct - area.wPct / 2, area.xPct + area.wPct / 2),
      yPct: clamp(yPct, area.yPct - area.hPct / 2, area.yPct + area.hPct / 2),
      widthPct: Math.min(30, area.wPct * 0.7),
      rotation: 0,
    })
  }

  function addText() {
    const area = PRINT_AREAS[view]
    addLayer({
      kind: "text",
      text: "YOUR TEXT",
      color: "#111111",
      fontFamily: FONT_OPTIONS[0].value,
      xPct: area.xPct,
      yPct: area.yPct,
      widthPct: 24,
      rotation: 0,
    })
  }

  function updateSelected(patch: Partial<PlacedLayer>) {
    if (!selectedId) return
    setPlacements((prev) => ({
      ...prev,
      [view]: prev[view].map((l) => (l.id === selectedId ? { ...l, ...patch } : l)),
    }))
  }

  function removeLayer(id: string) {
    setPlacements((prev) => ({ ...prev, [view]: prev[view].filter((l) => l.id !== id) }))
    setSelectedId((cur) => (cur === id ? null : cur))
  }

  // ---- pointer gestures (move / resize / rotate) --------------------------
  const onPointerMove = useCallback((e: PointerEvent) => {
    const g = gesture.current
    const el = stageRef.current
    if (!g || !el) return
    const r = el.getBoundingClientRect()
    setPlacements((prev) => {
      const list = prev[g.originView]
      return {
        ...prev,
        [g.originView]: list.map((l) => {
          if (l.id !== g.id) return l
          if (g.mode === "move") {
            const dxPct = ((e.clientX - g.startX) / r.width) * 100
            const dyPct = ((e.clientY - g.startY) / r.height) * 100
            return {
              ...l,
              xPct: clamp(g.origin.xPct + dxPct, 2, 98),
              yPct: clamp(g.origin.yPct + dyPct, 2, 98),
            }
          }
          if (g.mode === "resize") {
            const dist = Math.hypot(e.clientX - g.cx, e.clientY - g.cy)
            const scale = dist / g.startDist
            return { ...l, widthPct: clamp(g.origin.widthPct * scale, 6, 100) }
          }
          // rotate
          const ang = (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180) / Math.PI
          return { ...l, rotation: g.origin.rotation + (ang - g.startAngle) }
        }),
      }
    })
  }, [])

  const endGesture = useCallback(() => {
    gesture.current = null
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerup", endGesture)
  }, [onPointerMove])

  function startGesture(
    e: React.PointerEvent,
    layer: PlacedLayer,
    mode: "move" | "resize" | "rotate"
  ) {
    e.stopPropagation()
    e.preventDefault()
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + (layer.xPct / 100) * r.width
    const cy = r.top + (layer.yPct / 100) * r.height
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    gesture.current = {
      id: layer.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...layer },
      startDist: Math.hypot(dx, dy) || 1,
      startAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
      cx,
      cy,
      originView: view,
    }
    setSelectedId(layer.id)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", endGesture)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", endGesture)
    }
  }, [onPointerMove, endGesture])

  // Delete / Backspace removes the selected layer (unless typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedId) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removeLayer(selectedId)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, view])

  const price = garment
    ? computePrice(garment.basePrice, placements, settings)
    : null

  const selected = garment ? placements[view].find((l) => l.id === selectedId) ?? null : null
  const stageW = stageWidthRef.current
  const garmentColor = color ?? "#e5e7eb"

  // ---- render -------------------------------------------------------------
  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading the studio...</p>
      </main>
    )
  }

  if (garments.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Design Studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No garments are set up yet. The store owner can add them from the admin dashboard.
        </p>
      </main>
    )
  }

  // Garment picker
  if (!garment) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Design Studio</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Pick a blank to start. Add designs and text to the front, back, or arm — your idea, our
            press.
          </p>
        </header>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {garments.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => chooseGarment(g)}
              className="group flex flex-col items-center rounded-2xl border border-border p-4 text-center transition-colors hover:border-foreground/40 hover:bg-muted/40"
            >
              <div className="flex h-36 w-full items-center justify-center">
                {g.imageFront ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.imageFront} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="h-full w-28">
                    <GarmentSilhouette color="#e5e7eb" />
                  </div>
                )}
              </div>
              <span className="mt-3 text-sm font-medium">{g.name}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                from {formatPrice(g.basePrice)}
              </span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  // Editor
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => setGarment(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5l-5 5 5 5" />
            </svg>
            All garments
          </button>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{garment.name}</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas ------------------------------------------------------- */}
        <div>
          {/* View tabs */}
          <div className="flex gap-1 border-b border-border">
            {garment.views.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v)
                  setSelectedId(null)
                }}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  v === view
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          <div
            ref={stageRef}
            onClick={() => setSelectedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData("text/design-id")
              const design = designs.find((d) => d.id === id)
              if (!design) return
              const r = stageRef.current!.getBoundingClientRect()
              addDesignAt(
                design,
                ((e.clientX - r.left) / r.width) * 100,
                ((e.clientY - r.top) / r.height) * 100
              )
            }}
            className="relative mx-auto mt-4 aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-border bg-muted/30 touch-none select-none"
          >
            {/* Garment */}
            {mockup ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mockup} alt="" className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="h-full w-full max-w-[78%]">
                  <GarmentSilhouette color={garmentColor} />
                </div>
              </div>
            )}

            {/* Print-area guide */}
            {(() => {
              const area = PRINT_AREAS[view]
              return (
                <div
                  className="pointer-events-none absolute rounded-md border border-dashed border-foreground/25"
                  style={{
                    left: `${area.xPct - area.wPct / 2}%`,
                    top: `${area.yPct - area.hPct / 2}%`,
                    width: `${area.wPct}%`,
                    height: `${area.hPct}%`,
                  }}
                />
              )
            })()}

            {/* Layers */}
            {layers.map((l) => {
              const isSel = l.id === selectedId
              return (
                <div
                  key={l.id}
                  onPointerDown={(e) => startGesture(e, l, "move")}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute cursor-move"
                  style={{
                    left: `${l.xPct}%`,
                    top: `${l.yPct}%`,
                    width: l.kind === "design" ? `${l.widthPct}%` : "auto",
                    transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
                  }}
                >
                  {l.kind === "design" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.image}
                      alt=""
                      draggable={false}
                      className="pointer-events-none w-full select-none"
                    />
                  ) : (
                    <span
                      className="pointer-events-none block whitespace-nowrap font-semibold leading-none"
                      style={{
                        color: l.color,
                        fontFamily: l.fontFamily,
                        fontSize: `${Math.max(10, (stageW * l.widthPct) / 100)}px`,
                      }}
                    >
                      {l.text}
                    </span>
                  )}

                  {isSel ? (
                    <>
                      <span className="pointer-events-none absolute -inset-1 rounded border border-dashed border-foreground/60" />
                      {/* rotate */}
                      <span
                        onPointerDown={(e) => startGesture(e, l, "rotate")}
                        className="absolute left-1/2 top-0 size-4 -translate-x-1/2 -translate-y-6 cursor-grab rounded-full border border-border bg-background shadow"
                        title="Rotate"
                      />
                      {/* resize */}
                      <span
                        onPointerDown={(e) => startGesture(e, l, "resize")}
                        className="absolute bottom-0 right-0 size-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border border-border bg-background shadow"
                        title="Resize"
                      />
                      {/* delete */}
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeLayer(l.id)
                        }}
                        className="absolute right-0 top-0 flex size-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-xs leading-none shadow"
                        title="Remove"
                      >
                        ×
                      </button>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Drag a design onto the shirt, then drag to move · corner to resize · top dot to rotate.
          </p>
        </div>

        {/* Controls ----------------------------------------------------- */}
        <div className="flex flex-col gap-5">
          {/* Selected layer controls */}
          {selected ? (
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {selected.kind === "text" ? "Text" : "Selected design"}
                </h3>
                <button
                  type="button"
                  onClick={() => removeLayer(selected.id)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>

              {selected.kind === "text" ? (
                <>
                  <input
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selected.text ?? ""}
                    onChange={(e) => updateSelected({ text: e.target.value })}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      Color
                      <input
                        type="color"
                        value={selected.color ?? "#111111"}
                        onChange={(e) => updateSelected({ color: e.target.value })}
                        className="h-7 w-10 rounded border border-border bg-background"
                      />
                    </label>
                    <select
                      className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none"
                      value={selected.fontFamily}
                      onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.label} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <label className="mt-3 block text-xs text-muted-foreground">
                Size
                <input
                  type="range"
                  min={6}
                  max={100}
                  value={Math.round(selected.widthPct)}
                  onChange={(e) => updateSelected({ widthPct: Number(e.target.value) })}
                  className="mt-1 w-full"
                />
              </label>
              <label className="mt-2 block text-xs text-muted-foreground">
                Rotation
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={Math.round(selected.rotation)}
                  onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                  className="mt-1 w-full"
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                Tip: drag on the shirt to move, or press Delete to remove.
              </p>
            </div>
          ) : null}

          {/* Design library */}
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Designs</h3>
              <button
                type="button"
                onClick={addText}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                + Text
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filter === f
                      ? "bg-foreground text-background"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {f === "all" ? "All" : PLACEMENT_LABELS[f as DesignPlacement]}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search designs..."
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {visibleDesigns.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {designs.length === 0 ? "No designs added yet." : "No designs match this filter."}
              </p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  {visibleDesigns.length} design{visibleDesigns.length === 1 ? "" : "s"}
                </p>
                <div className="mt-1 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto">
                  {visibleDesigns.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/design-id", d.id)}
                      onClick={() => addDesignCentered(d)}
                      title={`${d.name} — drag onto the shirt or click to add`}
                      className="flex aspect-square items-center justify-center rounded-lg border border-border p-1 hover:border-foreground/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.image}
                        alt={d.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Size + color */}
          <div className="rounded-xl border border-border p-3">
            <h3 className="text-sm font-semibold">Fit</h3>
            <div className="mt-2 flex flex-col gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Size</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {garment.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                        size === s ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {garment.colors.length > 0 ? (
                <div>
                  <span className="text-xs text-muted-foreground">Color</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {garment.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                          color === c ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Price + checkout */}
          {price ? (
            <div className="rounded-xl border border-border p-3">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{garment.name}</span>
                  <span>{formatPrice(price.base)}</span>
                </div>
                {price.lines.map((line) => (
                  <div
                    key={line.label}
                    className="flex items-center justify-between text-muted-foreground"
                  >
                    <span>{line.label}</span>
                    <span>+ {formatPrice(line.amount)}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(price.total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "Buying custom designs is coming in the next update — your design and price are ready."
                  )
                }
                className="mt-3 w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
              >
                Add to cart
              </button>
              {notice ? <p className="mt-2 text-xs text-muted-foreground">{notice}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
