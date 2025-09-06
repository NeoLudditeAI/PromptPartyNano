// lib/firebase.ts

import { Game, GameId, PlayerId } from '../types'
import { User } from '../types'
import { database } from './firebase-config'
import { ref, set, get, update, onValue, off } from 'firebase/database'

// Helper function to clean game object for Firebase (remove undefined values)
function cleanGameForFirebase(game: Game): any {
  const cleaned = { ...game }
  // No need to clean imageHistory as it's always an array
  return cleaned
}

// Helper function to clean game object when reading from Firebase (add missing properties)
function cleanGameFromFirebase(gameData: any): Game {
  return {
    id: gameData.id,
    creator: gameData.creator,
    players: gameData.players || [],
    turns: gameData.turns || [],
    createdAt: gameData.createdAt || Date.now(),
    status: gameData.status || 'waiting',
    currentPlayerIndex: gameData.currentPlayerIndex || 0,
    imageHistory: gameData.imageHistory || [], // Initialize as empty array if missing
    minPlayers: gameData.minPlayers || 2,
    maxPlayers: gameData.maxPlayers || 6,
    config: gameData.config || { TURNS_PER_GAME: 6, MIN_PLAYERS: 2, MAX_PLAYERS: 6, MAX_TURN_LENGTH: 25, MAX_TOTAL_LENGTH: 1000, WARNING_THRESHOLD: 20, AUTO_START_ON_FULL: false, ALLOW_MID_GAME_JOINS: false, GENERATE_IMAGE_EVERY_TURN: true, IMAGE_HISTORY_ENABLED: true, SESSION_TIMEOUT_MS: 30 * 60 * 1000, MAX_SESSIONS_PER_PLAYER: 1, DEBOUNCE_DELAY_MS: 500, MAX_CONCURRENT_UPDATES: 3 },
    isGenerating: gameData.isGenerating || false // Handle generation state
  }
}

// Game management functions
export async function createGameInFirebase(game: Game): Promise<void> {
  const gameRef = ref(database, `games/${game.id}`)
  const cleanedGame = cleanGameForFirebase(game)
  await set(gameRef, cleanedGame)
}

export async function getGameFromFirebase(gameId: GameId): Promise<Game | null> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)
  
  if (snapshot.exists()) {
    const gameData = snapshot.val()
    return cleanGameFromFirebase(gameData)
  }
  
  return null
}

export async function updateGameInFirebase(game: Game): Promise<void> {
  const gameRef = ref(database, `games/${game.id}`)
  const cleanedGame = cleanGameForFirebase(game)
  await update(gameRef, cleanedGame)
}

export function subscribeToGame(gameId: GameId, callback: (game: Game | null) => void): () => void {
  const gameRef = ref(database, `games/${gameId}`)
  
  const unsubscribe = onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      const gameData = snapshot.val()
      callback(cleanGameFromFirebase(gameData))
    } else {
      callback(null)
    }
  })
  
  return () => {
    off(gameRef, 'value', unsubscribe)
  }
}

// Player management functions
export async function addPlayerToGame(gameId: GameId, playerId: PlayerId, playerName: string): Promise<Game> {
  const game = await getGameFromFirebase(gameId)
  if (!game) {
    throw new Error(`Game ${gameId} not found`)
  }

  if (game.status === 'completed') {
    throw new Error('Cannot add player to completed game')
  }

  if (game.players.length >= 6) {
    throw new Error('Game is full (maximum 6 players)')
  }

  if (game.players.includes(playerId)) {
    throw new Error('Player already in game')
  }

  // Add the new player to the game
  const updatedGame: Game = {
    ...game,
    players: [...game.players, playerId]
  }

  // Save back to Firebase
  await updateGameInFirebase(updatedGame)
  
  // Also store player information with display name
  const { database } = await import('./firebase-config')
  const { ref, set } = await import('firebase/database')
  const playerRef = ref(database, `games/${gameId}/playerInfo/${playerId}`)
  await set(playerRef, {
    id: playerId,
    displayName: playerName,
    joinedAt: Date.now()
  })
  
  return updatedGame
}

// Get player information from Firebase
export async function getPlayerInfo(gameId: GameId, playerId: PlayerId): Promise<{ id: PlayerId, displayName: string } | null> {
  try {
    const { database } = await import('./firebase-config')
    const { ref, get } = await import('firebase/database')
    const playerRef = ref(database, `games/${gameId}/playerInfo/${playerId}`)
    const snapshot = await get(playerRef)
    
    if (snapshot.exists()) {
      return snapshot.val()
    }
    return null
  } catch (error) {
    console.error('Error getting player info:', error)
    return null
  }
}

// Get all player information for a game
export async function getAllPlayerInfo(gameId: GameId): Promise<{ id: PlayerId, displayName: string }[]> {
  const game = await getGameFromFirebase(gameId)
  if (!game) return []
  
  const playerInfoPromises = game.players.map(playerId => getPlayerInfo(gameId, playerId))
  const playerInfoResults = await Promise.all(playerInfoPromises)
  
  // Filter out null results and return valid player info
  return playerInfoResults.filter(info => info !== null) as { id: PlayerId, displayName: string }[]
}

// Turn management functions
export async function addTurnToGame(gameId: GameId, userId: PlayerId, text: string): Promise<Game> {
  const game = await getGameFromFirebase(gameId)
  if (!game) {
    throw new Error(`Game ${gameId} not found`)
  }

  // Import game logic functions
  const { addTurn } = await import('./game')
  
  // Add the turn using game logic
  const updatedGame = addTurn(game, userId, text)
  
  // Save back to Firebase
  await updateGameInFirebase(updatedGame)
  
  return updatedGame
}

// Game creation helper (legacy - use createSoloGame for new architecture)
export async function createAndSaveGame(players: User[]): Promise<Game> {
  const { createGame } = await import('./game')
  
  // Use first player as creator for legacy compatibility
  const creator = players[0]
  const game = createGame(creator.id)
  await createGameInFirebase(game)
  
  // Store player information with display names
  const { database } = await import('./firebase-config')
  const { ref, set } = await import('firebase/database')
  
  for (const player of players) {
    const playerRef = ref(database, `games/${game.id}/playerInfo/${player.id}`)
    await set(playerRef, {
      id: player.id,
      displayName: player.displayName,
      joinedAt: Date.now()
    })
  }
  
  return game
}

// Utility functions for game state
export async function getCurrentPlayerFromGame(gameId: GameId): Promise<PlayerId | null> {
  const game = await getGameFromFirebase(gameId)
  if (!game) return null
  
  const { getCurrentPlayer } = await import('./game')
  return getCurrentPlayer(game)
}

export async function buildPromptFromGame(gameId: GameId): Promise<string> {
  const game = await getGameFromFirebase(gameId)
  if (!game) return ''
  
  const { buildFullPrompt } = await import('./game')
  return buildFullPrompt(game.turns)
}

export async function isGameCompleteInFirebase(gameId: GameId): Promise<boolean> {
  const game = await getGameFromFirebase(gameId)
  if (!game) return false
  
  const { isGameComplete } = await import('./game')
  return isGameComplete(game)
}

// Player session management functions
export async function createPlayerSession(gameId: GameId, playerId: PlayerId, sessionId: string): Promise<void> {
  const { database } = await import('./firebase-config')
  const { ref, set } = await import('firebase/database')
  const sessionRef = ref(database, `games/${gameId}/sessions/${playerId}/${sessionId}`)
  
  await set(sessionRef, {
    gameId,
    playerId,
    sessionId,
    joinedAt: Date.now(),
    lastActive: Date.now()
  })
}

export async function validatePlayerSession(gameId: GameId, playerId: PlayerId, sessionId: string): Promise<boolean> {
  try {
    const { database } = await import('./firebase-config')
    const { ref, get } = await import('firebase/database')
    const sessionRef = ref(database, `games/${gameId}/sessions/${playerId}/${sessionId}`)
    const snapshot = await get(sessionRef)
    
    return snapshot.exists()
  } catch (error) {
    console.error('Error validating player session:', error)
    return false
  }
}

export async function getPlayerSession(gameId: GameId, playerId: PlayerId, sessionId: string): Promise<{ gameId: GameId, playerId: PlayerId, sessionId: string, joinedAt: number, lastActive: number } | null> {
  try {
    const { database } = await import('./firebase-config')
    const { ref, get } = await import('firebase/database')
    const sessionRef = ref(database, `games/${gameId}/sessions/${playerId}/${sessionId}`)
    const snapshot = await get(sessionRef)
    
    if (snapshot.exists()) {
      return snapshot.val()
    }
    return null
  } catch (error) {
    console.error('Error getting player session:', error)
    return null
  }
}

export async function updateSessionActivity(gameId: GameId, playerId: PlayerId, sessionId: string): Promise<void> {
  try {
    const { database } = await import('./firebase-config')
    const { ref, update } = await import('firebase/database')
    const sessionRef = ref(database, `games/${gameId}/sessions/${playerId}/${sessionId}`)
    
    await update(sessionRef, {
      lastActive: Date.now()
    })
  } catch (error) {
    console.error('Error updating session activity:', error)
  }
}



// Enhanced addTurnToGame with session validation
export async function addTurnToGameWithSession(gameId: GameId, playerId: PlayerId, text: string, sessionId: string): Promise<Game> {
  // Validate that this session is authorized to act as this player
  const isValidSession = await validatePlayerSession(gameId, playerId, sessionId)
  if (!isValidSession) {
    throw new Error(`Unauthorized: Invalid session for player ${playerId}`)
  }
  
  // Update session activity
  await updateSessionActivity(gameId, playerId, sessionId)
  
  // Proceed with turn validation and addition
  const game = await getGameFromFirebase(gameId)
  if (!game) {
    throw new Error(`Game ${gameId} not found`)
  }

  // Import game logic functions
  const { addTurn } = await import('./game')
  
  // Add the turn using game logic
  const updatedGame = addTurn(game, playerId, text)
  
  // Save back to Firebase
  await updateGameInFirebase(updatedGame)
  
  return updatedGame
}

// Enhanced createAndSaveGame for single player creation
export async function createSoloGame(creator: User): Promise<Game> {
  const { createGame } = await import('./game')
  const game = createGame(creator.id)
  await createGameInFirebase(game)
  
  // Store creator information
  const { database } = await import('./firebase-config')
  const { ref, set } = await import('firebase/database')
  const playerRef = ref(database, `games/${game.id}/playerInfo/${creator.id}`)
  await set(playerRef, {
    id: creator.id,
    displayName: creator.displayName,
    joinedAt: Date.now()
  })
  
  return game
}

// Compute a unique display name given a set of existing names.
// Produces: "Alice" -> "Alice (2)" -> "Alice (3)" if needed
export function computeUniqueDisplayName(existingNames: string[], baseName: string): string {
  const normalized = baseName.trim()
  if (!existingNames.includes(normalized)) return normalized
  let counter = 2
  let candidate = `${normalized} (${counter})`
  const existingSet = new Set(existingNames)
  while (existingSet.has(candidate)) {
    counter += 1
    candidate = `${normalized} (${counter})`
  }
  return candidate
}

// Enhanced addPlayerToGame for lobby model
export async function addPlayerToGameWithSession(gameId: GameId, playerId: PlayerId, playerName: string, sessionId: string): Promise<Game> {
  const game = await getGameFromFirebase(gameId)
  if (!game) {
    throw new Error(`Game ${gameId} not found`)
  }
  
  if (game.status !== 'waiting') {
    throw new Error('Cannot join game that has already started')
  }
  
  if (game.players.includes(playerId)) {
    throw new Error('Player already in game')
  }
  
  if (game.players.length >= game.maxPlayers) {
    throw new Error(`Game is full (maximum ${game.maxPlayers} players)`)
  }
  
  // Add player to game
  const { addPlayerToGame } = await import('./game')
  const updatedGame = addPlayerToGame(game, playerId)
  await updateGameInFirebase(updatedGame)
  
  // Store player information
  const { database } = await import('./firebase-config')
  const { ref, set } = await import('firebase/database')
  const playerRef = ref(database, `games/${gameId}/playerInfo/${playerId}`)
  // Ensure display name uniqueness within this game
  const existingInfo = await getAllPlayerInfo(gameId)
  const existingNames = existingInfo.map(i => i.displayName)
  const uniqueName = computeUniqueDisplayName(existingNames, playerName)
  await set(playerRef, {
    id: playerId,
    displayName: uniqueName,
    joinedAt: Date.now()
  })
  
  // Create session for this player/tab
  await createPlayerSession(gameId, playerId, sessionId)
  
  return updatedGame
}

// Remove player from game (for leaving functionality)
export async function removePlayerFromGame(gameId: GameId, playerId: PlayerId, sessionId: string): Promise<void> {
  const game = await getGameFromFirebase(gameId)
  if (!game) {
    throw new Error(`Game ${gameId} not found`)
  }
  
  if (game.status !== 'waiting') {
    throw new Error('Cannot leave game that has already started')
  }
  
  if (!game.players.includes(playerId)) {
    throw new Error('Player not in game')
  }
  
  // Validate session
  const isValidSession = await validatePlayerSession(gameId, playerId, sessionId)
  if (!isValidSession) {
    throw new Error(`Unauthorized: Invalid session for player ${playerId}`)
  }
  
  // Remove player from game
  const updatedGame: Game = {
    ...game,
    players: game.players.filter(id => id !== playerId)
  }
  
  // If this was the creator and they're leaving, assign creator to next player or delete game
  if (game.creator === playerId) {
    if (updatedGame.players.length === 0) {
      // No players left, delete the game
      const { database } = await import('./firebase-config')
      const { ref, remove } = await import('firebase/database')
      const gameRef = ref(database, `games/${gameId}`)
      await remove(gameRef)
      return // Don't return anything when game is deleted
    } else {
      // Assign creator to the first remaining player
      updatedGame.creator = updatedGame.players[0]
    }
  }
  
  // Save updated game to Firebase
  await updateGameInFirebase(updatedGame)
  
  // Remove player info from Firebase
  const { database } = await import('./firebase-config')
  const { ref, remove } = await import('firebase/database')
  const playerInfoRef = ref(database, `games/${gameId}/playerInfo/${playerId}`)
  await remove(playerInfoRef)
  
  // Remove all sessions for this player
  const sessionsRef = ref(database, `games/${gameId}/sessions/${playerId}`)
  await remove(sessionsRef)
}

// New function to start a game (creator only)
export async function startGameInFirebase(gameId: GameId, creatorId: PlayerId, sessionId: string): Promise<Game> {
  // Validate that this session is authorized to act as the creator
  const isValidSession = await validatePlayerSession(gameId, creatorId, sessionId)
  if (!isValidSession) {
    throw new Error(`Unauthorized: Invalid session for creator ${creatorId}`)
  }
  
  const game = await getGameFromFirebase(gameId)
  if (!game) {
    throw new Error(`Game ${gameId} not found`)
  }
  
  if (game.creator !== creatorId) {
    throw new Error('Only the creator can start the game')
  }
  
  const { startGame } = await import('./game')
  const updatedGame = startGame(game)
  await updateGameInFirebase(updatedGame)
  
  return updatedGame
}

// Function to append image to game history
export async function appendImageToGameHistory(gameId: GameId, imageResult: any): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)
  const gameData = snapshot.val()
  const currentHistory = gameData.imageHistory || []
  
  // Add unique ID and initialize empty reactions for new images (Phase 2)
  const imageWithReactions = {
    ...imageResult,
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    reactions: {},
    reactionUsers: {}
  }
  
  const updatedHistory = [...currentHistory, imageWithReactions]
  
  await update(gameRef, {
    imageHistory: updatedHistory
  })
}

// Phase 2: Reaction management functions with duplicate prevention
export async function addReactionToImage(gameId: GameId, imageId: string, emoji: string, playerId: PlayerId): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)
  
  if (!snapshot.exists()) {
    throw new Error(`Game ${gameId} not found`)
  }
  
  const gameData = snapshot.val()
  const imageHistory = gameData.imageHistory || []
  
  // Find the image by ID
  const imageIndex = imageHistory.findIndex((img: any) => img.id === imageId)
  if (imageIndex === -1) {
    throw new Error(`Image ${imageId} not found in game ${gameId}`)
  }
  
  const updatedImageHistory = [...imageHistory]
  const currentImage = updatedImageHistory[imageIndex]
  const currentReactions = currentImage.reactions || {}
  const currentReactionUsers = currentImage.reactionUsers || {}
  
  // Check if user has already reacted with this emoji
  const usersForEmoji = currentReactionUsers[emoji] || []
  if (usersForEmoji.includes(playerId)) {
    // User has already reacted with this emoji - do nothing
    console.log(`Player ${playerId} has already reacted with ${emoji} to image ${imageId}`)
    return
  }
  
  // Add user to reaction users and increment count
  updatedImageHistory[imageIndex] = {
    ...currentImage,
    reactions: {
      ...currentReactions,
      [emoji]: (currentReactions[emoji] || 0) + 1
    },
    reactionUsers: {
      ...currentReactionUsers,
      [emoji]: [...usersForEmoji, playerId]
    }
  }
  
  await update(gameRef, {
    imageHistory: updatedImageHistory
  })
}

// Remove a reaction (for toggle functionality)
export async function removeReactionFromImage(gameId: GameId, imageId: string, emoji: string, playerId: PlayerId): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)
  
  if (!snapshot.exists()) {
    throw new Error(`Game ${gameId} not found`)
  }
  
  const gameData = snapshot.val()
  const imageHistory = gameData.imageHistory || []
  
  // Find the image by ID
  const imageIndex = imageHistory.findIndex((img: any) => img.id === imageId)
  if (imageIndex === -1) {
    throw new Error(`Image ${imageId} not found in game ${gameId}`)
  }
  
  const updatedImageHistory = [...imageHistory]
  const currentImage = updatedImageHistory[imageIndex]
  const currentReactions = currentImage.reactions || {}
  const currentReactionUsers = currentImage.reactionUsers || {}
  
  // Check if user has reacted with this emoji
  const usersForEmoji = currentReactionUsers[emoji] || []
  if (!usersForEmoji.includes(playerId)) {
    // User hasn't reacted with this emoji - nothing to remove
    console.log(`Player ${playerId} hasn't reacted with ${emoji} to image ${imageId}`)
    return
  }
  
  // Remove user from reaction users and decrement count
  const updatedUsersForEmoji = usersForEmoji.filter((id: PlayerId) => id !== playerId)
  const newCount = Math.max(0, (currentReactions[emoji] || 0) - 1)
  
  updatedImageHistory[imageIndex] = {
    ...currentImage,
    reactions: {
      ...currentReactions,
      [emoji]: newCount
    },
    reactionUsers: {
      ...currentReactionUsers,
      [emoji]: updatedUsersForEmoji
    }
  }
  
  await update(gameRef, {
    imageHistory: updatedImageHistory
  })
}

export async function getImageReactions(gameId: GameId, imageId: string): Promise<Record<string, number> | null> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  const gameData = snapshot.val()
  const imageHistory = gameData.imageHistory || []
  
  // Find the image by ID
  const image = imageHistory.find((img: any) => img.id === imageId)
  if (!image) {
    return null
  }
  
  return image.reactions || {}
}

// Simple generation state management
export async function setGenerating(gameId: GameId): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`)
  await update(gameRef, { isGenerating: true })
}

export async function clearGenerating(gameId: GameId): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`)
  await update(gameRef, { isGenerating: false })
}
