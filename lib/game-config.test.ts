// lib/game-config.test.ts

import { describe, it, expect } from 'vitest'
import { 
  GAME_PRESETS, 
  getGameConfig, 
  createCustomGameConfig, 
  validateGameConfig, 
  getConfigSummary, 
  calculateTurnsPerPlayer, 
  isExperimentalConfig 
} from './game-config'
import { GAME_CONFIG } from '../types'

describe('Game Configuration System', () => {
  describe('GAME_PRESETS', () => {
    it('should have all required presets', () => {
      expect(GAME_PRESETS.QUICK).toBeDefined()
      expect(GAME_PRESETS.STANDARD).toBeDefined()
      expect(GAME_PRESETS.EXTENDED).toBeDefined()
      expect(GAME_PRESETS.EXPERIMENTAL).toBeDefined()
    })

    it('should have different turn counts for different presets', () => {
      expect(GAME_PRESETS.QUICK.TURNS_PER_GAME).toBe(4)
      expect(GAME_PRESETS.STANDARD.TURNS_PER_GAME).toBe(6)
      expect(GAME_PRESETS.EXTENDED.TURNS_PER_GAME).toBe(10)
      expect(GAME_PRESETS.EXPERIMENTAL.TURNS_PER_GAME).toBe(8)
    })

    it('should have different character limits for different presets', () => {
      expect(GAME_PRESETS.QUICK.MAX_TURN_LENGTH).toBe(20)
      expect(GAME_PRESETS.STANDARD.MAX_TURN_LENGTH).toBe(25)
      expect(GAME_PRESETS.EXTENDED.MAX_TURN_LENGTH).toBe(30)
      expect(GAME_PRESETS.EXPERIMENTAL.MAX_TURN_LENGTH).toBe(35)
    })
  })

  describe('getGameConfig', () => {
    it('should return STANDARD config by default', () => {
      const config = getGameConfig()
      expect(config.TURNS_PER_GAME).toBe(6)
      expect(config.MAX_TURN_LENGTH).toBe(25)
    })

    it('should return QUICK config when specified', () => {
      const config = getGameConfig('QUICK')
      expect(config.TURNS_PER_GAME).toBe(4)
      expect(config.MAX_TURN_LENGTH).toBe(20)
    })

    it('should return EXTENDED config when specified', () => {
      const config = getGameConfig('EXTENDED')
      expect(config.TURNS_PER_GAME).toBe(10)
      expect(config.MAX_TURN_LENGTH).toBe(30)
    })

    it('should return EXPERIMENTAL config when specified', () => {
      const config = getGameConfig('EXPERIMENTAL')
      expect(config.TURNS_PER_GAME).toBe(8)
      expect(config.MAX_TURN_LENGTH).toBe(35)
      expect(config.ALLOW_MID_GAME_JOINS).toBe(true)
    })
  })

  describe('createCustomGameConfig', () => {
    it('should create config with custom overrides', () => {
      const customConfig = createCustomGameConfig({
        TURNS_PER_GAME: 12,
        MAX_TURN_LENGTH: 40,
        AUTO_START_ON_FULL: true
      })

      expect(customConfig.TURNS_PER_GAME).toBe(12)
      expect(customConfig.MAX_TURN_LENGTH).toBe(40)
      expect(customConfig.AUTO_START_ON_FULL).toBe(true)
      expect(customConfig.MIN_PLAYERS).toBe(GAME_CONFIG.MIN_PLAYERS) // Unchanged
    })

    it('should preserve all default values when not overridden', () => {
      const customConfig = createCustomGameConfig({
        TURNS_PER_GAME: 15
      })

      expect(customConfig.TURNS_PER_GAME).toBe(15)
      expect(customConfig.MAX_TURN_LENGTH).toBe(GAME_CONFIG.MAX_TURN_LENGTH)
      expect(customConfig.MIN_PLAYERS).toBe(GAME_CONFIG.MIN_PLAYERS)
      expect(customConfig.MAX_PLAYERS).toBe(GAME_CONFIG.MAX_PLAYERS)
    })
  })

  describe('validateGameConfig', () => {
    it('should validate correct configuration', () => {
      const config = getGameConfig('STANDARD')
      const result = validateGameConfig(config)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid TURNS_PER_GAME', () => {
      const invalidConfig = createCustomGameConfig({ TURNS_PER_GAME: 0 })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('TURNS_PER_GAME must be at least 1')
    })

    it('should reject invalid MIN_PLAYERS', () => {
      const invalidConfig = createCustomGameConfig({ MIN_PLAYERS: 0 })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('MIN_PLAYERS must be at least 1')
    })

    it('should reject when MAX_PLAYERS < MIN_PLAYERS', () => {
      const invalidConfig = createCustomGameConfig({ 
        MIN_PLAYERS: 5, 
        MAX_PLAYERS: 3 
      })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('MAX_PLAYERS must be greater than or equal to MIN_PLAYERS')
    })

    it('should reject invalid MAX_TURN_LENGTH', () => {
      const invalidConfig = createCustomGameConfig({ MAX_TURN_LENGTH: 0 })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('MAX_TURN_LENGTH must be at least 1')
    })

    it('should reject when MAX_TOTAL_LENGTH < MAX_TURN_LENGTH', () => {
      const invalidConfig = createCustomGameConfig({ 
        MAX_TURN_LENGTH: 50, 
        MAX_TOTAL_LENGTH: 25 
      })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('MAX_TOTAL_LENGTH must be greater than or equal to MAX_TURN_LENGTH')
    })

    it('should reject invalid WARNING_THRESHOLD', () => {
      const invalidConfig = createCustomGameConfig({ 
        MAX_TURN_LENGTH: 25, 
        WARNING_THRESHOLD: 25 
      })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('WARNING_THRESHOLD must be less than MAX_TURN_LENGTH')
    })

    it('should return multiple errors for multiple issues', () => {
      const invalidConfig = createCustomGameConfig({ 
        TURNS_PER_GAME: 0,
        MIN_PLAYERS: 0,
        MAX_PLAYERS: 1
      })
      const result = validateGameConfig(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('getConfigSummary', () => {
    it('should return formatted summary for standard config', () => {
      const config = getGameConfig('STANDARD')
      const summary = getConfigSummary(config)
      
      expect(summary).toBe('6 turns, 2-6 players, 25 chars/turn')
    })

    it('should return formatted summary for quick config', () => {
      const config = getGameConfig('QUICK')
      const summary = getConfigSummary(config)
      
      expect(summary).toBe('4 turns, 2-6 players, 20 chars/turn')
    })
  })

  describe('calculateTurnsPerPlayer', () => {
    it('should calculate correct turns per player for 2 players', () => {
      const config = getGameConfig('STANDARD')
      const turnsPerPlayer = calculateTurnsPerPlayer(config, 2)
      
      expect(turnsPerPlayer).toBe(3) // 6 turns / 2 players = 3 each
    })

    it('should calculate correct turns per player for 3 players', () => {
      const config = getGameConfig('STANDARD')
      const turnsPerPlayer = calculateTurnsPerPlayer(config, 3)
      
      expect(turnsPerPlayer).toBe(2) // 6 turns / 3 players = 2 each
    })

    it('should calculate correct turns per player for 6 players', () => {
      const config = getGameConfig('STANDARD')
      const turnsPerPlayer = calculateTurnsPerPlayer(config, 6)
      
      expect(turnsPerPlayer).toBe(1) // 6 turns / 6 players = 1 each
    })

    it('should round up for uneven division', () => {
      const config = getGameConfig('EXTENDED') // 10 turns
      const turnsPerPlayer = calculateTurnsPerPlayer(config, 3)
      
      expect(turnsPerPlayer).toBe(4) // 10 turns / 3 players = 3.33... rounds up to 4
    })
  })

  describe('isExperimentalConfig', () => {
    it('should return false for standard config', () => {
      const config = getGameConfig('STANDARD')
      const isExperimental = isExperimentalConfig(config)
      
      expect(isExperimental).toBe(false)
    })

    it('should return true for experimental config', () => {
      const config = getGameConfig('EXPERIMENTAL')
      const isExperimental = isExperimentalConfig(config)
      
      expect(isExperimental).toBe(true)
    })

    it('should return true for custom config with experimental features', () => {
      const customConfig = createCustomGameConfig({
        TURNS_PER_GAME: 15, // > 10
        ALLOW_MID_GAME_JOINS: true
      })
      const isExperimental = isExperimentalConfig(customConfig)
      
      expect(isExperimental).toBe(true)
    })

    it('should return true for custom config with high character limits', () => {
      const customConfig = createCustomGameConfig({
        MAX_TURN_LENGTH: 35, // > 30
        MAX_TOTAL_LENGTH: 2000 // > 1500
      })
      const isExperimental = isExperimentalConfig(customConfig)
      
      expect(isExperimental).toBe(true)
    })
  })
}) 