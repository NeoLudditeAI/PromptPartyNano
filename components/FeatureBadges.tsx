// components/FeatureBadges.tsx
// Feature badge display component for Nano Banana capabilities

import React from 'react';
import { FeatureBadge } from '../types';
import { getBadgeColorClass, sortBadgesByPriority } from '../lib/feature-detection';

interface FeatureBadgesProps {
  badges: FeatureBadge[];
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FeatureBadges: React.FC<FeatureBadgesProps> = ({
  badges,
  showLabels = true,
  size = 'md',
  className = ''
}) => {
  const sortedBadges = sortBadgesByPriority(badges);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  if (badges.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sortedBadges.map((badge, index) => (
        <div
          key={`${badge.type}-${index}`}
          className={`
            ${sizeClasses[size]}
            ${getBadgeColorClass(badge.type)}
            rounded-full font-medium border
            flex items-center gap-1
            transition-all duration-200
            hover:scale-105 hover:shadow-sm
          `}
          title={badge.description}
        >
          <span className="text-sm">{badge.icon}</span>
          {showLabels && (
            <span className="font-medium">{badge.description}</span>
          )}
          {badge.verified && (
            <span className="text-xs opacity-75">✓</span>
          )}
        </div>
      ))}
    </div>
  );
};

// Compact version for tight spaces
export const CompactFeatureBadges: React.FC<FeatureBadgesProps> = ({
  badges,
  className = ''
}) => {
  const sortedBadges = sortBadgesByPriority(badges);
  
  if (badges.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex gap-1 ${className}`}>
      {sortedBadges.map((badge, index) => (
        <div
          key={`${badge.type}-${index}`}
          className={`
            ${getBadgeColorClass(badge.type)}
            w-6 h-6 rounded-full
            flex items-center justify-center
            text-xs font-bold
            border
            transition-all duration-200
            hover:scale-110
          `}
          title={badge.description}
        >
          {badge.icon}
        </div>
      ))}
    </div>
  );
};

// Badge with tooltip for detailed information
export const DetailedFeatureBadges: React.FC<FeatureBadgesProps> = ({
  badges,
  className = ''
}) => {
  const sortedBadges = sortBadgesByPriority(badges);
  
  if (badges.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700">Nano Banana Capabilities Used:</h4>
      <div className="grid grid-cols-1 gap-2">
        {sortedBadges.map((badge, index) => (
          <div
            key={`${badge.type}-${index}`}
            className={`
              ${getBadgeColorClass(badge.type)}
              px-3 py-2 rounded-lg
              flex items-center gap-3
              border
              transition-all duration-200
              hover:shadow-md
            `}
          >
            <span className="text-lg">{badge.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{badge.description}</div>
              <div className="text-xs opacity-75">
                {getCapabilityDescription(badge.type)}
              </div>
            </div>
            {badge.verified && (
              <span className="text-green-600 text-sm">✓ Verified</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Get detailed description for each capability
const getCapabilityDescription = (badgeType: string): string => {
  const descriptions: Record<string, string> = {
    edit: 'Basic text-to-image editing using Nano Banana',
    fusion: 'Multi-image composition and style transfer',
    text: 'High-fidelity text rendering within images',
    consistency: 'Maintaining subject coherence across edits',
    verified: 'SynthID watermark detected for content verification'
  };
  
  return descriptions[badgeType] || 'Nano Banana capability';
};
