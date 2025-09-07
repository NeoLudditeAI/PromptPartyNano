// components/EditTurnInput.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { PlayerId, User, GAME_CONFIG, CharacterCountStatus } from '../types'
import { getCharacterCountStatus, validateTurnText } from '../lib/game'

interface EditTurnInputProps {
  onSubmit: (command: string) => void
  isSubmitting: boolean
  currentPlayerId: PlayerId
  players?: User[]
}

export default function EditTurnInput({ 
  onSubmit, 
  isSubmitting, 
  currentPlayerId,
  players = []
}: EditTurnInputProps) {
  const [inputText, setInputText] = useState('')

  const getPlayerName = (playerId: PlayerId) => {
    const player = players.find(p => p.id === playerId)
    return player?.displayName || playerId
  }

  // Real-time character count and validation
  const characterCount = inputText.length
  const characterStatus = useMemo(() => getCharacterCountStatus(characterCount), [characterCount])
  const validation = useMemo(() => validateTurnText(inputText), [inputText])
  const canSubmit = validation.isValid && !isSubmitting

  // Get color classes based on character status
  const getStatusColor = (status: CharacterCountStatus) => {
    switch (status) {
      case 'safe':
        return 'text-emerald-500'
      case 'warning':
        return 'text-amber-500'
      case 'danger':
        return 'text-orange-500'
      case 'exceeded':
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  const getBorderColor = (status: CharacterCountStatus) => {
    switch (status) {
      case 'safe':
        return 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
      case 'warning':
        return 'border-amber-400 focus:border-amber-500 focus:ring-amber-500'
      case 'danger':
        return 'border-orange-400 focus:border-orange-500 focus:ring-orange-500'
      case 'exceeded':
        return 'border-red-400 focus:border-red-500 focus:ring-red-500'
      default:
        return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    
    onSubmit(inputText.trim())
    setInputText('')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ✏️ Edit the Image
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-input" className="block text-sm font-medium text-gray-700 mb-2">
            Your edit instruction (as {getPlayerName(currentPlayerId)}):
          </label>
          <textarea
            id="edit-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="How would you like to modify the image? (e.g., 'make the sky blue', 'add snow to peaks', 'remove the hat')"
            className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none ${getBorderColor(characterStatus)}`}
            rows={3}
            disabled={isSubmitting}
            maxLength={GAME_CONFIG.MAX_TURN_LENGTH}
          />
          
          {/* Character counter */}
          <div className="flex justify-between items-center mt-2">
            <div className={`text-sm font-medium ${getStatusColor(characterStatus)}`}>
              {characterCount}/{GAME_CONFIG.MAX_TURN_LENGTH} characters
            </div>
            {!validation.isValid && (
              <div className="text-sm text-red-600 font-medium">
                {validation.error}
              </div>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            !canSubmit
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          }`}
        >
          {isSubmitting ? 'Processing Edit...' : 'Submit Edit'}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>✏️ <strong>Edit the current image</strong> with simple instructions</p>
        <p className="mt-1">💡 Examples: "make the sky blue", "add snow to peaks", "remove the hat"</p>
        <p className="mt-1">🎯 Each edit maintains the subject's identity while making changes</p>
        <p className="mt-1">📝 Keep it concise - you have {GAME_CONFIG.MAX_TURN_LENGTH} characters per turn.</p>
      </div>
    </div>
  )
}
