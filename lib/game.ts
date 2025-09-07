// lib/game.ts

import { Game, PlayerId, PromptTurn, GAME_CONFIG, CharacterCountStatus, ImageGenerationResult, GameConfig } from '../types'
import { getGameConfig } from './game-config'

export function createGame(creator: PlayerId, config?: GameConfig): Game {
  const gameConfig = config || getGameConfig('STANDARD')
  
  return {
    id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    creator,
    players: [creator], // Only creator initially
    turns: [],
    createdAt: Date.now(),
    status: 'waiting', // Start in waiting state
    currentPlayerIndex: 0,
    imageHistory: [], // Initialize empty image history
    minPlayers: gameConfig.MIN_PLAYERS,
    maxPlayers: gameConfig.MAX_PLAYERS,
    config: gameConfig
  }
}

export function addPlayerToGame(game: Game, playerId: PlayerId): Game {
  if (game.status !== 'waiting') {
    throw new Error('Cannot add player to game that has already started')
  }
  
  if (game.players.includes(playerId)) {
    throw new Error('Player already in game')
  }
  
  if (game.players.length >= game.maxPlayers) {
    throw new Error(`Game is full (maximum ${game.maxPlayers} players)`)
  }
  
  return {
    ...game,
    players: [...game.players, playerId]
  }
}

export function startGame(game: Game): Game {
  if (game.status !== 'waiting') {
    throw new Error('Game has already started')
  }
  
  if (game.players.length < game.minPlayers) {
    throw new Error(`Need at least ${game.minPlayers} players to start`)
  }
  
  // For edit mode, Player 1 already created the seed, so Player 2 starts
  // For regular mode, Player 1 starts as usual
  const startingPlayerIndex = game.gameMode === 'edit' ? 1 : 0
  
  return {
    ...game,
    status: 'in_progress',
    currentPlayerIndex: startingPlayerIndex
  }
}

export function addTurn(game: Game, playerId: PlayerId, text: string): Game {
  if (game.status !== 'in_progress') {
    throw new Error('Game is not in progress')
  }
  
  if (!game.players.includes(playerId)) {
    throw new Error('Player not in game')
  }
  
  const currentPlayer = game.players[game.currentPlayerIndex]
  if (playerId !== currentPlayer) {
    throw new Error(`Not ${playerId}'s turn`)
  }
  
  // Enforce character limit
  const trimmedText = text.trim()
  if (trimmedText.length > game.config.MAX_TURN_LENGTH) {
    throw new Error(`Turn text exceeds ${game.config.MAX_TURN_LENGTH} character limit`)
  }
  
  if (trimmedText.length === 0) {
    throw new Error('Turn text cannot be empty')
  }
  
  // Check total prompt length
  const currentPromptLength = buildFullPrompt(game.turns).length
  const newPromptLength = currentPromptLength + trimmedText.length + 1 // +1 for space
  if (newPromptLength > game.config.MAX_TOTAL_LENGTH) {
    throw new Error(`Total prompt would exceed ${game.config.MAX_TOTAL_LENGTH} character limit`)
  }
  
  const newTurn: PromptTurn = {
    userId: playerId,
    text: trimmedText,
    timestamp: Date.now(),
    characterCount: trimmedText.length
  }
  
  const nextPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length
  const totalTurns = game.turns.length + 1 // +1 for the new turn we're adding
  const maxTurns = game.config.TURNS_PER_GAME
  const isGameCompleted = totalTurns >= maxTurns
  
  return {
    ...game,
    turns: [...game.turns, newTurn],
    currentPlayerIndex: nextPlayerIndex,
    status: isGameCompleted ? 'completed' : 'in_progress' // Game completes after configured turns
  }
}

export function getCurrentPlayer(game: Game): PlayerId | null {
  if (game.status !== 'in_progress') {
    return null
  }
  return game.players[game.currentPlayerIndex]
}

export function buildFullPrompt(turns: PromptTurn[]): string {
  return turns.map(turn => turn.text).join(' ')
}

export function isGameComplete(game: Game): boolean {
  return game.status === 'completed'
}

export function canStartGame(game: Game): boolean {
  return game.status === 'waiting' && game.players.length >= game.minPlayers
}

export function getPlayerCount(game: Game): { current: number, min: number, max: number } {
  return {
    current: game.players.length,
    min: game.minPlayers,
    max: game.maxPlayers
  }
}

// Character limit utility functions
export function getCharacterCountStatus(count: number): CharacterCountStatus {
  if (count > GAME_CONFIG.MAX_TURN_LENGTH) {
    return 'exceeded'
  } else if (count >= GAME_CONFIG.MAX_TURN_LENGTH) {
    return 'danger'
  } else if (count >= GAME_CONFIG.WARNING_THRESHOLD) {
    return 'warning'
  } else {
    return 'safe'
  }
}

export function validateTurnText(text: string): { isValid: boolean; error?: string } {
  const trimmedText = text.trim()
  
  if (trimmedText.length === 0) {
    return { isValid: false, error: 'Turn text cannot be empty' }
  }
  
  if (trimmedText.length > GAME_CONFIG.MAX_TURN_LENGTH) {
    return { 
      isValid: false, 
      error: `Turn text exceeds ${GAME_CONFIG.MAX_TURN_LENGTH} character limit` 
    }
  }
  
  return { isValid: true }
}

export function getTotalPromptLength(game: Game): number {
  return buildFullPrompt(game.turns).length
}

export function canAddTurnToGame(game: Game, text: string): { canAdd: boolean; error?: string } {
  const turnValidation = validateTurnText(text)
  if (!turnValidation.isValid) {
    return { canAdd: false, error: turnValidation.error }
  }
  
  const trimmedText = text.trim()
  const currentLength = getTotalPromptLength(game)
  const newLength = currentLength + trimmedText.length + 1 // +1 for space
  
  if (newLength > GAME_CONFIG.MAX_TOTAL_LENGTH) {
    return { 
      canAdd: false, 
      error: `Total prompt would exceed ${GAME_CONFIG.MAX_TOTAL_LENGTH} character limit` 
    }
  }
  
  return { canAdd: true }
}

// Image history utility functions
export function addImageToGame(game: Game, imageResult: ImageGenerationResult): Game {
  return {
    ...game,
    imageHistory: [...game.imageHistory, imageResult]
  }
}

export function getLatestImageUrl(game: Game): string | null {
  if (game.imageHistory.length === 0) {
    return null
  }
  return game.imageHistory[game.imageHistory.length - 1].imageUrl
}

export function getImageCount(game: Game): number {
  return game.imageHistory.length
}

