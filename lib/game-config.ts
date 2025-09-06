// lib/game-config.ts

import { GAME_CONFIG, GameConfig } from '../types'

// Configuration presets for different game modes
export const GAME_PRESETS: Record<string, GameConfig> = {
  // Quick game - fast-paced, fewer turns
  QUICK: {
    ...GAME_CONFIG,
    TURNS_PER_GAME: 4,
    MAX_TURN_LENGTH: 20,
    AUTO_START_ON_FULL: true,
  },
  
  // Standard game - balanced experience
  STANDARD: {
    ...GAME_CONFIG,
    TURNS_PER_GAME: 6,
    MAX_TURN_LENGTH: 25,
    AUTO_START_ON_FULL: false,
  },
  
  // Extended game - more turns, longer prompts
  EXTENDED: {
    ...GAME_CONFIG,
    TURNS_PER_GAME: 10,
    MAX_TURN_LENGTH: 30,
    MAX_TOTAL_LENGTH: 1500,
    AUTO_START_ON_FULL: false,
  },
  
  // Experimental - for testing new mechanics
  EXPERIMENTAL: {
    ...GAME_CONFIG,
    TURNS_PER_GAME: 8,
    MAX_TURN_LENGTH: 35,
    MAX_TOTAL_LENGTH: 2000,
    ALLOW_MID_GAME_JOINS: true,
    GENERATE_IMAGE_EVERY_TURN: false,
  }
}

export type GamePreset = keyof typeof GAME_PRESETS

// Function to get configuration for a specific preset
export function getGameConfig(preset: GamePreset = 'STANDARD'): GameConfig {
  return GAME_PRESETS[preset]
}

// Function to create a custom configuration
export function createCustomGameConfig(overrides: Partial<GameConfig>): GameConfig {
  return {
    ...GAME_CONFIG,
    ...overrides
  }
}

// Function to validate game configuration
export function validateGameConfig(config: GameConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (config.TURNS_PER_GAME < 1) {
    errors.push('TURNS_PER_GAME must be at least 1')
  }
  
  if (config.MIN_PLAYERS < 1) {
    errors.push('MIN_PLAYERS must be at least 1')
  }
  
  if (config.MAX_PLAYERS < config.MIN_PLAYERS) {
    errors.push('MAX_PLAYERS must be greater than or equal to MIN_PLAYERS')
  }
  
  if (config.MAX_TURN_LENGTH < 1) {
    errors.push('MAX_TURN_LENGTH must be at least 1')
  }
  
  if (config.MAX_TOTAL_LENGTH < config.MAX_TURN_LENGTH) {
    errors.push('MAX_TOTAL_LENGTH must be greater than or equal to MAX_TURN_LENGTH')
  }
  
  if (config.WARNING_THRESHOLD >= config.MAX_TURN_LENGTH) {
    errors.push('WARNING_THRESHOLD must be less than MAX_TURN_LENGTH')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Function to get configuration summary for UI
export function getConfigSummary(config: GameConfig): string {
  return `${config.TURNS_PER_GAME} turns, ${config.MIN_PLAYERS}-${config.MAX_PLAYERS} players, ${config.MAX_TURN_LENGTH} chars/turn`
}

// Function to calculate turns per player for a given configuration
export function calculateTurnsPerPlayer(config: GameConfig, playerCount: number): number {
  return Math.ceil(config.TURNS_PER_GAME / playerCount)
}

// Function to check if a game configuration is experimental
export function isExperimentalConfig(config: GameConfig): boolean {
  return config.ALLOW_MID_GAME_JOINS || 
         config.TURNS_PER_GAME > 10 || 
         config.MAX_TURN_LENGTH > 30 ||
         config.MAX_TOTAL_LENGTH > 1500
} 