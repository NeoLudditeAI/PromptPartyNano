// lib/feature-detection.test.ts
// Unit tests for feature detection functions

import { describe, it, expect } from 'vitest';
import { 
  detectEditBadges, 
  analyzeEditCommand, 
  validateEditCommand,
  getBadgeColorClass,
  getBadgePriority,
  sortBadgesByPriority
} from './feature-detection';
import { ImageEdit, FeatureBadge } from '../types';

describe('Feature Detection', () => {
  describe('validateEditCommand', () => {
    it('should validate empty command', () => {
      const result = validateEditCommand('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Edit command cannot be empty');
    });

    it('should validate command length', () => {
      const longCommand = 'a'.repeat(30);
      const result = validateEditCommand(longCommand);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Edit command must be 25 characters or less');
    });

    it('should validate valid command', () => {
      const result = validateEditCommand('add hat');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid characters', () => {
      const result = validateEditCommand('add <hat>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Edit command contains invalid characters');
    });
  });

  describe('analyzeEditCommand', () => {
    it('should detect text potential', () => {
      const result = analyzeEditCommand('add text "hello"');
      expect(result.hasTextPotential).toBe(true);
    });

    it('should detect fusion potential', () => {
      const result = analyzeEditCommand('style like reference');
      expect(result.hasFusionPotential).toBe(true);
    });

    it('should detect consistency potential', () => {
      const result = analyzeEditCommand('keep the face');
      expect(result.hasConsistencyPotential).toBe(true);
    });

    it('should determine complexity', () => {
      const simple = analyzeEditCommand('add hat');
      expect(simple.complexity).toBe('simple');

      const medium = analyzeEditCommand('add hat and change color');
      expect(medium.complexity).toBe('medium');

      const complex = analyzeEditCommand('add hat and change color and make it bigger');
      expect(complex.complexity).toBe('complex');
    });
  });

  describe('getBadgeColorClass', () => {
    it('should return correct color classes', () => {
      expect(getBadgeColorClass('edit')).toContain('bg-blue-100');
      expect(getBadgeColorClass('fusion')).toContain('bg-purple-100');
      expect(getBadgeColorClass('text')).toContain('bg-green-100');
      expect(getBadgeColorClass('consistency')).toContain('bg-orange-100');
      expect(getBadgeColorClass('verified')).toContain('bg-yellow-100');
    });
  });

  describe('getBadgePriority', () => {
    it('should return correct priorities', () => {
      expect(getBadgePriority('edit')).toBe(1);
      expect(getBadgePriority('fusion')).toBe(2);
      expect(getBadgePriority('text')).toBe(3);
      expect(getBadgePriority('consistency')).toBe(4);
      expect(getBadgePriority('verified')).toBe(5);
    });
  });

  describe('sortBadgesByPriority', () => {
    it('should sort badges by priority', () => {
      const badges: FeatureBadge[] = [
        { type: 'verified', description: 'Verified', verified: true, icon: '✅' },
        { type: 'edit', description: 'Edit', verified: true, icon: '🎨' },
        { type: 'fusion', description: 'Fusion', verified: true, icon: '🔀' }
      ];

      const sorted = sortBadgesByPriority(badges);
      expect(sorted[0].type).toBe('edit');
      expect(sorted[1].type).toBe('fusion');
      expect(sorted[2].type).toBe('verified');
    });
  });

  describe('detectEditBadges', () => {
    it('should detect edit badge for any command', async () => {
      const edit: ImageEdit = {
        id: '1',
        text: 'add hat',
        playerId: 'player1',
        timestamp: Date.now(),
        expandedPrompt: 'Add a hat',
        featureBadges: []
      };

      const badges = await detectEditBadges(edit);
      expect(badges).toHaveLength(1);
      expect(badges[0].type).toBe('edit');
    });

    it('should detect fusion badge with reference image', async () => {
      const edit: ImageEdit = {
        id: '1',
        text: 'style like reference',
        playerId: 'player1',
        timestamp: Date.now(),
        referenceImageUrl: 'https://example.com/ref.jpg',
        expandedPrompt: 'Apply style like reference',
        featureBadges: []
      };

      const badges = await detectEditBadges(edit);
      expect(badges).toHaveLength(2);
      expect(badges.some(b => b.type === 'edit')).toBe(true);
      expect(badges.some(b => b.type === 'fusion')).toBe(true);
    });
  });
});
