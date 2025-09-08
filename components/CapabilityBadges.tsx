// components/CapabilityBadges.tsx
'use client'

import React from 'react'
import { CapabilityBadge, CAPABILITY_BADGES, ImageCapabilities } from '../types/badges'

interface CapabilityBadgesProps {
  capabilities: ImageCapabilities
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CapabilityBadges({ 
  capabilities, 
  className = '',
  showLabels = true,
  size = 'md'
}: CapabilityBadgesProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const activeBadges = Object.entries(capabilities)
    .filter(([_, isActive]) => isActive)
    .map(([badgeId]) => badgeId as CapabilityBadge)

  if (activeBadges.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {activeBadges.map((badgeId) => {
        const badge = CAPABILITY_BADGES[badgeId]
        return (
          <div
            key={badgeId}
            className={`
              inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-300
              ${sizeClasses[size]}
              ${badge.bgColor} ${badge.color}
              hover:scale-105 hover:shadow-md
            `}
            title={badge.description}
          >
            <span className={iconSizes[size]}>
              {badge.icon}
            </span>
            {showLabels && (
              <span className="font-semibold">
                {badge.name}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Badge animation component for when badges are first activated
export function BadgeAnimation({ badgeId, children }: { badgeId: CapabilityBadge, children: React.ReactNode }) {
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 1000)
    return () => clearTimeout(timer)
  }, [badgeId])

  return (
    <div className={`
      transition-all duration-500
      ${isAnimating ? 'scale-110 animate-pulse' : 'scale-100'}
    `}>
      {children}
    </div>
  )
}
