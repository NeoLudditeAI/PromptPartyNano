// components/PromptDisplay.tsx
'use client'

import React from 'react'
import { Game, User } from '../types'

interface PromptDisplayProps {
  game: Game
  players?: User[]
}

export default function PromptDisplay({ game, players = [] }: PromptDisplayProps) {
  const buildFullPrompt = (turns: any[]) => {
    if (turns.length === 0) return ''
    
    return turns
      .map(turn => turn.text.trim())
      .filter(text => text.length > 0)
      .join(' ')
  }

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player?.displayName || playerId
  }

  const fullPrompt = buildFullPrompt(game.turns)

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ✏️ Edit History
      </h3>
      
      {game.turns.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <p className="text-gray-500 italic text-center">
            No edits yet. The first player will make an edit to start the game!
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Latest edit by <span className="font-semibold">{getPlayerName(game.turns[game.turns.length - 1].userId)}</span>:
          </p>
          <p className="text-lg text-gray-900 leading-relaxed">
            "{game.turns[game.turns.length - 1].text}"
          </p>
        </div>
      )}
      
      {/* Edit History */}
      {game.turns.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            All Edits:
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {game.turns.map((turn, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 font-mono">
                  {index + 1}.
                </span>
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">{getPlayerName(turn.userId)}</span>
                  {' edited: '}
                  <span className="text-gray-900">"{turn.text}"</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 