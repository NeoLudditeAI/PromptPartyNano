// components/TurnReminder.tsx
'use client'

import React from 'react'
import { User } from '../types'

interface TurnReminderProps {
  currentPlayerId: string
  isGameComplete: boolean
  onCopyReminder: () => void
  players?: User[]
}

export default function TurnReminder({ 
  currentPlayerId, 
  isGameComplete, 
  onCopyReminder,
  players = []
}: TurnReminderProps) {
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player?.displayName || playerId
  }

  if (isGameComplete) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg border-2 border-yellow-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">Your Turn!</h3>
            <p className="text-sm opacity-90">
              You're playing as <span className="font-semibold">{getPlayerName(currentPlayerId)}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onCopyReminder}
          className="bg-white text-orange-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Copy Reminder
        </button>
      </div>
    </div>
  )
} 