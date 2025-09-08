// components/GameBoard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Game, PlayerId, User, ImageGenerationResult } from '../types'
import PromptDisplay from './PromptDisplay'
import ImageDisplay from './ImageDisplay'
import EditTurnInput from './EditTurnInput'
import PlayerIndicator from './PlayerIndicator'
import TurnNotification from './TurnNotification'
import ReactionNotification from './ReactionNotification'

interface GameBoardProps {
  game: Game
  currentPlayerId: PlayerId
  onGameUpdate: (game: Game) => void
  players?: User[]
  sessionId?: string
}

export default function GameBoard({ 
  game, 
  currentPlayerId, 
  onGameUpdate,
  players = [],
  sessionId = ''
}: GameBoardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewImageOverlay, setShowNewImageOverlay] = useState(false)
  const [newImageData, setNewImageData] = useState<{ imageUrl: string; prompt: string } | null>(null)
  const [previousImageCount, setPreviousImageCount] = useState(game.imageHistory.length)
  
  // Phase 2: Get current image ID, reactions, and user reaction state from Firebase
  const getCurrentImageData = (): { 
    imageId: string | null; 
    reactions: Record<string, number>;
    userHasReacted: Record<string, boolean>;
  } => {
    if (!newImageData || game.imageHistory.length === 0) {
      return { 
        imageId: null, 
        reactions: { '❤️': 0, '😍': 0, '🎨': 0 },
        userHasReacted: { '❤️': false, '😍': false, '🎨': false }
      }
    }
    
    // Find the current image in history (latest one)
    const latestImage = game.imageHistory[game.imageHistory.length - 1]
    const reactions = latestImage.reactions || {}
    const reactionUsers = latestImage.reactionUsers || {}
    
    return {
      imageId: latestImage.id || null,
      reactions: {
        '❤️': reactions['❤️'] || 0,
        '😍': reactions['😍'] || 0,
        '🎨': reactions['🎨'] || 0
      },
      userHasReacted: {
        '❤️': (reactionUsers['❤️'] || []).includes(currentPlayerId),
        '😍': (reactionUsers['😍'] || []).includes(currentPlayerId),
        '🎨': (reactionUsers['🎨'] || []).includes(currentPlayerId)
      }
    }
  }
  
  const { imageId: currentImageId, reactions: currentReactions, userHasReacted } = getCurrentImageData()

  // Detect when a new image is generated
  useEffect(() => {
    if (game.imageHistory.length > previousImageCount && game.imageHistory.length > 0) {
      // A new image was added
      const latestImage = game.imageHistory[game.imageHistory.length - 1]
      setNewImageData({
        imageUrl: latestImage.imageUrl,
        prompt: latestImage.prompt
      })
      setShowNewImageOverlay(true)
      
      // Phase 2: No need to reset reactions - they come from Firebase per image
    }
    setPreviousImageCount(game.imageHistory.length)
  }, [game.imageHistory.length, previousImageCount])

  const handleNewImageDismiss = () => {
    setShowNewImageOverlay(false)
    setNewImageData(null)
  }

  // Phase 2: Handle reaction clicks with Firebase persistence and toggle functionality
  const handleReaction = async (emoji: string) => {
    if (!currentImageId) {
      console.log(`No current image ID available for reaction: ${emoji}`)
      return
    }
    
    try {
      const hasReacted = userHasReacted[emoji]
      
      if (hasReacted) {
        // User has already reacted - remove the reaction (toggle off)
        const { removeReactionFromImage } = await import('../lib/firebase')
        await removeReactionFromImage(game.id, currentImageId, emoji, currentPlayerId)
        console.log(`Reaction: ${emoji} removed from Firebase for image ${currentImageId} by player ${currentPlayerId}`)
      } else {
        // User hasn't reacted - add the reaction (toggle on)
        const { addReactionToImage } = await import('../lib/firebase')
        await addReactionToImage(game.id, currentImageId, emoji, currentPlayerId)
        console.log(`Reaction: ${emoji} added to Firebase for image ${currentImageId} by player ${currentPlayerId}`)
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      // Could add user-visible error handling here in the future
    }
  }

  // Keyboard support for dismissing overlay
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showNewImageOverlay && event.key === 'Escape') {
        handleNewImageDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showNewImageOverlay])

  const handleTurnSubmit = async (text: string) => {
    if (!text.trim()) return

    setIsSubmitting(true)
    try {
      // Import Firebase functions
      const { addTurnToGameWithSession, getCurrentPlayerFromGame, getGameFromFirebase, setGenerating, clearGenerating } = await import('../lib/firebase')
      const { generateImageForGame } = await import('../lib/image')
      
      // Always get the current player from Firebase to ensure proper turn validation
      const actualCurrentPlayer = await getCurrentPlayerFromGame(game.id)
      if (!actualCurrentPlayer) {
        throw new Error('Could not determine current player')
      }
      
      // Validate that the user is actually the current player
      if (actualCurrentPlayer !== currentPlayerId) {
        throw new Error(`It's not your turn. Current player is ${actualCurrentPlayer}`)
      }
      
      // Add the turn using Firebase with session validation
      const updatedGame = await addTurnToGameWithSession(game.id, currentPlayerId, text, sessionId)
      
      // Set generating state for all players
      await setGenerating(game.id)
      
      // All games are edit mode: All turns are edit commands
      // The seed image should already be in imageHistory[0] from game creation
      // Send edit command with the previous image to Nano Banana
      const previousImage = game.imageHistory.length > 0 
        ? game.imageHistory[game.imageHistory.length - 1].imageUrl
        : game.seedImage || undefined
      
      await generateImageForGame(
        updatedGame.id,
        text, // This is the edit command
        async () => {}, // Empty callback since Firebase handles the update
        previousImage // Pass the previous image for editing
      )
      
      // Clear generating state
      await clearGenerating(game.id)
      
      // Get the complete updated game data from Firebase (including the new image)
      const completeGameData = await getGameFromFirebase(game.id)
      if (completeGameData) {
        onGameUpdate(completeGameData)
      } else {
        // Fallback to the updated game data if Firebase fetch fails
        onGameUpdate(updatedGame)
      }
      
      // Note: We don't call onPlayerChange here because currentPlayerId should represent
      // the player using this browser tab, not the current player in the game
      
    } catch (error) {
      console.error('Error submitting turn:', error)
      // Clear generating state on error
      try {
        const { clearGenerating } = await import('../lib/firebase')
        await clearGenerating(game.id)
      } catch (clearError) {
        console.error('Error clearing generation state:', clearError)
      }
      alert('Error submitting turn. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isGameComplete = game.turns.length >= game.config.TURNS_PER_GAME
  const lastTurn = game.turns.length > 0 ? game.turns[game.turns.length - 1] : null
  const maxTurns = game.config.TURNS_PER_GAME
  const isGenerating = game.isGenerating || false

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Game State */}
        <div className="space-y-6">
          <PlayerIndicator 
            game={game} 
            currentPlayerId={currentPlayerId}
            isGameComplete={isGameComplete}
            players={players}
          />
          
          <TurnNotification
            lastTurn={lastTurn}
            gameId={game.id}
            currentPlayerId={currentPlayerId}
            isGameComplete={isGameComplete}
            totalTurns={game.turns.length}
            maxTurns={maxTurns}
            players={players}
          />
          
          <PromptDisplay game={game} players={players} />
          
          {!isGameComplete && (
            <>
              <EditTurnInput 
                onSubmit={handleTurnSubmit}
                isSubmitting={isSubmitting}
                currentPlayerId={currentPlayerId}
                players={players}
              />
            </>
          )}
          
          {isGameComplete && (
            <div className="bg-gradient-to-r from-ut-orange to-success-500 text-white p-6 rounded-xl text-center shadow-xl border border-ut-orange/20">
              <h3 className="text-2xl font-bold mb-2">🎉 Game Complete!</h3>
              <p className="text-orange-100">All players have taken their turns. Great collaborative editing!</p>
            </div>
          )}
        </div>
        
        {/* Right Column - Image Display */}
        <div>
          <ImageDisplay game={game} currentPlayerId={currentPlayerId} />
        </div>
      </div>
      
      {/* Generation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating image...</h3>
            <p className="text-sm text-gray-600">Please wait, this may take a few seconds.</p>
          </div>
        </div>
      )}

      {/* New Image Overlay */}
      {showNewImageOverlay && newImageData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div 
            className="relative max-w-full max-h-full cursor-pointer"
            onClick={handleNewImageDismiss}
          >
            {/* Main Image */}
            <img 
              src={newImageData.imageUrl} 
              alt={newImageData.prompt} 
              className="max-w-full max-h-[70vh] object-contain" 
            />
            
            {/* Reaction Bar - Bottom of image, thumb accessible */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-6 py-3 flex space-x-4">
                {['❤️', '😂', '🔥', '✨', '🎨'].map(emoji => {
                  const hasReacted = userHasReacted[emoji]
                  const count = currentReactions[emoji]
                  
                  return (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent overlay dismissal
                        handleReaction(emoji)
                      }}
                      className={`text-2xl hover:scale-110 transition-transform duration-200 rounded-full w-12 h-12 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        hasReacted 
                          ? 'bg-white/40 hover:bg-white/50' // Highlighted when user has reacted
                          : 'bg-white/20 hover:bg-white/30' // Normal state
                      }`}
                      aria-label={`${hasReacted ? 'Remove' : 'Add'} ${emoji} reaction. Current count: ${count}${hasReacted ? '. Click to remove your reaction' : '. Click to add reaction'}`}
                    >
                      <span className="text-xl">{emoji}</span>
                      {count > 0 && (
                        <span className="text-xs text-white font-semibold mt-0.5">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Tap anywhere outside to dismiss */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={handleNewImageDismiss}
          />
        </div>
      )}
      
      {/* Reaction Notifications */}
      <ReactionNotification game={game} currentPlayerId={currentPlayerId} players={players} />
    </div>
  )
} 