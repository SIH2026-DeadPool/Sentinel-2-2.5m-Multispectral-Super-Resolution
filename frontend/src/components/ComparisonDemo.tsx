import { motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

type Props = { active: boolean }
export function ComparisonDemo({ active }: Props) {
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
  return <motion.section id="compare" className="comparison-shell" animate={active ? { y: [12, 0], opacity: [0.5, 1] } : {}} transition={{ duration: 0.6 }}>
    <div className="comparison-head"><div><span className="eyebrow">VISUAL DEMO</span><h2>Explore the difference</h2></div><span className="placeholder-tag">Fictional preview · not model output</span></div>
    <div ref={shell} className="comparison" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); move(event.clientX) }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event.clientX) }}>
      <img src="/visuals/coastal-demo.svg" alt="Fictional coastal satellite scene placeholder" />
      <motion.div className="comparison-before" style={{ width: leftWidth }}><img src="/visuals/coastal-demo.svg" alt="" aria-hidden="true" /></motion.div>
      <span className="image-label original">Original</span><span className="image-label enhanced">Enhanced 4×</span>
      <motion.button className="compare-handle" style={{ left: leftWidth }} aria-label="Move comparison divider" aria-valuemin={8} aria-valuemax={92} aria-valuenow={Math.round(position)} role="slider" onKeyDown={(event) => { if (event.key === 'ArrowLeft') { x.set(Math.max(8, position - 5)); setPosition(Math.max(8, position - 5)) } if (event.key === 'ArrowRight') { x.set(Math.min(92, position + 5)); setPosition(Math.min(92, position + 5)) } }}><span>‹</span><span>›</span></motion.button>
    </div>
    <div className="compare-footer"><span>◧</span><span>Drag to compare</span><span>Visual placeholder only</span></div>
  </motion.section>
}
