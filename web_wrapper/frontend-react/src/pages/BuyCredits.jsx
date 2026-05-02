import React from 'react'
import { formatCurrency } from '../lib/formatters'

const plans = [
  { name: 'Starter', price: 12, credits: 150, note: 'For testing workflows and moodboards.' },
  { name: 'Pro', price: 39, credits: 600, note: 'For creators generating every week.' },
  { name: 'Studio', price: 119, credits: 2200, note: 'For teams, clients, and heavy prompt iteration.' },
]

export default function BuyCredits({ jobs = [], user }) {
  const completedCount = jobs.filter((job) => job.status === 'completed').length
  const failedCount = jobs.filter((job) => job.status === 'failed').length

  return (
    <section className="space-y-6">
      <div className="hero-panel grid gap-6 lg:grid-cols-[1fr_0.82fr]">
        <div>
          <p className="eyebrow">Credit balance</p>
          <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Plan your generation budget without losing the premium feel.</h1>
          <p className="hero-copy">
            The purchase flow can plug into Stripe next, but the redesigned page already frames credits, usage, and plan tiers as a real product surface.
          </p>
        </div>

        <div className="surface-card">
          <p className="eyebrow">Current account</p>
          <div className="mt-4 space-y-3">
            <div className="detail-row">
              <span>Credits available</span>
              <strong>{user?.credits ?? 0}</strong>
            </div>
            <div className="detail-row">
              <span>Completed jobs</span>
              <strong>{completedCount}</strong>
            </div>
            <div className="detail-row">
              <span>Failed jobs</span>
              <strong>{failedCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="surface-card">
            <p className="eyebrow">{plan.name}</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{formatCurrency(plan.price)}</h2>
            <p className="mt-2 text-sm uppercase tracking-[0.22em] text-[var(--text-soft)]">{plan.credits} credits</p>
            <p className="mt-5 text-sm leading-7 text-[var(--text-soft)]">{plan.note}</p>
            <button type="button" className="secondary-button mt-8 w-full justify-center" disabled>
              Checkout integration next
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
