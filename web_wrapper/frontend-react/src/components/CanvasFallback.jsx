import React from 'react'

export default function CanvasFallback({ latestImage }) {
  return (
    <section className="relative min-h-[760px] overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(128,164,255,0.12),transparent_34%),linear-gradient(135deg,rgba(89,104,141,0.96)_0%,rgba(63,73,103,0.96)_55%,rgba(44,51,76,0.96)_100%)] p-6 shadow-[0_30px_100px_rgba(7,11,24,0.45)]">
      <div className="absolute inset-6 rounded-[28px] border border-dashed border-white/10" />

      <div className="relative z-10 flex h-full min-h-[700px] items-center justify-center">
        {latestImage ? (
          <div className="w-full max-w-5xl space-y-8 text-center">
            <div className="mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40 shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
              <img src={latestImage.url} alt={latestImage.prompt} className="max-h-[620px] w-full object-contain" />
            </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/70">Latest Render</p>
                <h1 className="mt-4 text-5xl font-semibold text-white">Imagyn Studio</h1>
                <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                  {latestImage.prompt}
                </p>
              </div>
          </div>
        ) : (
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_52%,#ec4899_100%)] shadow-[0_20px_40px_rgba(99,102,241,0.28)]">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true">
                <path d="M5 4.75A2.75 2.75 0 0 0 2.25 7.5v9A2.75 2.75 0 0 0 5 19.25h14A2.75 2.75 0 0 0 21.75 16.5v-9A2.75 2.75 0 0 0 19 4.75H5Zm11.2 3.4a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8ZM6 16l3.35-4.08a1 1 0 0 1 1.54.02l2.33 2.84 1.87-2.24a1 1 0 0 1 1.53-.02L18 16H6Z" />
              </svg>
            </div>

            <div>
              <h1 className="text-6xl font-semibold tracking-tight text-white">Imagyn Studio</h1>
              <p className="mt-6 text-2xl text-slate-300">Professional AI Image Generation</p>
              <p className="mt-4 text-lg italic text-slate-400">
                Enter a prompt and click Generate Image to create your next render.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
