// components/TurnNotification.tsx
'use client'

import React, { useState } from 'react'
import { PromptTurn, User } from '../types'

interface TurnNotificationProps {
  lastTurn: PromptTurn | null
  gameId: string
  currentPlayerId: string
  isGameComplete: boolean
  totalTurns: number
  maxTurns: number
  players?: User[]
}

export default function TurnNotification({ 
  lastTurn, 
  gameId, 
  currentPlayerId, 
  isGameComplete, 
  totalTurns, 
  maxTurns,
  players = []
}: TurnNotificationProps) {
  const [copied, setCopied] = useState(false)

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player?.displayName || playerId
  }

  const copyGameLink = async () => {
    const gameUrl = `${window.location.origin}?game=${gameId}`
    try {
      await navigator.clipboard.writeText(gameUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const copyTurnUpdate = async () => {
    if (!lastTurn) return
    
    const playerName = getPlayerName(lastTurn.userId)
    const nextPlayerName = getPlayerName(currentPlayerId)
    
    const message = `🎨 Prompt Party Update!\n\n${playerName} just added: "${lastTurn.text}"\n\nGame: ${totalTurns}/${maxTurns} turns\nNext: ${nextPlayerName}\n\nJoin here: ${window.location.origin}?game=${gameId}`
    
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const copyGameComplete = async () => {
    const message = `🎉 Prompt Party Game Complete!\n\nFinal image generated!\n\nView the result: ${window.location.origin}?game=${gameId}`
    
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (isGameComplete) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">🎉 Game Complete!</h3>
            <p className="text-sm opacity-90">Final image has been generated</p>
          </div>
          <button
            onClick={copyGameComplete}
            className="bg-white text-emerald-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    )
  }

  if (!lastTurn) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">🎨 Game Started!</h3>
            <p className="text-sm opacity-90">Ready for the first turn</p>
          </div>
          <button
            onClick={copyGameLink}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {copied ? 'Copied!' : 'Share Link'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">✨ Turn Update!</h3>
            <p className="text-sm opacity-90">
              <span className="font-semibold">{getPlayerName(lastTurn.userId)}</span> added: 
              <span className="italic"> "{lastTurn.text}"</span>
            </p>
          </div>
          <button
            onClick={copyTurnUpdate}
            className="bg-white text-indigo-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
        
        <div className="flex items-center justify-between text-sm opacity-90">
          <span>Progress: {totalTurns}/{maxTurns} turns</span>
          <span>Next: {getPlayerName(currentPlayerId)}</span>
        </div>
      </div>
    </div>
  )
} 