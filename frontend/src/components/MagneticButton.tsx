import type { ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

type Props = {
  children: ReactNode
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

// Motion Primitives-style magnetic interaction, implemented locally for this project.
export function MagneticButton({ children, className = '', disabled = false, onClick, ...props }: Props) {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 220, damping: 16 })
  const springY = useSpring(y, { stiffness: 220, damping: 16 })

  return (
    <motion.button
      {...props}
      disabled={disabled}
      aria-disabled={disabled}
      className={`magnetic-button ${className}`}
      style={{ x: springX, y: springY, opacity: disabled ? 0.7 : 1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      onMouseMove={(event) => {
        if (reduceMotion || disabled) return
        const bounds = event.currentTarget.getBoundingClientRect()
        x.set(Math.max(-6, Math.min(6, (event.clientX - bounds.left - bounds.width / 2) * 0.045)))
        y.set(Math.max(-5, Math.min(5, (event.clientY - bounds.top - bounds.height / 2) * 0.045)))
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.button>
  )
}
