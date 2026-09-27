import { MotionConfig, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { ComparisonDemo } from './components/ComparisonDemo'
import { Header } from './components/Header'
import { MagneticButton } from './components/MagneticButton'
import { WorkspaceDemo } from './components/WorkspaceDemo'
import { AboutSection } from './components/AboutSection'

const APP_ENV = import.meta as ImportMeta & { env?: Record<string, string | undefined> }
const API_BASE_URL = (APP_ENV.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

function Scene() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle')
  const [uploadPercent, setUploadPercent] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [timing, setTiming] = useState<{ uploadMs?: number; inputReadMs?: number; processingMs?: number }>({})
  const reduceMotion = useReducedMotion()

  const connect = () => document.getElementById('workspace')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  const compare = () => document.getElementById('compare')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })

  const handleFileSelect = (file: File | null) => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl)
      setResultUrl(null)
    }

    if (!file) {
      setSelectedFile(null)
      setStatus('')
      setError('')
      setPhase('idle')
      setTiming({})
      return
    }

    if (!/\.(tif|tiff)$/i.test(file.name)) {
      setSelectedFile(null)
      setError('Please choose a GeoTIFF (.tif or .tiff) file.')
      setStatus('')
      setPhase('error')
      return
    }

    setSelectedFile(file)
    setError('')
    setPhase('idle')
    setUploadPercent(0)
    setTiming({})
    setStatus(`${file.name} selected for super-resolution.`)
  }

  const handleUpload = () => {
    if (!selectedFile) {
      setError('Choose a GeoTIFF file before running inference.')
      return
    }

    if (phase === 'uploading' || phase === 'processing') return

    setPhase('uploading')
    setUploadPercent(0)
    setError('')
    setStatus('Uploading file…')
    const startedAt = performance.now()
    const formData = new FormData()
    formData.append('file', selectedFile)

    const request = new XMLHttpRequest()
    request.open('POST', `${API_BASE_URL}/predict`)
    request.responseType = 'blob'
    request.timeout = 15 * 60 * 1000
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadPercent(Math.round((event.loaded / event.total) * 100))
    }
    request.upload.onload = () => {
      const uploadMs = performance.now() - startedAt
      setTiming((current) => ({ ...current, uploadMs }))
      setPhase('processing')
      setStatus('Upload complete. Running super-resolution…')
    }
    request.onload = () => {
      const serverProcessingMs = Number(request.getResponseHeader('X-Inference-Ms'))
      const serverInputReadMs = Number(request.getResponseHeader('X-Input-Read-Ms'))
      if (request.status < 200 || request.status >= 300) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const body = JSON.parse(String(reader.result))
            setError(body.detail ?? 'Prediction failed.')
          } catch {
            setError('Prediction failed. The backend returned an invalid error response.')
          }
          setPhase('error')
          setStatus('Prediction was not completed.')
        }
        reader.readAsText(request.response)
        return
      }

      const blob = request.response as Blob
      const nextUrl = URL.createObjectURL(blob)

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl)
      }

      setResultUrl(nextUrl)
      setTiming((current) => ({
        ...current,
        inputReadMs: Number.isFinite(serverInputReadMs) ? serverInputReadMs : undefined,
        processingMs: Number.isFinite(serverProcessingMs) ? serverProcessingMs : undefined,
      }))
      setPhase('complete')
      setStatus('Super-resolution complete. Your TIFF is ready to download.')
      window.setTimeout(() => compare(), 120)
    }
    request.onerror = () => {
      setError('Could not reach the backend. Check that FastAPI is running and try again.')
      setPhase('error')
      setStatus('Prediction was not completed.')
    }
    request.ontimeout = () => {
      setError('The request timed out. Large GeoTIFFs or model inference may require more time.')
      setPhase('error')
      setStatus('Prediction was not completed.')
    }
    request.send(formData)
  }

  const handleDownload = () => {
    if (!resultUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = resultUrl
    link.download = (selectedFile?.name ?? 'super_resolved.tif').replace(/\.(tif|tiff)$/i, '') + '_sr.tif'
    link.click()
  }

  const loaded = Boolean(resultUrl)

  return <main id="top">
    <div className="space-bg" aria-hidden="true" /><div className="orbit-bg" aria-hidden="true" />
    <div className="page-frame">
      <Header onLaunch={connect} onCompare={compare} />
      <section className="hero" aria-labelledby="hero-title">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, ease: 'easeOut' }}>
          <p className="eyebrow hero-eyebrow"><span /> FASTSEN2SR · 4× SATELLITE IMAGERY ENHANCEMENT</p>
          <h1 id="hero-title">See More.<br /><em>From Space.</em></h1>
          <p className="hero-lead">Upload a Sentinel-2 GeoTIFF and generate a super-resolved 4× output using the FastSEN2SR model.</p>
          <MagneticButton className="hero-cta" onClick={connect}>Launch Workspace <span aria-hidden="true">→</span></MagneticButton>
        </motion.div>
        <motion.div className="hero-visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .12, duration: 1.1 }} aria-hidden="true">
          <motion.img src="/visuals/hero-earth-satellite.png" alt="" animate={reduceMotion ? {} : { scale: [1.015, 1.035, 1.015] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      </section>
      <section className="demo-section" aria-label="Interactive workspace demo">
        <div className="showcase-grid">
          <WorkspaceDemo
            loaded={loaded}
            fileName={selectedFile?.name}
            status={status}
            error={error}
            phase={phase}
            uploadPercent={uploadPercent}
            timing={timing}
            onSelect={handleFileSelect}
            onRun={handleUpload}
            onDownload={handleDownload}
          />
          <ComparisonDemo active={loaded} />
        </div>
      </section>
      <AboutSection />
      <footer id="about-footer"><span>FASTSEN2SR</span><p>Visual foundation · Smart India Hackathon project presentation</p><div>⌄ Scroll to explore</div></footer>
    </div>
  </main>
}

export function App() { return <MotionConfig reducedMotion="user"><Scene /></MotionConfig> }
