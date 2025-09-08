// components/PlayerIndicator.tsx
'use client'

import React from 'react'
import { Game, PlayerId, User } from '../types'

interface PlayerIndicatorProps {
  game: Game
  currentPlayerId: PlayerId  // This represents the player using this browser tab
  isGameComplete: boolean
  players?: User[]
}

export default function PlayerIndicator({ 
  game, 
  currentPlayerId, 
  isGameComplete,
  players = []
}: PlayerIndicatorProps) {
  const getCurrentPlayerInGame = () => {
    return game.players[game.currentPlayerIndex]
  }

  const getPlayerName = (playerId: PlayerId) => {
    const player = players.find(p => p.id === playerId)
    return player?.displayName || playerId
  }

  const currentPlayerInGame = getCurrentPlayerInGame()
  const isMyTurn = currentPlayerInGame === currentPlayerId

  return (
    <div className="bg-white rounded-xl shadow-lg border border-sky-blue/20 p-6">
      <div className="text-center">
        {isGameComplete ? (
          <div>
            <h2 className="text-2xl font-bold text-ut-orange mb-2">
              🎉 Game Complete!
            </h2>
            <p className="text-gray-600">
              All players have taken their turns
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-prussian-blue">
              {isMyTurn ? '🎯 Your Turn!' : '⏳ Waiting...'}
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Current player: <span className="font-semibold text-gray-900">{getPlayerName(currentPlayerInGame)}</span>
            </p>
            <p className="text-sm text-gray-500">
              Turn {game.turns.length + 1} of {game.config.TURNS_PER_GAME}
            </p>
          </div>
        )}
      </div>
      
      {/* Player List */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Players:</h3>
        <div className="flex flex-wrap gap-2">
          {game.players.map((playerId, index) => (
            <div
              key={playerId}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                playerId === currentPlayerInGame
                  ? 'bg-blue-green text-white'
                  : 'bg-sky-blue/20 text-prussian-blue border border-sky-blue/30'
              }`}
            >
              {getPlayerName(playerId)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 