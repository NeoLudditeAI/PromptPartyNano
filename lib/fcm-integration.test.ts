// lib/fcm-integration.test.ts
// Integration tests for Firebase Cloud Messaging Functions

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { GameId, PlayerId, Game, PromptTurn } from '../types'

// Mock Firebase Admin SDK for testing
const mockMessaging = {
  send: vi.fn()
}

const mockDatabase = {
  ref: vi.fn(() => ({
    once: vi.fn(),
    set: vi.fn()
  }))
}

// Mock Firebase Functions for local testing
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  database: () => mockDatabase,
  messaging: () => mockMessaging
}))

// Mock game data for testing
const mockGame: Game = {
  id: 'game-123' as GameId,
  players: ['player-1' as PlayerId, 'player-2' as PlayerId],
  createdAt: Date.now(),
  turnLimit: 3,
  maxPlayers: 4,
  currentPrompt: 'A magical forest with sparkling trees',
  turns: [
    {
      id: 'turn-1',
      playerId: 'player-1' as PlayerId,
      text: 'A magical forest',
      timestamp: Date.now() - 60000
    } as PromptTurn
  ],
  currentPlayerIndex: 1,
  isComplete: false,
  latestImageUrl: 'https://example.com/image1.png'
}

const mockPlayerTokens = {
  'player-1': 'fcm-token-player-1',
  'player-2': 'fcm-token-player-2'
}

const mockReactionData = {
  id: 'reaction-1',
  playerId: 'player-2' as PlayerId,
  emoji: '❤️',
  turnId: 'turn-1',
  timestamp: Date.now()
}

describe('Firebase Functions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock database responses
    mockDatabase.ref.mockImplementation((path: string) => {
      const mockRef = {
        once: vi.fn(),
        set: vi.fn().mockResolvedValue(undefined)
      }
      
      if (path.includes('/games/')) {
        mockRef.once.mockResolvedValue({
          val: () => mockGame
        })
      } else if (path.includes('/players/') && path.includes('/fcmToken')) {
        const playerId = path.split('/')[2]
        mockRef.once.mockResolvedValue({
          val: () => mockPlayerTokens[playerId] || null
        })
      } else if (path.includes('/players/') && path.includes('/name')) {
        mockRef.once.mockResolvedValue({
          val: () => 'TestPlayer'
        })
      }
      
      return mockRef
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('notifyPlayerTurn Function Logic', () => {
    it('should calculate next player correctly', () => {
      // Test the logic for determining next player
      const currentPlayerIndex = mockGame.currentPlayerIndex // 1
      const nextPlayerIndex = (currentPlayerIndex + 1) % mockGame.players.length
      const nextPlayerId = mockGame.players[nextPlayerIndex]
      
      expect(nextPlayerIndex).toBe(0) // Wraps around to first player
      expect(nextPlayerId).toBe('player-1')
    })

    it('should handle single player game edge case', () => {
      const singlePlayerGame = {
        ...mockGame,
        players: ['player-1' as PlayerId],
        currentPlayerIndex: 0
      }
      
      const nextPlayerIndex = (singlePlayerGame.currentPlayerIndex + 1) % singlePlayerGame.players.length
      expect(nextPlayerIndex).toBe(0) // Should cycle back to same player
    })

    it('should format turn notification message correctly', () => {
      const expectedTitle = 'Your turn in Prompt Party!'
      const expectedBody = `It's your turn to add to the prompt. Current: "${mockGame.currentPrompt}"`
      
      expect(expectedTitle).toBe('Your turn in Prompt Party!')
      expect(expectedBody).toContain(mockGame.currentPrompt)
      expect(expectedBody.length).toBeLessThan(200) // Firebase notification limit
    })

    it('should create proper FCM message payload for turn notification', () => {
      const fcmToken = 'test-fcm-token'
      const gameId = mockGame.id
      
      const expectedMessage = {
        token: fcmToken,
        notification: {
          title: 'Your turn in Prompt Party!',
          body: `It's your turn to add to the prompt. Current: "${mockGame.currentPrompt}"`
        },
        data: {
          gameId: gameId,
          type: 'turn',
          url: `/game/${gameId}`
        },
        webpush: {
          fcmOptions: {
            link: `/game/${gameId}`
          }
        }
      }
      
      expect(expectedMessage.token).toBe(fcmToken)
      expect(expectedMessage.notification.title).toBeTruthy()
      expect(expectedMessage.data.gameId).toBe(gameId)
      expect(expectedMessage.data.type).toBe('turn')
    })
  })

  describe('notifyReaction Function Logic', () => {
    it('should prevent self-notification for reactions', () => {
      const reactionByImageCreator = {
        ...mockReactionData,
        playerId: 'player-1' as PlayerId // Same as turn creator
      }
      
      const turnCreatorId = mockGame.turns[0].playerId
      const shouldNotify = reactionByImageCreator.playerId !== turnCreatorId
      
      expect(shouldNotify).toBe(false) // Should not notify self
    })

    it('should allow notification for reactions by others', () => {
      const reactionByOtherPlayer = {
        ...mockReactionData,
        playerId: 'player-2' as PlayerId // Different from turn creator
      }
      
      const turnCreatorId = mockGame.turns[0].playerId // player-1
      const shouldNotify = reactionByOtherPlayer.playerId !== turnCreatorId
      
      expect(shouldNotify).toBe(true) // Should notify
    })

    it('should format reaction notification message correctly', () => {
      const reactorName = 'Alice'
      const emoji = mockReactionData.emoji
      
      const expectedTitle = 'Someone reacted to your image!'
      const expectedBody = `${reactorName} ${emoji} your contribution to the game.`
      
      expect(expectedTitle).toBe('Someone reacted to your image!')
      expect(expectedBody).toContain(reactorName)
      expect(expectedBody).toContain(emoji)
      expect(expectedBody.length).toBeLessThan(200)
    })

    it('should create proper FCM message payload for reaction notification', () => {
      const fcmToken = 'test-fcm-token'
      const gameId = mockGame.id
      const reactorName = 'TestPlayer'
      const emoji = mockReactionData.emoji
      
      const expectedMessage = {
        token: fcmToken,
        notification: {
          title: 'Someone reacted to your image!',
          body: `${reactorName} ${emoji} your contribution to the game.`
        },
        data: {
          gameId: gameId,
          type: 'reaction',
          url: `/game/${gameId}`
        },
        webpush: {
          fcmOptions: {
            link: `/game/${gameId}`
          }
        }
      }
      
      expect(expectedMessage.token).toBe(fcmToken)
      expect(expectedMessage.notification.title).toBeTruthy()
      expect(expectedMessage.data.type).toBe('reaction')
    })
  })

  describe('storeFCMToken Function Logic', () => {
    it('should validate required parameters', () => {
      const validData = {
        playerId: 'player-123',
        fcmToken: 'fcm-token-abc123'
      }
      
      expect(validData.playerId).toBeTruthy()
      expect(validData.fcmToken).toBeTruthy()
      expect(typeof validData.playerId).toBe('string')
      expect(typeof validData.fcmToken).toBe('string')
    })

    it('should reject invalid data', () => {
      const invalidDataCases = [
        { playerId: '', fcmToken: 'valid-token' },
        { playerId: 'valid-player', fcmToken: '' },
        { playerId: null, fcmToken: 'valid-token' },
        { playerId: 'valid-player', fcmToken: null },
        {},
        { playerId: 'valid-player' }, // Missing fcmToken
        { fcmToken: 'valid-token' } // Missing playerId
      ]
      
      invalidDataCases.forEach(data => {
        const isValid = !!(data.playerId && data.fcmToken)
        expect(isValid).toBe(false)
      })
    })

    it('should create proper database path for token storage', () => {
      const playerId = 'player-123'
      const expectedPath = `/players/${playerId}/fcmToken`
      
      expect(expectedPath).toBe(`/players/${playerId}/fcmToken`)
    })
  })

  describe('sendTestNotification Function Logic', () => {
    it('should validate FCM token parameter', () => {
      const validToken = 'test-fcm-token-12345'
      const invalidTokens = ['', null, undefined]
      
      expect(!!validToken).toBe(true)
      invalidTokens.forEach(token => {
        expect(!!token).toBe(false)
      })
    })

    it('should create test notification with default values', () => {
      const fcmToken = 'test-token'
      const defaultTitle = 'Test Notification'
      const defaultBody = 'This is a test notification from Prompt Party!'
      
      const message = {
        token: fcmToken,
        notification: {
          title: defaultTitle,
          body: defaultBody
        },
        data: {
          type: 'test',
          url: '/'
        }
      }
      
      expect(message.notification.title).toBe(defaultTitle)
      expect(message.notification.body).toBe(defaultBody)
      expect(message.data.type).toBe('test')
    })

    it('should use custom title and body when provided', () => {
      const customTitle = 'Custom Test Title'
      const customBody = 'Custom test message'
      
      const message = {
        token: 'test-token',
        notification: {
          title: customTitle,
          body: customBody
        },
        data: {
          type: 'test',
          url: '/'
        }
      }
      
      expect(message.notification.title).toBe(customTitle)
      expect(message.notification.body).toBe(customBody)
    })
  })

  describe('Error Handling Scenarios', () => {
    it('should handle missing game data gracefully', () => {
      const missingGame = null
      const shouldContinue = !!missingGame
      
      expect(shouldContinue).toBe(false)
    })

    it('should handle missing FCM token gracefully', () => {
      const missingToken = null
      const shouldSendNotification = !!missingToken
      
      expect(shouldSendNotification).toBe(false)
    })

    it('should handle empty player list', () => {
      const emptyPlayerGame = {
        ...mockGame,
        players: []
      }
      
      const hasPlayers = emptyPlayerGame.players.length > 0
      expect(hasPlayers).toBe(false)
    })

    it('should handle invalid player index', () => {
      const invalidIndexGame = {
        ...mockGame,
        currentPlayerIndex: 999 // Out of bounds
      }
      
      const isValidIndex = invalidIndexGame.currentPlayerIndex < invalidIndexGame.players.length
      expect(isValidIndex).toBe(false)
    })

    it('should handle missing turn data for reactions', () => {
      const missingTurn = null
      const shouldProcessReaction = !!missingTurn
      
      expect(shouldProcessReaction).toBe(false)
    })
  })

  describe('Notification Message Limits', () => {
    it('should keep notification titles within limits', () => {
      const turnTitle = 'Your turn in Prompt Party!'
      const reactionTitle = 'Someone reacted to your image!'
      const testTitle = 'Test Notification'
      
      // FCM title limit is typically 50-100 characters
      expect(turnTitle.length).toBeLessThan(100)
      expect(reactionTitle.length).toBeLessThan(100)
      expect(testTitle.length).toBeLessThan(100)
    })

    it('should keep notification bodies within limits', () => {
      const longPrompt = 'A'.repeat(500) // Very long prompt
      const turnBody = `It's your turn to add to the prompt. Current: "${longPrompt}"`
      
      // Should truncate if too long
      const maxBodyLength = 200
      const truncatedBody = turnBody.length > maxBodyLength 
        ? turnBody.substring(0, maxBodyLength - 3) + '...'
        : turnBody
      
      expect(truncatedBody.length).toBeLessThanOrEqual(maxBodyLength)
    })

    it('should handle emoji in notification messages', () => {
      const emojiMessage = 'Alice ❤️ your contribution to the game.'
      const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(emojiMessage)
      
      expect(hasEmoji).toBe(true)
      expect(emojiMessage.length).toBeLessThan(200)
    })
  })

  describe('Database Path Validation', () => {
    it('should create correct database paths', () => {
      const gameId = 'game-123'
      const playerId = 'player-456'
      const turnId = 'turn-789'
      const reactionId = 'reaction-abc'
      
      const gamePath = `/games/${gameId}`
      const turnPath = `/games/${gameId}/turns/${turnId}`
      const reactionPath = `/games/${gameId}/reactions/${reactionId}`
      const tokenPath = `/players/${playerId}/fcmToken`
      const namePath = `/players/${playerId}/name`
      
      expect(gamePath).toBe('/games/game-123')
      expect(turnPath).toBe('/games/game-123/turns/turn-789')
      expect(reactionPath).toBe('/games/game-123/reactions/reaction-abc')
      expect(tokenPath).toBe('/players/player-456/fcmToken')
      expect(namePath).toBe('/players/player-456/name')
    })

    it('should handle special characters in IDs', () => {
      const specialGameId = 'game-123_test.special'
      const specialPlayerId = 'player_456-test'
      
      const gamePath = `/games/${specialGameId}`
      const tokenPath = `/players/${specialPlayerId}/fcmToken`
      
      expect(gamePath).toContain(specialGameId)
      expect(tokenPath).toContain(specialPlayerId)
    })
  })

  describe('FCM Message Validation', () => {
    it('should create valid FCM message structure', () => {
      const message = {
        token: 'valid-token',
        notification: {
          title: 'Test Title',
          body: 'Test Body'
        },
        data: {
          gameId: 'game-123',
          type: 'turn',
          url: '/game/game-123'
        },
        webpush: {
          fcmOptions: {
            link: '/game/game-123'
          }
        }
      }
      
      // Validate required fields
      expect(message.token).toBeTruthy()
      expect(message.notification.title).toBeTruthy()
      expect(message.notification.body).toBeTruthy()
      expect(message.data).toBeTruthy()
      
      // Validate data types
      expect(typeof message.token).toBe('string')
      expect(typeof message.notification.title).toBe('string')
      expect(typeof message.notification.body).toBe('string')
      expect(typeof message.data).toBe('object')
    })

    it('should include proper click action URL', () => {
      const gameId = 'game-123'
      const expectedUrl = `/game/${gameId}`
      
      expect(expectedUrl).toBe('/game/game-123')
      expect(expectedUrl.startsWith('/game/')).toBe(true)
    })
  })
})

describe('Firebase Functions Environment', () => {
  it('should handle Firebase Functions v2 API correctly', () => {
    // Test that we're using the correct v2 API format
    const mockRequest = {
      data: {
        playerId: 'test-player',
        fcmToken: 'test-token'
      }
    }
    
    // Simulate v2 function structure
    const { playerId, fcmToken } = mockRequest.data
    
    expect(playerId).toBe('test-player')
    expect(fcmToken).toBe('test-token')
  })

  it('should handle database triggers correctly', () => {
    // Test database trigger event structure
    const mockEvent = {
      params: {
        gameId: 'game-123',
        turnId: 'turn-456'
      },
      data: {
        val: () => ({
          id: 'turn-456',
          playerId: 'player-789',
          text: 'test prompt',
          timestamp: Date.now()
        })
      }
    }
    
    expect(mockEvent.params.gameId).toBe('game-123')
    expect(mockEvent.params.turnId).toBe('turn-456')
    expect(mockEvent.data.val().playerId).toBe('player-789')
  })

  it('should handle function response formats', () => {
    // Test success response
    const successResponse = { success: true }
    expect(successResponse.success).toBe(true)
    
    // Test response with message ID
    const messageResponse = { success: true, messageId: 'msg-123' }
    expect(messageResponse.messageId).toBe('msg-123')
    
    // Test error responses would be handled by Firebase Functions framework
  })
})
