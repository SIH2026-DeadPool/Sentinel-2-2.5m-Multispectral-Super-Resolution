import { motion } from 'motion/react'
import { useRef } from 'react'
import { MagneticButton } from './MagneticButton'

type Props = {
  loaded: boolean
  fileName?: string
  status?: string
  error?: string
  phase: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  uploadPercent: number
  timing: { uploadMs?: number; inputReadMs?: number; processingMs?: number }
  onSelect: (file: File | null) => void
  onRun: () => void
  onDownload: () => void
}

export function WorkspaceDemo({
  loaded,
  fileName,
  status,
  error,
  phase,
  uploadPercent,
  timing,
  onSelect,
  onRun,
  onDownload,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const isActive = phase === 'uploading' || phase === 'processing'
  const primaryLabel = loaded
    ? 'Download output'
    : isActive
      ? phase === 'uploading' ? `Uploading ${uploadPercent}%` : 'Running model…'
      : fileName
        ? 'Run super-resolution'
        : 'Choose GeoTIFF'

  const formatDuration = (value?: number) => value === undefined ? '' : `${(value / 1000).toFixed(1)}s`

  return <motion.section id="workspace" className="workspace-card hud-card" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
    <div className="corner corner-a" /><div className="corner corner-b" />
    <div className="upload-icon" aria-hidden="true">{loaded ? '✓' : '⇧'}</div>
    <p className="eyebrow">{loaded ? 'INFERENCE COMPLETE' : 'MODEL WORKSPACE'}</p>
    <h2>{loaded ? 'Output ready' : 'Upload satellite imagery'}</h2>
    <p className="subcopy">{fileName ? `Selected file: ${fileName}` : '4-band GeoTIFF · .tif / .tiff'}</p>
    <div className="band-row"><span>B2</span><span>B3</span><span>B4</span><span>B8</span></div>
    <div className="workspace-controls" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onSelect(event.dataTransfer.files?.[0] ?? null) }}>
      <input
        ref={inputRef}
        type="file"
        accept=".tif,.tiff,image/tiff"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null
          onSelect(file)
          event.target.value = ''
        }}
      />
      <button type="button" className="secondary-action" onClick={() => inputRef.current?.click()}>
        Select file
      </button>
      <MagneticButton className="primary-action" onClick={loaded ? onDownload : onRun} disabled={isActive}>
        <span aria-hidden="true">✦</span> {primaryLabel} <span aria-hidden="true">→</span>
      </MagneticButton>
    </div>
    <p className={`status-text ${error ? 'error' : ''}`}>{error || status || 'Drop a .tif or .tiff here, or select a file to begin.'}</p>
    {isActive && <p className="progress-note" aria-live="polite">{phase === 'uploading' ? `Measured transfer: ${uploadPercent}%` : 'Transfer finished. The backend is processing the image; no fabricated percentage is shown.'}</p>}
    {phase === 'complete' && <p className="timing-note">Transfer {formatDuration(timing.uploadMs)} · backend read {formatDuration(timing.inputReadMs)} · model {formatDuration(timing.processingMs) || 'reported by backend'}</p>}
  </motion.section>
}
