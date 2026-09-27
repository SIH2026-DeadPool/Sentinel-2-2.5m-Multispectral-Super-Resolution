import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MagneticButton } from './MagneticButton'

type Props = { onLaunch: () => void; onCompare: () => void }

export function Header({ onLaunch, onCompare }: Props) {
  const [open, setOpen] = useState(false)
  const go = () => { setOpen(false); onLaunch() }
  const goCompare = () => { setOpen(false); onCompare() }
  return <header className="site-header">
    <a className="wordmark" href="#top" aria-label="FastSEN2SR home">FastSEN<span>2</span>SR</a>
    <div className="orbit-status"><i /> ORBITAL SYSTEM ONLINE</div>
    <nav className="desktop-nav" aria-label="Main navigation">
      <a href="#top">Explore</a><button onClick={go}>Workspace</button><button onClick={goCompare}>Compare</button><a href="#about">About</a>
    </nav>
    <MagneticButton className="header-cta" onClick={go}>Launch Workspace <span aria-hidden="true">↗</span></MagneticButton>
    <button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button>
    <AnimatePresence>{open && <motion.nav className="mobile-nav" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} aria-label="Mobile navigation">
      <a href="#top" onClick={() => setOpen(false)}>Explore</a><button onClick={go}>Workspace</button><button onClick={goCompare}>Compare</button><a href="#about" onClick={() => setOpen(false)}>About</a>
    </motion.nav>}</AnimatePresence>
  </header>
}
