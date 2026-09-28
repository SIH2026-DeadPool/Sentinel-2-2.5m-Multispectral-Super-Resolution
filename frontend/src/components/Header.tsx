import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MagneticButton } from './MagneticButton'

export type PageTab = 'home' | 'workspace' | 'compare' | 'about'

type Props = {
  activeTab: PageTab
  onSelectTab: (tab: PageTab) => void
}

export function Header({ activeTab, onSelectTab }: Props) {
  const [open, setOpen] = useState(false)
  const navTo = (tab: PageTab) => {
    setOpen(false)
    onSelectTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <header className="site-header">
    <button className="wordmark-btn" onClick={() => navTo('home')} aria-label="FastSEN2SR home" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
      FastSEN<span style={{ color: '#38bdf8' }}>2</span>SR
    </button>
    <div className="orbit-status"><i /> ORBITAL SYSTEM ONLINE</div>
    <nav className="desktop-nav" aria-label="Main navigation">
      <button className={activeTab === 'home' ? 'active' : ''} onClick={() => navTo('home')}>Explore</button>
      <button className={activeTab === 'workspace' ? 'active' : ''} onClick={() => navTo('workspace')}>Workspace</button>
      <button className={activeTab === 'compare' ? 'active' : ''} onClick={() => navTo('compare')}>Compare</button>
      <button className={activeTab === 'about' ? 'active' : ''} onClick={() => navTo('about')}>About</button>
    </nav>
    <MagneticButton className="header-cta" onClick={() => navTo('workspace')}>Launch Workspace <span aria-hidden="true">↗</span></MagneticButton>
    <button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button>
    <AnimatePresence>{open && <motion.nav className="mobile-nav" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} aria-label="Mobile navigation">
      <button className={activeTab === 'home' ? 'active' : ''} onClick={() => navTo('home')}>Explore</button>
      <button className={activeTab === 'workspace' ? 'active' : ''} onClick={() => navTo('workspace')}>Workspace</button>
      <button className={activeTab === 'compare' ? 'active' : ''} onClick={() => navTo('compare')}>Compare</button>
      <button className={activeTab === 'about' ? 'active' : ''} onClick={() => navTo('about')}>About</button>
    </motion.nav>}</AnimatePresence>
  </header>
}
