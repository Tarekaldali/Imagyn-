import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../lib/formatters'

export default function BuyCredits({ plans = [], user }) {
  const navigate = useNavigate()
  return (
    <section className="space-y-6">
     

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
            <button
              type="button"
              className="primary-button w-full justify-center"
              onClick={() => navigate('/checkout', { state: { plan } })}
            >
              Checkout
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
