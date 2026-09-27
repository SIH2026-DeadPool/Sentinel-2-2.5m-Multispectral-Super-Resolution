import { motion } from 'motion/react'

export function AboutSection() {
  return <motion.section id="about" className="about-section" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
    <div className="about-heading">
      <p className="eyebrow">ABOUT FASTSEN2SR</p>
      <h2>Sharper context for multispectral imagery.</h2>
      <p>FastSEN2SR is an AI-based super-resolution prototype for four-band Sentinel-2 imagery. It is designed to explore how a learned image-restoration model can create a higher-resolution estimate from 10 m input bands.</p>
    </div>
    <div className="about-grid">
      <article>
        <span className="about-index">01</span>
        <h3>The problem</h3>
        <p>Satellite imagery is valuable for observing land and coastal areas, but its native spatial resolution can limit visual detail. This project focuses on producing a clearer, more detailed representation for exploration and presentation.</p>
      </article>
      <article>
        <span className="about-index">02</span>
        <h3>The approach</h3>
        <p>The backend loads the FastSEN2SR architecture with four input and output channels for B2, B3, B4, and B8. The model normalizes the input, runs inference, and returns a four-band GeoTIFF at a 4× output scale.</p>
      </article>
      <article>
        <span className="about-index">03</span>
        <h3>Use it carefully</h3>
        <p>The generated file is an estimated super-resolved product, not a literal physical Sentinel-2 measurement at 2.5 m. The README describes the model as a rapid SIH prototype trained on a reduced representative dataset.</p>
      </article>
    </div>
    <div className="about-stack"><span>STACK</span><b>React · Vite · TypeScript</b><b>FastAPI · PyTorch · Rasterio</b><b>4-band GeoTIFF workflow</b></div>
  </motion.section>
}
