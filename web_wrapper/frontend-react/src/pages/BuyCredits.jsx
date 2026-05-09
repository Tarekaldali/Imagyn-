import React from 'react'
import { formatCurrency } from '../lib/formatters'

const plans = [
  { id: 'starter', name: 'Starter Pack', price: 9, credits: 120, description: 'Best for personal testing and daily concepts.' },
  { id: 'pro', name: 'Pro Creator', price: 29, credits: 450, description: 'Balanced pack for frequent production use.' },
  { id: 'studio', name: 'Studio Scale', price: 79, credits: 1400, description: 'Large credit pool for heavy generation cycles.' },
]

export default function BuyCredits({ user }) {
  return (
    <section className="space-y-6">
      <div className="hero-panel">
        <p className="eyebrow">Credit management</p>
        <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Top up when you need more generations.</h1>
        <p className="hero-copy">
          Current balance: <strong>{user?.credits ?? 0} credits</strong>. Payment checkout can be connected next to Stripe or PayPal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="surface-card">
            <p className="eyebrow">{plan.name}</p>
            <p className="mt-3 text-4xl font-semibold text-[var(--text-strong)]">{formatCurrency(plan.price)}</p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{plan.credits} credits included</p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">{plan.description}</p>
            <button type="button" className="primary-button mt-6 w-full justify-center" disabled>
              Checkout soon
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
