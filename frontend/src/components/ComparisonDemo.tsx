import { motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

type Props = { active: boolean; pngUrl?: string | null }
export function ComparisonDemo({ active, pngUrl }: Props) {
  const shell = useRef<HTMLDivElement>(null)
  const x = useMotionValue(50)
  const leftWidth = useTransform(x, (value) => `${value}%`)
  const [position, setPosition] = useState(50)
  useEffect(() => { if (active) { x.set(58); setPosition(58) } }, [active, x])
  const move = (clientX: number) => {
    if (!shell.current) return
    const rect = shell.current.getBoundingClientRect()
    const next = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100))
    x.set(next); setPosition(next)
  }
  const imgSrc = pngUrl || "/visuals/coastal-demo.svg"
  const tagText = pngUrl ? "✨ Live Model Super-Resolution Output (PNG)" : "Fictional preview · not model output"
  return <motion.section id="compare" className="comparison-shell" animate={active ? { y: [12, 0], opacity: [0.5, 1] } : {}} transition={{ duration: 0.6 }}>
    <div className="comparison-head"><div><span className="eyebrow">VISUAL DEMO</span><h2>Explore the difference</h2></div><span className="placeholder-tag">{tagText}</span></div>
    <div ref={shell} className="comparison" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); move(event.clientX) }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event.clientX) }}>
      <img src={imgSrc} alt="Enhanced 4x Output Satellite Picture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <motion.div className="comparison-before" style={{ width: leftWidth }}><img src={imgSrc} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px)' }} /></motion.div>
      <span className="image-label original">Original (Low-Res)</span><span className="image-label enhanced">Enhanced 4× (PNG Picture)</span>
      <motion.button className="compare-handle" style={{ left: leftWidth }} aria-label="Move comparison divider" aria-valuemin={8} aria-valuemax={92} aria-valuenow={Math.round(position)} role="slider" onKeyDown={(event) => { if (event.key === 'ArrowLeft') { x.set(Math.max(8, position - 5)); setPosition(Math.max(8, position - 5)) } if (event.key === 'ArrowRight') { x.set(Math.min(92, position + 5)); setPosition(Math.min(92, position + 5)) } }}><span>‹</span><span>›</span></motion.button>
    </div>
    <div className="compare-footer"><span>◧</span><span>Drag to compare resolution</span><span>{pngUrl ? "Live PNG output preview" : "Visual placeholder only"}</span></div>
  </motion.section>
}
