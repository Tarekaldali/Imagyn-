import React, { useState } from 'react'
import { generateImage } from '../api/generate'
import { insertImageMetadata } from '../api/db'

const workflowItems = [
  { id: 'txt2img', label: 'Text to Image', active: true },
  { id: 'img2img', label: 'Image to Image' },
  { id: 'inpaint', label: 'Inpainting' },
]

export default function Sidebar({ onGenerate }) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('dreamshaperXL_lightningDPMSDE.safetensors')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const image = await generateImage({ prompt, model })
      if (!image) throw new Error('No image returned from generator')

      const nextImage = {
        ...image,
        prompt,
        model,
        createdAt: new Date().toISOString(),
      }

      onGenerate?.(nextImage)
      await insertImageMetadata({
        prompt,
        image_url: nextImage.url,
        model_used: model,
      })
    } catch (error) {
      console.error(error)
      alert('Image generation failed. Check the backend connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="flex flex-col gap-6">
      <section className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(33,48,81,0.94)_0%,rgba(25,37,62,0.94)_100%)] shadow-[0_28px_80px_rgba(7,11,24,0.45)]">
        <div className="border-b border-white/8 px-6 py-5">
          <p className="flex items-center gap-3 text-2xl font-semibold text-emerald-400">
            <span className="text-lg">⌘</span>
            Workflow
          </p>
        </div>
        <div className="space-y-4 p-5">
          {workflowItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center gap-4 rounded-2xl border px-6 py-6 text-left text-lg font-medium transition ${
                item.active
                  ? 'border-emerald-400/35 bg-[linear-gradient(135deg,#1dd7a0_0%,#1fbf8d_100%)] text-white shadow-[0_18px_30px_rgba(29,215,160,0.22)]'
                  : 'border-white/8 bg-white/[0.06] text-slate-100 hover:border-white/15 hover:bg-white/[0.09]'
              }`}
            >
              <span className="text-xl">{item.active ? '🖼' : item.id === 'img2img' ? '✎' : '🖌'}</span>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-indigo-300/15 bg-[linear-gradient(180deg,rgba(58,74,113,0.92)_0%,rgba(54,66,91,0.92)_100%)] shadow-[0_28px_80px_rgba(7,11,24,0.45)]">
        <div className="border-b border-white/8 px-6 py-5">
          <p className="flex items-center gap-3 text-2xl font-semibold text-blue-400">
            <span className="text-lg">◻</span>
            Model
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label htmlFor="modelSelect" className="text-sm font-semibold text-white">
              Base Model
            </label>
            <select
              id="modelSelect"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-base text-white outline-none transition focus:border-cyan-400/50"
            >
              <option value="dreamshaperXL_lightningDPMSDE.safetensors">DreamShaper XL Lightning</option>
              <option value="realisticVision_v51.safetensors">Realistic Vision v5.1</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-indigo-300/15 bg-[linear-gradient(180deg,rgba(58,74,113,0.92)_0%,rgba(16,23,41,0.96)_100%)] shadow-[0_28px_80px_rgba(7,11,24,0.45)]">
        <div className="border-b border-white/8 px-6 py-5">
          <p className="flex items-center gap-3 text-2xl font-semibold text-blue-400">
            <span className="text-lg">✎</span>
            Prompt
          </p>
        </div>
        <div className="space-y-5 p-5">
          <textarea
            id="promptInput"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[220px] w-full resize-y rounded-[22px] border border-slate-700 bg-slate-950/85 p-5 font-mono text-base leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
          />

          <div className="flex items-center gap-4">
            <button
              id="generateBtn"
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="group flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border border-cyan-400/30 bg-[radial-gradient(circle_at_top,#58e6c5,_#0ea5a4_62%,#0f766e_100%)] text-white shadow-[0_24px_45px_rgba(20,184,166,0.28)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className={`text-3xl ${loading ? 'animate-spin' : 'transition group-hover:translate-x-0.5'}`}>
                {loading ? '◌' : '▶'}
              </span>
              <span className="mt-2 text-sm font-semibold uppercase tracking-[0.22em]">
                {loading ? 'Generating' : 'Generate'}
              </span>
            </button>

            <div className="grid flex-1 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Steps</div>
                <div className="mt-2 text-2xl font-semibold text-white">25</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">CFG Scale</div>
                <div className="mt-2 text-2xl font-semibold text-white">7.0</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </aside>
  )
}
