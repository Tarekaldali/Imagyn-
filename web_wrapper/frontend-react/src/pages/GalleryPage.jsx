import React, { useDeferredValue, useState } from 'react'
import { formatDateTime } from '../lib/formatters'

export default function GalleryPage({ images, loading = false, onDelete, onRefresh }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filteredImages = [...images]
    .filter((image) => !deferredQuery || image.prompt.toLowerCase().includes(deferredQuery) || (image.model_used || image.model || '').toLowerCase().includes(deferredQuery))
    .sort((first, second) => {
      const firstDate = new Date(first.created_at || first.createdAt || 0).getTime()
      const secondDate = new Date(second.created_at || second.createdAt || 0).getTime()
      return sort === 'newest' ? secondDate - firstDate : firstDate - secondDate
    })

  return (
    <section className="space-y-6">
      <div className="hero-panel flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Private gallery</p>
          <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Browse every completed render with real metadata.</h1>
          <p className="hero-copy">
            Search prompts, review model choices, and remove images you no longer want saved in your account archive.
          </p>
        </div>
        <button type="button" onClick={onRefresh} className="secondary-button">
          Refresh gallery
        </button>
      </div>

      <div className="surface-card space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <label className="field">
            <span className="field__label">Search by prompt or model</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="field__input" placeholder="portrait, cinematic, dreamshaper..." />
          </label>
          <label className="field">
            <span className="field__label">Sort order</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="field__input">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-10 text-center text-sm text-[var(--text-soft)]">
            Loading gallery...
          </div>
        ) : filteredImages.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredImages.map((image) => (
              <article key={image.id} className="overflow-hidden rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--panel-muted)]">
                <img src={image.image_url || image.url} alt={image.prompt} className="aspect-square w-full object-cover" />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-strong)]">{image.model_used || image.model || 'Default model'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">{formatDateTime(image.created_at || image.createdAt)}</p>
                    </div>
                    <button type="button" onClick={() => onDelete(image.id)} className="ghost-button">
                      Delete
                    </button>
                  </div>
                  <p className="text-sm leading-7 text-[var(--text-soft)]">{image.prompt}</p>
                  <a href={image.image_url || image.url} target="_blank" rel="noreferrer" className="secondary-button inline-flex">
                    Open image
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-12 text-center">
            <p className="text-lg font-semibold text-[var(--text-strong)]">No images match this view.</p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Generate a new image from the studio or widen your search terms.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
