import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Checkout({ onPurchase }) {
  const location = useLocation()
  const navigate = useNavigate()
  const plan = location.state?.plan || null
  const [loading, setLoading] = useState(false)

  if (!plan) {
    return (
      <section>
        <p className="eyebrow">Checkout</p>
        <h1 className="hero-title">No plan selected</h1>
        <p className="hero-copy">Please select a plan from the Pricing page.</p>
      </section>
    )
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      await onPurchase?.(plan.id)
      navigate('/profile')
    } catch (error) {
      // swallow - onPurchase should surface toasts
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="command-hero">
        <div>
          <p className="eyebrow">Purchase</p>
          <h1 className="hero-title">Confirm your purchase</h1>
          <p className="hero-copy">You're about to buy the <strong>{plan.name}</strong> plan for <strong>{plan.price}</strong>.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card">
          <p className="eyebrow">Plan</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--text-strong)]">{plan.name}</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">{plan.description}</p>
        </article>

        <article className="surface-card">
          <p className="eyebrow">Price</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{plan.price}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">{plan.credits} credits</p>
        </article>

        <article className="surface-card">
          <p className="eyebrow">Billing</p>
          <p className="mt-3 text-sm text-[var(--text-soft)]">You'll be billed via your saved payment method.</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div />
        <div />
        <div>
          <button type="button" className="primary-button w-full" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processing…' : `Confirm purchase (${plan.price})`}
          </button>
        </div>
      </div>
    </section>
  )
}
