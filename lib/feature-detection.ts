// lib/feature-detection.ts
// Feature badge detection and analysis for Nano Banana capabilities

import { FeatureBadge, FeatureBadgeType, ImageEdit } from '../types';

// Feature badge definitions
export const FEATURE_BADGES: Record<FeatureBadgeType, Omit<FeatureBadge, 'verified'>> = {
  edit: {
    type: 'edit',
    description: 'Text-to-Image Editing',
    icon: '🎨'
  },
  fusion: {
    type: 'fusion',
    description: 'Multi-Image Fusion',
    icon: '🔀'
  },
  text: {
    type: 'text',
    description: 'High-Fidelity Text Rendering',
    icon: '📝'
  },
  consistency: {
    type: 'consistency',
    description: 'Subject Consistency Maintained',
    icon: '🔄'
  },
  verified: {
    type: 'verified',
    description: 'SynthID Watermark Detected',
    icon: '✅'
  }
};

// Detect all feature badges for an edit
export const detectEditBadges = async (edit: ImageEdit): Promise<FeatureBadge[]> => {
  const badges: FeatureBadge[] = [];

  // Edit Badge - Always present for any text-and-image call
  badges.push({
    ...FEATURE_BADGES.edit,
    verified: true
  });

  // Fusion Badge - When reference image is present
  if (edit.referenceImageUrl) {
    badges.push({
      ...FEATURE_BADGES.fusion,
      verified: true
    });
  }

  // Text Badge - When text-related commands are used
  if (isTextEdit(edit.text)) {
    badges.push({
      ...FEATURE_BADGES.text,
      verified: true
    });
  }

  // Consistency Badge - When consistency-related commands are used
  if (isConsistencyEdit(edit.text)) {
    badges.push({
      ...FEATURE_BADGES.consistency,
      verified: true
    });
  }

  // Verified Badge - Simulate SynthID detection
  if (await simulateSynthIdDetection()) {
    badges.push({
      ...FEATURE_BADGES.verified,
      verified: true
    });
  }

  return badges;
};

// Check if edit command is text-related
const isTextEdit = (editCommand: string): boolean => {
  const textKeywords = [
    'text', 'word', 'letter', 'font', 'type', 'caption', 'title', 'label',
    'sign', 'logo', 'brand', 'name', 'tag', 'quote', 'slogan', 'write',
    'add text', 'remove text', 'change text', 'make text', 'text size',
    'font size', 'text color', 'text style'
  ];
  
  const lowerCommand = editCommand.toLowerCase();
  return textKeywords.some(keyword => lowerCommand.includes(keyword));
};

// Check if edit command is consistency-related
const isConsistencyEdit = (editCommand: string): boolean => {
  const consistencyKeywords = [
    'keep', 'maintain', 'preserve', 'consistent', 'same', 'unchanged',
    'protect', 'hold', 'retain', 'continue', 'stay', 'remain'
  ];
  
  const lowerCommand = editCommand.toLowerCase();
  return consistencyKeywords.some(keyword => lowerCommand.includes(keyword));
};

// Simulate SynthID detection (replace with real implementation)
const simulateSynthIdDetection = async (): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 70% chance of detecting SynthID watermark
  return Math.random() > 0.3;
};

// Analyze edit command for feature potential
export const analyzeEditCommand = (editCommand: string): {
  hasTextPotential: boolean;
  hasFusionPotential: boolean;
  hasConsistencyPotential: boolean;
  complexity: 'simple' | 'medium' | 'complex';
} => {
  const lowerCommand = editCommand.toLowerCase();
  
  const hasTextPotential = isTextEdit(editCommand);
  const hasFusionPotential = lowerCommand.includes('style') || lowerCommand.includes('like') || lowerCommand.includes('similar');
  const hasConsistencyPotential = isConsistencyEdit(editCommand);
  
  // Determine complexity based on command length and keywords
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  
  if (editCommand.length > 20) {
    complexity = 'complex';
  } else if (editCommand.length > 10 || lowerCommand.includes('and') || lowerCommand.includes('then')) {
    complexity = 'medium';
  }
  
  return {
    hasTextPotential,
    hasFusionPotential,
    hasConsistencyPotential,
    complexity
  };
};

// Get badge color class for UI
export const getBadgeColorClass = (badgeType: FeatureBadgeType): string => {
  const colorMap: Record<FeatureBadgeType, string> = {
    edit: 'bg-blue-100 text-blue-800 border-blue-200',
    fusion: 'bg-purple-100 text-purple-800 border-purple-200',
    text: 'bg-green-100 text-green-800 border-green-200',
    consistency: 'bg-orange-100 text-orange-800 border-orange-200',
    verified: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  
  return colorMap[badgeType];
};

// Get badge priority for display order
export const getBadgePriority = (badgeType: FeatureBadgeType): number => {
  const priorityMap: Record<FeatureBadgeType, number> = {
    edit: 1,      // Always first
    fusion: 2,    // High priority
    text: 3,      // Medium priority
    consistency: 4, // Medium priority
    verified: 5   // Always last
  };
  
  return priorityMap[badgeType];
};

// Sort badges by priority
export const sortBadgesByPriority = (badges: FeatureBadge[]): FeatureBadge[] => {
  return badges.sort((a, b) => getBadgePriority(a.type) - getBadgePriority(b.type));
};

// Validate edit command
export const validateEditCommand = (editCommand: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check length
  if (editCommand.length === 0) {
    errors.push('Edit command cannot be empty');
  } else if (editCommand.length > 25) {
    errors.push('Edit command must be 25 characters or less');
  }
  
  // Check for invalid characters
  const invalidChars = /[<>{}[\]\\|`~]/;
  if (invalidChars.test(editCommand)) {
    errors.push('Edit command contains invalid characters');
  }
  
  // Check for common mistakes
  if (editCommand.length > 0 && editCommand.length < 3) {
    warnings.push('Very short edit command - consider being more specific');
  }
  
  if (editCommand.includes('  ')) {
    warnings.push('Multiple spaces detected - consider using single spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
