// app/page.tsx
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Game, PlayerId, User } from '../types'
import GameBoard from '../components/GameBoard'
import NotificationSetup from '../components/NotificationSetup'
import { createSoloGame, addPlayerToGameWithSession, getGameFromFirebase, getAllPlayerInfo } from '../lib/firebase'

// Generate a unique session ID for this browser tab
const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

function HomePageContent() {
  const searchParams = useSearchParams()
  const [game, setGame] = useState<Game | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<PlayerId>('')
  const [players, setPlayers] = useState<User[]>([])
  const [gameMode, setGameMode] = useState<'menu' | 'create' | 'join'>('menu')
  const [creatorName, setCreatorName] = useState('')
  const [joinGameId, setJoinGameId] = useState('')
  const [joinPlayerName, setJoinPlayerName] = useState('')
  const [sessionId] = useState(generateSessionId())
  const [isAutoJoining, setIsAutoJoining] = useState(false)
  
  // Edit mode state
  const [gameCreationMode, setGameCreationMode] = useState<'upload' | 'generate'>('generate')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [initialPrompt, setInitialPrompt] = useState('')

  // Handle direct lobby links - check for game ID in URL
  useEffect(() => {
    const gameIdFromUrl = searchParams.get('game')
    if (gameIdFromUrl && !game && !isAutoJoining) {
      handleDirectGameJoin(gameIdFromUrl)
    }
  }, [searchParams, game, isAutoJoining])

  const handleDirectGameJoin = async (gameId: string) => {
    setIsAutoJoining(true)
    try {
      const existingGame = await getGameFromFirebase(gameId)
      
      if (!existingGame) {
        alert('Game not found. The link may be invalid or the game may have been deleted.')
        return
      }

      if (existingGame.status !== 'waiting') {
        alert('This game has already started or is completed.')
        return
      }

      // Set the game ID in the join form and switch to join mode
      setJoinGameId(gameId)
      setGameMode('join')
      
      // Clear the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('game')
      window.history.replaceState({}, '', url.toString())
      
    } catch (error) {
      console.error('Error joining game from URL:', error)
      alert('Error joining game. Please try again.')
    } finally {
      setIsAutoJoining(false)
    }
  }

  // Initialize session ID for this browser tab
  useEffect(() => {
    // Session ID is already generated in useState
  }, [])

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!game) return

    const { subscribeToGame, getAllPlayerInfo } = require('../lib/firebase')
    
    const unsubscribe = subscribeToGame(game.id, async (updatedGame: Game | null) => {
      if (updatedGame) {
        // If this tab's player has left the game, ignore further updates
        if (!updatedGame.players.includes(currentPlayerId)) {
          return
        }
        setGame(updatedGame)
        
        // Update player list when game changes
        try {
          const allPlayerInfo = await getAllPlayerInfo(updatedGame.id)
          const allPlayers: User[] = allPlayerInfo.map((info: { id: PlayerId, displayName: string }) => ({
            id: info.id,
            displayName: info.displayName
          }))
          setPlayers(allPlayers)
          
          // Note: currentPlayerId should NOT be updated here
          // It represents the player using this browser tab, not the current player in the game
        } catch (error) {
          console.error('Error updating player list:', error)
        }
      } else {
        // Game was deleted (e.g., last player left), reset to main menu
        console.log('Game was deleted, returning to main menu')
        setGame(null)
        setCurrentPlayerId('')
        setPlayers([])
        setGameMode('menu')
        setCreatorName('')
        setJoinGameId('')
        setJoinPlayerName('')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [game?.id])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    // Convert to base64 data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImage(result)
    }
    reader.readAsDataURL(file)
  }

  const createGame = async () => {
    if (!creatorName.trim()) {
      alert('Please enter your name')
      return
    }

    // Validate based on creation mode
    if (gameCreationMode === 'upload' && !uploadedImage) {
      alert('Please upload an image to start the game')
      return
    }

    if (gameCreationMode === 'generate' && !initialPrompt.trim()) {
      alert('Please enter a prompt to generate the initial image')
      return
    }

    try {
      const { createSoloGame } = await import('../lib/firebase')
      const creator: User = {
        id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        displayName: creatorName.trim()
      }
      
      const newGame = await createSoloGame(creator)
      
      // Set game mode based on creation choice
      const gameWithMode = {
        ...newGame,
        gameMode: 'edit' as const
      }
      
      // If Player 1 uploaded an image, we need to store it and use it for the first turn
      if (gameCreationMode === 'upload' && uploadedImage) {
        // Store the uploaded image in the game state
        // For now, we'll store it in a way that can be accessed by the first turn
        // TODO: Implement proper image storage and retrieval
        console.log('Player 1 uploaded image:', uploadedImage.substring(0, 50) + '...')
      }
      
      // If Player 1 chose to generate, we'll use the initial prompt
      if (gameCreationMode === 'generate' && initialPrompt) {
        console.log('Player 1 initial prompt:', initialPrompt)
      }
      
      setGame(gameWithMode)
      setCurrentPlayerId(creator.id)
      setPlayers([creator])
      
      // Create session for creator
      const { createPlayerSession } = await import('../lib/firebase')
      await createPlayerSession(newGame.id, creator.id, sessionId)
      
      // Store FCM token for push notifications
      try {
        const { storeFCMTokenForPlayer } = await import('../lib/notifications')
        await storeFCMTokenForPlayer(creator.id)
        console.log('[Game] FCM token stored for game creator')
      } catch (error) {
        console.log('[Game] Could not store FCM token (notifications may not work):', error)
      }
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Error creating game. Please try again.')
    }
  }

  const joinGame = async () => {
    if (joinGameId.trim() && joinPlayerName.trim()) {
      try {
        const { getGameFromFirebase, getAllPlayerInfo } = await import('../lib/firebase')
        const existingGame = await getGameFromFirebase(joinGameId)
        
        if (!existingGame) {
          alert('Game not found. Please check the game ID.')
          return
        }

        if (existingGame.status !== 'waiting') {
          alert('This game has already started or is completed.')
          return
        }

        // Create a new player for the joining user
        const joiningPlayer: User = {
          id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          displayName: joinPlayerName.trim()
        }

        // Add the new player to the game with session management
        const { addPlayerToGameWithSession } = await import('../lib/firebase')
        const updatedGame = await addPlayerToGameWithSession(joinGameId, joiningPlayer.id, joiningPlayer.displayName, sessionId)
        
        // Store FCM token for push notifications
        try {
          const { storeFCMTokenForPlayer } = await import('../lib/notifications')
          await storeFCMTokenForPlayer(joiningPlayer.id)
          console.log('[Game] FCM token stored for joining player')
        } catch (error) {
          console.log('[Game] Could not store FCM token (notifications may not work):', error)
        }
        
        // Get all player information including existing players
        const allPlayerInfo = await getAllPlayerInfo(joinGameId)
        
        // Convert to User objects for the UI
        const allPlayers: User[] = allPlayerInfo.map(info => ({
          id: info.id,
          displayName: info.displayName
        }))
        
        setGame(updatedGame)
        setCurrentPlayerId(joiningPlayer.id)
        setPlayers(allPlayers)
      } catch (error) {
        console.error('Error joining game:', error)
        alert('Error joining game. Please try again.')
      }
    }
  }

  const startGame = async () => {
    if (!game || game.creator !== currentPlayerId) {
      alert('Only the creator can start the game')
      return
    }

    try {
      const { startGameInFirebase } = await import('../lib/firebase')
      const updatedGame = await startGameInFirebase(game.id, currentPlayerId, sessionId)
      setGame(updatedGame)
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game. Please try again.')
    }
  }

  const resetToMenu = async () => {
    // Immediately reset all state to prevent any further renders
    setGame(null)
    setCurrentPlayerId('')
    setPlayers([])
    setGameMode('menu')
    setCreatorName('')
    setJoinGameId('')
    setJoinPlayerName('')
    
    // Reset edit mode state
    setGameCreationMode('generate')
    setUploadedImage(null)
    setInitialPrompt('')
    
    // Handle Firebase cleanup in the background
    if (game && currentPlayerId && game.id) {
      try {
        const { removePlayerFromGame } = await import('../lib/firebase')
        await removePlayerFromGame(game.id, currentPlayerId, sessionId)
      } catch (error) {
        console.error('❌ Firebase cleanup failed:', error)
        // Don't throw - UI is already reset
      }
    }
  }

  // Game lobby component
  const GameLobby = () => {
    if (!game || game.status !== 'waiting') return null

    const playerCount = getPlayerCount(game)
    const isCreator = game.creator === currentPlayerId
    const canStart = isCreator && playerCount.current >= playerCount.min
    const [gameIdCopied, setGameIdCopied] = useState(false)
    const [shareLinkCopied, setShareLinkCopied] = useState(false)

    const copyGameId = async () => {
      try {
        await navigator.clipboard.writeText(game.id)
        setGameIdCopied(true)
        setTimeout(() => setGameIdCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy game ID:', error)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = game.id
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setGameIdCopied(true)
        setTimeout(() => setGameIdCopied(false), 2000)
      }
    }

    const copyShareLink = async () => {
      const shareLink = `${window.location.origin}?game=${game.id}`
      try {
        await navigator.clipboard.writeText(shareLink)
        setShareLinkCopied(true)
        setTimeout(() => setShareLinkCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy share link:', error)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareLink
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setShareLinkCopied(true)
        setTimeout(() => setShareLinkCopied(false), 2000)
      }
    }

    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">Game Lobby</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 text-center mb-2">
            Game ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{game.id}</span>
          </p>
          <div className="flex gap-2 justify-center mb-2">
            <button
              onClick={copyGameId}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
            >
              {gameIdCopied ? (
                <>
                  <span>✓</span>
                  Copied!
                </>
              ) : (
                <>
                  <span>📋</span>
                  Copy Game ID
                </>
              )}
            </button>
            <button
              onClick={copyShareLink}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
            >
              {shareLinkCopied ? (
                <>
                  <span>✓</span>
                  Link Copied!
                </>
              ) : (
                <>
                  <span>🔗</span>
                  Share Link
                </>
              )}
            </button>
          </div>
          <p className="text-center text-sm text-gray-500">
            Share the Game ID or direct link with friends to join!
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-900">Players ({playerCount.current}/{playerCount.max})</h3>
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-900 font-medium">{player.displayName}</span>
                {player.id === game.creator && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">Creator</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-gray-900">How to Play</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Each player adds to the prompt in turn</p>
            <p>• The AI generates an image from your collective story</p>
            <p>• Game ends when everyone has contributed</p>
          </div>
        </div>

        {canStart ? (
          <button
            onClick={startGame}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition-colors shadow-sm font-medium"
          >
            Start Game ({playerCount.current} players)
          </button>
        ) : isCreator ? (
          <div className="text-center text-gray-500">
            Waiting for more players... (Need at least {playerCount.min})
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Waiting for creator to start the game...
          </div>
        )}

        <button
          onClick={resetToMenu}
          className="w-full mt-2 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors shadow-sm"
        >
          Leave Game
        </button>
      </div>
    )
  }

  // Helper function to get player count info
  const getPlayerCount = (game: Game) => {
    return {
      current: game.players.length,
      min: game.minPlayers,
      max: game.maxPlayers
    }
  }

  // Main menu
  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Prompt Party</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900">Create or Join a Game</h2>
            
            {gameMode === 'menu' && (
              <div className="space-y-3">
                <button
                  onClick={() => setGameMode('create')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Create New Game
                </button>
                <button
                  onClick={() => setGameMode('join')}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Join Existing Game
                </button>
              </div>
            )}

            {gameMode === 'create' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="creator-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    id="creator-name"
                    name="creatorName"
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Game Creation Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How would you like to start the game?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setGameCreationMode('upload')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        gameCreationMode === 'upload'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-sm font-medium">Upload Image</div>
                        <div className="text-xs text-gray-500">Use your own photo</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setGameCreationMode('generate')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        gameCreationMode === 'generate'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🎨</div>
                        <div className="text-sm font-medium">Generate Image</div>
                        <div className="text-xs text-gray-500">Create with AI</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Upload Image Option */}
                {gameCreationMode === 'upload' && (
                  <div>
                    <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        {uploadedImage ? (
                          <div>
                            <img 
                              src={uploadedImage} 
                              alt="Uploaded preview" 
                              className="mx-auto max-h-32 rounded-lg shadow-sm"
                            />
                            <p className="mt-2 text-sm text-green-600">✓ Image uploaded successfully</p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-4xl text-gray-400 mb-2">📷</div>
                            <p className="text-gray-600">Click to upload an image</p>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Generate Image Option */}
                {gameCreationMode === 'generate' && (
                  <div>
                    <label htmlFor="initial-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Image Prompt
                    </label>
                    <textarea
                      id="initial-prompt"
                      name="initialPrompt"
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                      placeholder="Describe the image you want to create... (e.g., 'A majestic mountain landscape at sunset with a lake in the foreground')"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be used to generate the initial image that other players will edit.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={createGame}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Create Game
                  </button>
                  <button
                    onClick={() => setGameMode('menu')}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors shadow-sm"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {gameMode === 'join' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="join-game-id" className="block text-sm font-medium text-gray-700 mb-2">
                    Game ID
                  </label>
                  <input
                    id="join-game-id"
                    name="joinGameId"
                    type="text"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    placeholder="Enter game ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="join-player-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    id="join-player-name"
                    name="joinPlayerName"
                    type="text"
                    value={joinPlayerName}
                    onChange={(e) => setJoinPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={joinGame}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Join Game
                  </button>
                  <button
                    onClick={() => setGameMode('menu')}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors shadow-sm"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Game lobby or active game
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Subtle identity indicator */}
      <div className="max-w-4xl mx-auto">
        {players.length > 0 && currentPlayerId && (
          (() => {
            const me = players.find(p => p.id === currentPlayerId)
            if (!me) return null
            return (
              <div className="mb-2 text-right text-sm text-gray-600">
                You're playing as <span className="font-medium text-gray-900">{me.displayName}</span>
              </div>
            )
          })()
        )}
      </div>
      {game.status === 'waiting' ? (
        <GameLobby />
      ) : (
        <div className="max-w-4xl mx-auto">
          <GameBoard 
            game={game} 
            currentPlayerId={currentPlayerId}
            onGameUpdate={setGame}
            players={players}
            sessionId={sessionId}
          />
        </div>
      )}
      
      {/* Notification Setup - Shows permission prompt at optimal moments */}
      <NotificationSetup 
        trigger="app-start"
        onPermissionGranted={() => console.log('Notifications enabled!')}
        onPermissionDenied={() => console.log('Notifications declined')}
      />


    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
