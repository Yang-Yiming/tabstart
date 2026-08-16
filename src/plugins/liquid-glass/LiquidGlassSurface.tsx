import type { HTMLAttributes } from 'react'
import { LiquidGlass } from 'simple-liquid-glass'

export function LiquidGlassSurface({ children, className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <LiquidGlass
      {...props}
      className={className}
      style={style}
      mode="custom"
      radius={24}
      border={0.08}
      lightness={55}
      alpha={0.45}
      displace={4}
      blur={0}
      dispersion={45}
      saturation={140}
      frost={0.15}
      borderColor="rgba(255, 255, 255, 0.28)"
      glassColor="rgba(255, 255, 255, 0.32)"
    >
      {children}
    </LiquidGlass>
  )
}
