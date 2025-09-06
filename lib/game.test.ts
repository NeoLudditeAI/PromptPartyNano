// lib/game.test.ts
import { describe, it, expect } from 'vitest'
import { createGame, addPlayerToGame, startGame, addTurn, getCurrentPlayer, buildFullPrompt, isGameComplete, canStartGame, getPlayerCount, getCharacterCountStatus, validateTurnText, getTotalPromptLength, canAddTurnToGame } from './game'
import { PromptTurn } from '../types'

describe('Game Logic', () => {
  describe('createGame', () => {
    it('should create a new game with creator', () => {
      // Arrange
      const creator = 'alice'

      // Act
      const game = createGame(creator)

      // Assert
      expect(game.creator).toBe(creator)
      expect(game.players).toEqual([creator])
      expect(game.turns).toEqual([])
      expect(game.currentPlayerIndex).toBe(0)
      expect(game.status).toBe('waiting')
      expect(game.minPlayers).toBe(2)
      expect(game.maxPlayers).toBe(6)
    })
  })

  describe('addPlayerToGame', () => {
    it('should add a player to a waiting game', () => {
      // Arrange
      const game = createGame('alice')

      // Act
      const updatedGame = addPlayerToGame(game, 'bob')

      // Assert
      expect(updatedGame.players).toEqual(['alice', 'bob'])
      expect(updatedGame.status).toBe('waiting')
    })

    it('should throw error for non-waiting game', () => {
      // Arrange
      const game = createGame('alice')
      const startedGame = startGame(addPlayerToGame(game, 'bob'))

      // Act & Assert
      expect(() => addPlayerToGame(startedGame, 'charlie')).toThrow('Cannot add player to game that has already started')
    })

    it('should throw error for duplicate player', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(() => addPlayerToGame(game, 'alice')).toThrow('Player already in game')
    })

    it('should throw error for full game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')
      game = addPlayerToGame(game, 'eve')
      game = addPlayerToGame(game, 'frank')

      // Act & Assert
      expect(() => addPlayerToGame(game, 'grace')).toThrow('Game is full (maximum 6 players)')
    })
  })

  describe('startGame', () => {
    it('should start a game with enough players', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(startedGame.status).toBe('in_progress')
      expect(startedGame.currentPlayerIndex).toBe(0)
    })

    it('should throw error for already started game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      const startedGame = startGame(game)

      // Act & Assert
      expect(() => startGame(startedGame)).toThrow('Game has already started')
    })

    it('should throw error for insufficient players', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(() => startGame(game)).toThrow('Need at least 2 players to start')
    })
  })

  describe('getCurrentPlayer', () => {
    it('should return null for waiting game', () => {
      // Arrange
      const game = createGame('alice')

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBeNull()
    })

    it('should return the first player when game starts', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBe('alice')
    })

    it('should return the correct player after turns', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'a beautiful sunset')

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBe('bob')
    })

    it('should complete game when cycling back to first player', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'a beautiful sunset')
      game = addTurn(game, 'bob', 'over the ocean')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBeNull() // Game is completed, no current player
      expect(isGameComplete(game)).toBe(true)
    })
  })

  describe('addTurn', () => {
    it('should add a turn and advance to next player', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      const updatedGame = addTurn(game, 'alice', 'a beautiful sunset')

      // Assert
      expect(updatedGame.turns).toHaveLength(1)
      expect(updatedGame.turns[0].userId).toBe('alice')
      expect(updatedGame.turns[0].text).toBe('a beautiful sunset')
      expect(updatedGame.currentPlayerIndex).toBe(1)
    })

    it('should throw error for non-in-progress game', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(() => addTurn(game, 'alice', 'a beautiful sunset')).toThrow('Game is not in progress')
    })

    it('should throw error if wrong player tries to take turn', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'bob', 'a beautiful sunset')).toThrow("Not bob's turn")
    })

    it('should trim whitespace from turn text', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      const updatedGame = addTurn(game, 'alice', '  a beautiful sunset  ')

      // Assert
      expect(updatedGame.turns[0].text).toBe('a beautiful sunset')
    })

    it('should complete game when cycling back to first player', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Act
      const isComplete = isGameComplete(game)

      // Assert
      expect(isComplete).toBe(true)
      expect(game.status).toBe('completed')
    })
  })

  describe('buildFullPrompt', () => {
    it('should return empty string for no turns', () => {
      const turns: PromptTurn[] = []
      expect(buildFullPrompt(turns)).toBe('')
    })

    it('should concatenate single turn', () => {
      const turns: PromptTurn[] = [
        { userId: 'alice', text: 'hello', timestamp: Date.now(), characterCount: 5 }
      ]
      expect(buildFullPrompt(turns)).toBe('hello')
    })

    it('should concatenate multiple turns with spaces', () => {
      const turns: PromptTurn[] = [
        { userId: 'alice', text: 'hello', timestamp: Date.now(), characterCount: 5 },
        { userId: 'bob', text: 'world', timestamp: Date.now(), characterCount: 5 }
      ]
      expect(buildFullPrompt(turns)).toBe('hello world')
    })

    it('should handle turns with extra whitespace', () => {
      const turns: PromptTurn[] = [
        { userId: 'alice', text: '  hello  ', timestamp: Date.now(), characterCount: 9 },
        { userId: 'bob', text: '  world  ', timestamp: Date.now(), characterCount: 9 }
      ]
      expect(buildFullPrompt(turns)).toBe('  hello     world  ')
    })

    it('should filter out empty turns', () => {
      const turns: PromptTurn[] = [
        { userId: 'alice', text: 'hello', timestamp: Date.now(), characterCount: 5 },
        { userId: 'bob', text: '', timestamp: Date.now(), characterCount: 0 },
        { userId: 'charlie', text: 'world', timestamp: Date.now(), characterCount: 5 }
      ]
      expect(buildFullPrompt(turns)).toBe('hello  world')
    })

    it('should remove double spaces', () => {
      const turns: PromptTurn[] = [
        { userId: 'alice', text: 'hello', timestamp: Date.now(), characterCount: 5 },
        { userId: 'bob', text: 'world', timestamp: Date.now(), characterCount: 5 }
      ]
      expect(buildFullPrompt(turns)).toBe('hello world')
    })
  })

  describe('isGameComplete', () => {
    it('should return false for new game', () => {
      // Arrange
      const game = createGame('alice')

      // Act
      const isComplete = isGameComplete(game)

      // Assert
      expect(isComplete).toBe(false)
    })

    it('should return true when game is completed', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Act
      const isComplete = isGameComplete(game)

      // Assert
      expect(isComplete).toBe(true)
    })

    it('should return false when not enough turns', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'first turn')

      // Act
      const isComplete = isGameComplete(game)

      // Assert
      expect(isComplete).toBe(false)
    })

    it('should handle single player game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Act
      const isComplete = isGameComplete(game)

      // Assert
      expect(isComplete).toBe(true)
    })
  })

  describe('canStartGame', () => {
    it('should return true for game with enough players', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(true)
    })

    it('should return false for game with insufficient players', () => {
      // Arrange
      const game = createGame('alice')

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(false)
    })

    it('should return false for already started game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(false)
    })
  })

  describe('getPlayerCount', () => {
    it('should return correct player count info', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const playerCount = getPlayerCount(game)

      // Assert
      expect(playerCount.current).toBe(2)
      expect(playerCount.min).toBe(2)
      expect(playerCount.max).toBe(6)
    })
  })
})

describe('Character Limit Functionality', () => {
  it('should enforce character limit on turn text', () => {
    const game = createGame('alice')
    const updatedGame = addPlayerToGame(game, 'bob')
    const startedGame = startGame(updatedGame)
    
    // Try to add a turn that exceeds the limit
    const longText = 'a'.repeat(26) // 26 characters, over the 25 limit
    
    expect(() => addTurn(startedGame, 'alice', longText)).toThrow('Turn text exceeds 25 character limit')
  })
  
  it('should track character count in turns', () => {
    const game = createGame('alice')
    const updatedGame = addPlayerToGame(game, 'bob')
    const startedGame = startGame(updatedGame)
    
    const updatedGameWithTurn = addTurn(startedGame, 'alice', 'hello world')
    
    expect(updatedGameWithTurn.turns[0].characterCount).toBe(11)
    expect(updatedGameWithTurn.turns[0].text).toBe('hello world')
  })
  
  it('should reject empty turn text', () => {
    const game = createGame('alice')
    const updatedGame = addPlayerToGame(game, 'bob')
    const startedGame = startGame(updatedGame)
    
    expect(() => addTurn(startedGame, 'alice', '   ')).toThrow('Turn text cannot be empty')
  })
  
  it('should allow turns at the character limit', () => {
    const game = createGame('alice')
    const updatedGame = addPlayerToGame(game, 'bob')
    const startedGame = startGame(updatedGame)
    
    const maxText = 'a'.repeat(25) // Exactly 25 characters
    const updatedGameWithTurn = addTurn(startedGame, 'alice', maxText)
    
    expect(updatedGameWithTurn.turns[0].characterCount).toBe(25)
    expect(updatedGameWithTurn.turns[0].text).toBe(maxText)
  })
})

describe('Character Count Status', () => {
  it('should return correct status for different character counts', () => {
    expect(getCharacterCountStatus(0)).toBe('safe')
    expect(getCharacterCountStatus(15)).toBe('safe')
    expect(getCharacterCountStatus(20)).toBe('warning')
    expect(getCharacterCountStatus(25)).toBe('danger')
    expect(getCharacterCountStatus(26)).toBe('exceeded')
  })
})

describe('Turn Text Validation', () => {
  it('should validate turn text correctly', () => {
    expect(validateTurnText('hello')).toEqual({ isValid: true })
    expect(validateTurnText('   ')).toEqual({ 
      isValid: false, 
      error: 'Turn text cannot be empty' 
    })
    expect(validateTurnText('a'.repeat(26))).toEqual({ 
      isValid: false, 
      error: 'Turn text exceeds 25 character limit' 
    })
  })
})

describe('Total Prompt Length', () => {
  it('should calculate total prompt length correctly', () => {
    const game = createGame('alice')
    const updatedGame = addPlayerToGame(game, 'bob')
    const startedGame = startGame(updatedGame)
    
    let currentGame = startedGame
    currentGame = addTurn(currentGame, 'alice', 'hello')
    currentGame = addTurn(currentGame, 'bob', 'world')
    
    expect(getTotalPromptLength(currentGame)).toBe(11) // "hello world" (5 + 1 + 5 = 11)
  })
})

describe('Can Add Turn Validation', () => {
  it('should validate if turn can be added to game', () => {
    const game = createGame('alice')
    const updatedGame = addPlayerToGame(game, 'bob')
    const startedGame = startGame(updatedGame)
    
    expect(canAddTurnToGame(startedGame, 'hello')).toEqual({ canAdd: true })
    expect(canAddTurnToGame(startedGame, '')).toEqual({ 
      canAdd: false, 
      error: 'Turn text cannot be empty' 
    })
    expect(canAddTurnToGame(startedGame, 'a'.repeat(26))).toEqual({ 
      canAdd: false, 
      error: 'Turn text exceeds 25 character limit' 
    })
  })
})
