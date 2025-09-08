// types/badges.ts

export type CapabilityBadge = 
  | 'edit'           // Iterative editing
  | 'fusion'         // Multi-image fusion
  | 'text'           // High-fidelity text rendering
  | 'consistency'    // Image consistency
  | 'verified'       // SynthID verification

export interface BadgeInfo {
  id: CapabilityBadge
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export const CAPABILITY_BADGES: Record<CapabilityBadge, BadgeInfo> = {
  edit: {
    id: 'edit',
    name: 'Edit',
    description: 'Iterative image editing with natural language',
    icon: '✏️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  fusion: {
    id: 'fusion',
    name: 'Fusion',
    description: 'Multi-image fusion and style transfer',
    icon: '🎨',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  text: {
    id: 'text',
    name: 'Text',
    description: 'High-fidelity text rendering in images',
    icon: '📝',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  consistency: {
    id: 'consistency',
    name: 'Consistency',
    description: 'Maintains subject identity across edits',
    icon: '🔗',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  verified: {
    id: 'verified',
    name: 'Verified',
    description: 'SynthID watermarking for provenance',
    icon: '✅',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  }
}

export interface ImageCapabilities {
  edit: boolean
  fusion: boolean
  text: boolean
  consistency: boolean
  verified: boolean
}

export function detectImageCapabilities(
  imageUrl: string,
  editCommand?: string,
  sourceImage?: string,
  hasReferenceImage?: boolean
): ImageCapabilities {
  // Enhanced text detection patterns
  const textPatterns = [
    'text', 'headline', 'poster', 'sign', 'label', 'word', 'letter', 'title',
    'caption', 'subtitle', 'banner', 'logo', 'brand', 'name', 'write', 'add text',
    'put text', 'make text', 'create text', 'insert text', 'show text'
  ]
  
  const hasTextCommand = !!editCommand && textPatterns.some(pattern => 
    editCommand.toLowerCase().includes(pattern)
  )

  return {
    edit: !!editCommand, // Always true for edit mode
    fusion: !!hasReferenceImage, // True if reference image was used
    text: hasTextCommand, // Detect text-related commands
    consistency: !!sourceImage, // True if previous image was used
    verified: true // Always true for Nano Banana (SynthID included)
  }
}
