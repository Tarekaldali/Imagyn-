import React, { useDeferredValue, useState } from 'react'

const promptSets = [
  {
    id: 'portraits',
    name: 'Portrait Direction',
    description: 'Editorial and lifestyle portrait starters with lighting and camera language.',
    prompts: [
      'Editorial portrait of a fashion founder in soft northern window light, textured ivory backdrop, 85mm lens, subtle skin detail, quiet luxury styling.',
      'Documentary street portrait at dusk, shallow depth of field, practical neon reflections on wet pavement, cinematic grain, natural expression.',
      'Studio beauty portrait with controlled rim light, muted teal seamless, crisp skin texture, magazine retouch balance, premium cosmetics campaign framing.',
    ],
  },
  {
    id: 'products',
    name: 'Product Storytelling',
    description: 'Commercial prompts built for hero images and campaign mockups.',
    prompts: [
      'High-end product hero shot of matte black headphones on brushed steel pedestal, directional side light, premium electronics campaign, pristine reflections.',
      'Luxury perfume bottle on warm travertine slab, soft haze, morning sunlight shafts, elevated still life styling, tactile material contrast.',
      'Minimal sneaker campaign image in clean architectural set, hard shadow geometry, editorial sportswear tone, hyper-real materials.',
    ],
  },
  {
    id: 'environments',
    name: 'World Building',
    description: 'Mood-rich prompts for cinematic scenes and concept environments.',
    prompts: [
      'Cinematic observatory on a windswept cliff at blue hour, glowing instruments, layered storm clouds, large-scale matte painting realism.',
      'Quiet brutalist library atrium with skylight beams, floating dust, polished concrete, warm wood accents, contemplative atmosphere.',
      'Desert research outpost at sunrise, lightweight canopies, off-road utility vehicles, grounded sci-fi production design, believable textures.',
    ],
  },
]

export default function PromptLibrary({ onUsePrompt, onToast }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const visibleSets = promptSets
    .map((set) => ({
      ...set,
      prompts: set.prompts.filter((prompt) => !deferredQuery || prompt.toLowerCase().includes(deferredQuery) || set.name.toLowerCase().includes(deferredQuery)),
    }))
    .filter((set) => set.prompts.length)

  async function handleCopy(prompt) {
    try {
      await navigator.clipboard.writeText(prompt)
      onToast('Prompt copied to clipboard.', 'success', 'Copied')
    } catch (error) {
      onToast('Clipboard access failed on this browser.', 'warning', 'Copy failed')
    }
  }

  return (
    <section className="space-y-6">
      <div className="hero-panel command-hero">
        <div>
          <p className="eyebrow">Prompt library</p>
          <h1 className="hero-title !text-[clamp(2.5rem,3.4vw,4.2rem)]">Keep proven prompt recipes close to the studio.</h1>
          <p className="hero-copy">
            Browse curated prompt starting points, copy them instantly, or drop one into Studio so you can iterate without rewriting from scratch.
          </p>
        </div>
        <label className="field max-w-xl">
          <span className="field__label">Search prompt collection</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field__input"
            placeholder="portrait, product, cinematic..."
          />
        </label>
      </div>

      <div className="grid gap-6">
        {visibleSets.map((set) => (
          <section key={set.id} className="surface-card">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">{set.name}</p>
                <h2 className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">{set.description}</h2>
              </div>
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-muted)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
                {set.prompts.length} prompts
              </span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {set.prompts.map((prompt) => (
                <article key={prompt} className="library-card">
                  <p className="library-card__prompt">{prompt}</p>
                  <div className="library-card__actions">
                    <button type="button" onClick={() => onUsePrompt(prompt)} className="primary-button">
                      Use in Studio
                    </button>
                    <button type="button" onClick={() => handleCopy(prompt)} className="secondary-button">
                      Copy
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
