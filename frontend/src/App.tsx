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
  const [resultPngBlob, setResultPngBlob] = useState<Blob | null>(null)
  const [resultPngUrl, setResultPngUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle')
  const [uploadPercent, setUploadPercent] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [timing, setTiming] = useState<{ uploadMs?: number; inputReadMs?: number; processingMs?: number }>({})
  const reduceMotion = useReducedMotion()

  const compare = () => document.getElementById('compare')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })

  const handleFileSelect = (file: File | null) => {
    if (resultPngUrl) {
      URL.revokeObjectURL(resultPngUrl)
      setResultPngUrl(null)
    }
    setResultPngBlob(null)

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
    request.open('POST', `${API_BASE_URL}/predict-png`)
    request.responseType = 'blob'
    request.timeout = 15 * 60 * 1000
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadPercent(Math.round((event.loaded / event.total) * 100))
    }
    request.upload.onload = () => {
      const uploadMs = performance.now() - startedAt
      setTiming((current) => ({ ...current, uploadMs }))
      setPhase('processing')
      setStatus('Upload complete. Running super-resolution model…')
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

      const pngBlob = new Blob([request.response], { type: 'image/png' })
      const pngUrl = URL.createObjectURL(pngBlob)

      if (resultPngUrl) {
        URL.revokeObjectURL(resultPngUrl)
      }

      setResultPngBlob(pngBlob)
      setResultPngUrl(pngUrl)
      setTiming((current) => ({
        ...current,
        inputReadMs: Number.isFinite(serverInputReadMs) ? serverInputReadMs : undefined,
        processingMs: Number.isFinite(serverProcessingMs) ? serverProcessingMs : undefined,
      }))
      setPhase('complete')
      setStatus('Super-resolution complete! Your PNG output picture is ready.')
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

  const handleDownloadPng = (autoOpen = true) => {
    if (!resultPngBlob && !resultPngUrl) return

    const baseName = (selectedFile?.name ?? 'super_resolved').replace(/\.(tif|tiff)$/i, '')
    const fileName = `${baseName}_sr.png`

    const targetBlob = resultPngBlob || new Blob()
    const url = URL.createObjectURL(targetBlob)

    // Open image directly in new tab / browser photo viewer
    if (autoOpen) {
      window.open(url, '_blank')
    }

    // Trigger download of PNG picture
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = fileName
    a.setAttribute('download', fileName)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleDownloadTiff = () => {
    if (!selectedFile) return
    const formData = new FormData()
    formData.append('file', selectedFile)

    const request = new XMLHttpRequest()
    request.open('POST', `${API_BASE_URL}/predict`)
    request.responseType = 'blob'
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        const tiffBlob = new Blob([request.response], { type: 'image/tiff' })
        const url = URL.createObjectURL(tiffBlob)
        const baseName = selectedFile.name.replace(/\.(tif|tiff)$/i, '')
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${baseName}_sr.tif`
        a.setAttribute('download', `${baseName}_sr.tif`)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }
    }
    request.send(formData)
  }

  type PageTab = 'home' | 'workspace' | 'compare' | 'about'
  const [activeTab, setActiveTab] = useState<PageTab>('home')
  const loaded = Boolean(resultPngUrl)

  const handleNav = (tab: PageTab) => {
    setActiveTab(tab)
  }

  return <main id="top">
    <div className="space-bg" aria-hidden="true" /><div className="orbit-bg" aria-hidden="true" />
    <div className="page-frame">
      <Header activeTab={activeTab} onSelectTab={handleNav} />

      {/* PAGE 1: HOME PAGE */}
      {activeTab === 'home' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <section className="hero" aria-labelledby="hero-title">
            <motion.div className="hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, ease: 'easeOut' }}>
              <p className="eyebrow hero-eyebrow"><span /> FASTSEN2SR · 4× SATELLITE IMAGERY ENHANCEMENT</p>
              <h1 id="hero-title">See More.<br /><em>From Space.</em></h1>
              <p className="hero-lead">Upload a Sentinel-2 GeoTIFF and generate a super-resolved 4× output using the FastSEN2SR model.</p>
              <MagneticButton className="hero-cta" onClick={() => handleNav('workspace')}>Launch Workspace <span aria-hidden="true">→</span></MagneticButton>
            </motion.div>
            <motion.div className="hero-visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .12, duration: 1.1 }} aria-hidden="true">
              <motion.img src="/visuals/hero-earth-satellite.png" alt="" animate={reduceMotion ? {} : { scale: [1.015, 1.035, 1.015] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
            </motion.div>
          </section>

          <section className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', margin: '3rem 0' }}>
            <div className="hud-card" style={{ padding: '1.75rem', background: 'rgba(13, 22, 40, 0.65)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '1.25rem' }}>⚡ 4× Resolution Boost</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>Enhances Sentinel-2 10m/pixel multispectral bands up to 2.5m/pixel high-definition spatial resolution.</p>
            </div>
            <div className="hud-card" style={{ padding: '1.75rem', background: 'rgba(13, 22, 40, 0.65)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '1.25rem' }}>📡 4 Multispectral Bands</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>Simultaneously processes B2 (Blue), B3 (Green), B4 (Red), and B8 (NIR) spectral bands.</p>
            </div>
            <div className="hud-card" style={{ padding: '1.75rem', background: 'rgba(13, 22, 40, 0.65)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '1.25rem' }}>🖼️ Instant PNG & GeoTIFF</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>Download viewable PNG images for instant double-click viewing or raw GeoTIFF files for QGIS.</p>
            </div>
          </section>
        </motion.div>
      )}

      {/* PAGE 2: WORKSPACE PAGE */}
      {activeTab === 'workspace' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ paddingTop: '2rem' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <p className="eyebrow"><span /> DEDICATED MODEL WORKSPACE</p>
            <h1 style={{ fontSize: '2.5rem', color: '#fff' }}>Super-Resolution Processing Workspace</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0.5rem auto' }}>Upload your 4-band Sentinel-2 GeoTIFF file (.tif or .tiff) to run the 4× super-resolution neural model.</p>
          </div>
          <WorkspaceDemo
            loaded={loaded}
            fileName={selectedFile?.name}
            pngUrl={resultPngUrl}
            status={status}
            error={error}
            phase={phase}
            uploadPercent={uploadPercent}
            timing={timing}
            onSelect={handleFileSelect}
            onRun={handleUpload}
            onDownload={() => handleDownloadPng(true)}
            onDownloadTiff={handleDownloadTiff}
          />
        </motion.div>
      )}

      {/* PAGE 3: COMPARE PAGE */}
      {activeTab === 'compare' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ paddingTop: '2rem' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <p className="eyebrow"><span /> VISUAL COMPARISON DASHBOARD</p>
            <h1 style={{ fontSize: '2.5rem', color: '#fff' }}>Resolution Enhancement Viewer</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0.5rem auto' }}>Compare original low-resolution Sentinel-2 input against the 4× enhanced super-resolution output picture.</p>
          </div>
          <ComparisonDemo active={true} pngUrl={resultPngUrl} />
        </motion.div>
      )}

      {/* PAGE 4: ABOUT PAGE */}
      {activeTab === 'about' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ paddingTop: '2rem' }}>
          <AboutSection />
        </motion.div>
      )}

      <footer id="about-footer"><span>FASTSEN2SR</span><p>Visual foundation · Smart India Hackathon project presentation</p><div>FastSEN2SR Multi-Page App</div></footer>
    </div>
  </main>
}

export function App() { return <MotionConfig reducedMotion="user"><Scene /></MotionConfig> }
