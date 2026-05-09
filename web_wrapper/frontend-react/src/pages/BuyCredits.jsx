import React from 'react'
import { formatCurrency } from '../lib/formatters'

export default function BuyCredits({ plans = [], user }) {
  return (
    <section className="space-y-6">
      <div className="command-hero">
        <div>
          <p className="eyebrow">Credit plans</p>
          <h1 className="hero-title !text-[clamp(2.5rem,3.4vw,4.2rem)]">Choose a tier that fits your generation rhythm.</h1>
          <p className="hero-copy">
            Your current balance is {user?.credits ?? 0} credits. Plans below are editable from the admin dashboard and reflected here instantly.
          </p>
        </div>
        <div className="command-hero__stats">
          <article className="admin-metric">
            <p className="admin-metric__label">Current balance</p>
            <p className="admin-metric__value">{user?.credits ?? 0}</p>
            <p className="admin-metric__hint">Credits ready to spend</p>
          </article>
          <article className="admin-metric admin-metric--accent">
            <p className="admin-metric__label">Plan count</p>
            <p className="admin-metric__value">{plans.length}</p>
            <p className="admin-metric__hint">Pricing options live</p>
          </article>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className={`pricing-card ${plan.highlight ? 'pricing-card--featured' : ''}`}>
            <div className="pricing-card__badge">{plan.badge}</div>
            <h2 className="pricing-card__title">{plan.name}</h2>
            <p className="pricing-card__price">{formatCurrency(plan.price)}</p>
            <p className="pricing-card__credits">{plan.credits} credits</p>
            <p className="pricing-card__description">{plan.description}</p>
            <ul className="pricing-card__features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button type="button" className="primary-button w-full justify-center" disabled>
              Checkout soon
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
