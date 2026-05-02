import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function formatTimestamp(value) {
  if (!value) return 'Unknown time'
  try {
    return new Date(value).toLocaleString()
  } catch (error) {
    return value
  }
}

export default function Gallery({ images = [], onRemove, onClear, asPage = false }) {
  const [sortOrder, setSortOrder] = useState('newest')

  const sortedImages = useMemo(() => {
    const next = [...images]
    next.sort((a, b) => {
      const first = new Date(a.createdAt || 0).getTime()
      const second = new Date(b.createdAt || 0).getTime()
      return sortOrder === 'newest' ? second - first : first - second
    })
    return next
  }, [images, sortOrder])

  const wrapperClass = asPage
    ? 'rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,35,57,0.96)_0%,rgba(20,29,48,0.96)_100%)] shadow-[0_28px_80px_rgba(7,11,24,0.45)]'
    : 'h-full rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,35,57,0.96)_0%,rgba(20,29,48,0.96)_100%)] shadow-[0_28px_80px_rgba(7,11,24,0.45)]'

  return (
    <aside className={wrapperClass}>
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <div>
          <p className="text-2xl font-semibold text-white">Gallery</p>
          <p className="mt-1 text-sm text-slate-500">
            {sortedImages.length ? `${sortedImages.length} local renders saved` : 'Generated images will appear here'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!asPage && (
            <Link
              to="/gallery"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              title="Open gallery page"
            >
              ↗
            </Link>
          )}
          <button
            type="button"
            onClick={onClear}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
            title="Clear gallery"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400/50"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        {sortedImages.length === 0 ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[24px] border border-dashed border-blue-500/20 bg-slate-950/25 px-8 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/12 text-3xl text-blue-400">
              🖼
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-slate-200">No images yet</h3>
            <p className="mt-3 max-w-xs text-base leading-7 text-slate-500">
              Generate an image from the studio and it will be saved here automatically.
            </p>
          </div>
        ) : (
          <div className={asPage ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-4'}>
            {sortedImages.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.045] shadow-[0_14px_35px_rgba(2,6,23,0.28)]"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-950/80">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove?.(image.id)}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/75 text-white backdrop-blur transition hover:bg-red-500/80"
                    title="Delete image"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 p-4">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-200">{image.prompt}</p>
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span className="truncate">{image.model || 'default'}</span>
                    <span>{formatTimestamp(image.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
