// lib/player-identity.test.ts
import { describe, it, expect } from 'vitest'
import { User, PlayerId } from '../types'

// Helper functions for player identity management
const validatePlayerName = (name: string): boolean => {
  return name.trim().length >= 1 && name.trim().length <= 20
}

const createPlayer = (displayName: string): User => {
  if (!validatePlayerName(displayName)) {
    throw new Error('Invalid player name')
  }
  
  return {
    id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    displayName: displayName.trim()
  }
}

const getPlayerName = (playerId: PlayerId, players: User[]): string => {
  const player = players.find(p => p.id === playerId)
  return player?.displayName || playerId
}

const validatePlayerCount = (players: User[]): boolean => {
  return players.length >= 2 && players.length <= 6
}

const removePlayer = (playerId: PlayerId, players: User[]): User[] => {
  return players.filter(p => p.id !== playerId)
}

describe('Player Identity Management', () => {
  describe('Player Name Validation', () => {
    it('should validate valid player names', () => {
      expect(validatePlayerName('Alice')).toBe(true)
      expect(validatePlayerName('Bob')).toBe(true)
      expect(validatePlayerName('Charlie')).toBe(true)
      expect(validatePlayerName('A')).toBe(true)
      expect(validatePlayerName('Valid Name')).toBe(true)
    })

    it('should reject invalid player names', () => {
      expect(validatePlayerName('')).toBe(false)
      expect(validatePlayerName('   ')).toBe(false)
      expect(validatePlayerName('')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validatePlayerName('A')).toBe(true)
      expect(validatePlayerName('A'.repeat(20))).toBe(true)
      expect(validatePlayerName('A'.repeat(21))).toBe(false)
    })
  })

  describe('Player Creation', () => {
    it('should create a player with valid name', () => {
      const player = createPlayer('Alice')
      
      expect(player.displayName).toBe('Alice')
      expect(player.id).toMatch(/^player-\d+-[a-z0-9]{9}$/)
      expect(typeof player.id).toBe('string')
    })

    it('should throw error for invalid player name', () => {
      expect(() => createPlayer('')).toThrow('Invalid player name')
      expect(() => createPlayer('   ')).toThrow('Invalid player name')
    })

    it('should trim whitespace from player names', () => {
      const player = createPlayer('  Bob  ')
      expect(player.displayName).toBe('Bob')
    })
  })

  describe('Player Name Resolution', () => {
    const mockPlayers: User[] = [
      { id: 'player-1', displayName: 'Alice' },
      { id: 'player-2', displayName: 'Bob' },
      { id: 'player-3', displayName: 'Charlie' }
    ]

    it('should return player name when found', () => {
      expect(getPlayerName('player-1', mockPlayers)).toBe('Alice')
      expect(getPlayerName('player-2', mockPlayers)).toBe('Bob')
      expect(getPlayerName('player-3', mockPlayers)).toBe('Charlie')
    })

    it('should return player ID when player not found', () => {
      expect(getPlayerName('unknown-player', mockPlayers)).toBe('unknown-player')
      expect(getPlayerName('player-999', mockPlayers)).toBe('player-999')
    })

    it('should handle empty players array', () => {
      expect(getPlayerName('any-player', [])).toBe('any-player')
    })
  })

  describe('Player Count Validation', () => {
    const createMockPlayers = (count: number): User[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `player-${i}`,
        displayName: `Player ${i}`
      }))
    }

    it('should validate correct player counts', () => {
      expect(validatePlayerCount(createMockPlayers(2))).toBe(true)
      expect(validatePlayerCount(createMockPlayers(3))).toBe(true)
      expect(validatePlayerCount(createMockPlayers(4))).toBe(true)
      expect(validatePlayerCount(createMockPlayers(5))).toBe(true)
      expect(validatePlayerCount(createMockPlayers(6))).toBe(true)
    })

    it('should reject invalid player counts', () => {
      expect(validatePlayerCount(createMockPlayers(1))).toBe(false)
      expect(validatePlayerCount(createMockPlayers(0))).toBe(false)
      expect(validatePlayerCount(createMockPlayers(7))).toBe(false)
      expect(validatePlayerCount(createMockPlayers(10))).toBe(false)
    })
  })

  describe('Player Removal', () => {
    const mockPlayers: User[] = [
      { id: 'player-1', displayName: 'Alice' },
      { id: 'player-2', displayName: 'Bob' },
      { id: 'player-3', displayName: 'Charlie' }
    ]

    it('should remove existing player', () => {
      const result = removePlayer('player-2', mockPlayers)
      
      expect(result).toHaveLength(2)
      expect(result.find(p => p.id === 'player-2')).toBeUndefined()
      expect(result.find(p => p.id === 'player-1')).toBeDefined()
      expect(result.find(p => p.id === 'player-3')).toBeDefined()
    })

    it('should handle removing non-existent player', () => {
      const result = removePlayer('unknown-player', mockPlayers)
      
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockPlayers)
    })

    it('should handle empty players array', () => {
      const result = removePlayer('any-player', [])
      expect(result).toHaveLength(0)
    })
  })

  describe('Player Management Integration', () => {
    it('should handle full player lifecycle', () => {
      // Create players
      const player1 = createPlayer('Alice')
      const player2 = createPlayer('Bob')
      const player3 = createPlayer('Charlie')
      
      let players = [player1, player2, player3]
      
      // Validate player count
      expect(validatePlayerCount(players)).toBe(true)
      
      // Test name resolution
      expect(getPlayerName(player1.id, players)).toBe('Alice')
      expect(getPlayerName(player2.id, players)).toBe('Bob')
      expect(getPlayerName(player3.id, players)).toBe('Charlie')
      
      // Remove a player
      players = removePlayer(player2.id, players)
      expect(players).toHaveLength(2)
      expect(validatePlayerCount(players)).toBe(true)
      
      // Test name resolution after removal
      expect(getPlayerName(player1.id, players)).toBe('Alice')
      expect(getPlayerName(player2.id, players)).toBe(player2.id) // Should return ID since player removed
      expect(getPlayerName(player3.id, players)).toBe('Charlie')
    })
  })
}) 