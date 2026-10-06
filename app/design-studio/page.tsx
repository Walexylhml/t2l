import type { Metadata } from "next"
import { Studio } from "./studio"

export const metadata: Metadata = {
  title: "Design Studio",
  description:
    "Design your own Thoughts2Lyfe piece — pick a blank, drop designs and text on the front, back, or arm, and see the price as you go.",
  alternates: { canonical: "/design-studio" },
}

export default function DesignStudioPage() {
  return <Studio />
}
