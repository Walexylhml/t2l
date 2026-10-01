import Link from "next/link"

export const metadata = {
  title: "Order confirmed",
  robots: { index: false },
}

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams?.session_id

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <span className="text-3xl" aria-hidden>
          &#10003;
        </span>
      </div>
      <h1 className="mt-6 text-3xl font-bold">Thank you for your order</h1>
      <p className="mt-3 text-muted-foreground">
        Your payment was successful and your order is confirmed. A confirmation email is on its way.
      </p>
      {sessionId ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Reference: {sessionId}
        </p>
      ) : null}
      <p className="mt-6 text-sm text-muted-foreground">
        Create an account with the same email you used at checkout and this order will be linked to your profile automatically.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/shop"
          className="rounded-md bg-black px-6 py-3 text-white"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="rounded-md border px-6 py-3"
        >
          Back home
        </Link>
      </div>
    </div>
  )
}
