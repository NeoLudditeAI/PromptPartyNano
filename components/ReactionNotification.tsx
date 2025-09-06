// components/ReactionNotification.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Game, PlayerId, User } from '../types'

interface ReactionNotificationProps {
  game: Game
  currentPlayerId: PlayerId
  players?: User[]
}

interface NotificationData {
  id: string
  playerName: string
  emoji: string
  imageIndex: number
  timestamp: number
}

export default function ReactionNotification({ game, currentPlayerId, players = [] }: ReactionNotificationProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [lastProcessedReactions, setLastProcessedReactions] = useState<Record<string, Record<string, string[]>>>({})

  useEffect(() => {
    // Process new reactions and create notifications
    const newNotifications: NotificationData[] = []
    const currentReactions: Record<string, Record<string, string[]>> = {}

    // Build current state of all reactions
    game.imageHistory.forEach((image, imageIndex) => {
      if (!image.id || !image.reactionUsers) return
      
      currentReactions[image.id] = image.reactionUsers
      
      // Compare with last processed state to find new reactions
      const lastImageReactions = lastProcessedReactions[image.id] || {}
      
      Object.entries(image.reactionUsers).forEach(([emoji, users]) => {
        const lastUsers = lastImageReactions[emoji] || []
        const newUsers = users.filter(userId => !lastUsers.includes(userId))
        
        // Create notifications for new reactions (excluding current player)
        newUsers.forEach(userId => {
          if (userId !== currentPlayerId) {
            // Find player name
            const player = players.find(p => p.id === userId)
            const playerName = player?.displayName || 'Someone'
            
            newNotifications.push({
              id: `${image.id}_${emoji}_${userId}_${Date.now()}`,
              playerName,
              emoji,
              imageIndex,
              timestamp: Date.now()
            })
          }
        })
      })
    })

    // Update last processed state
    setLastProcessedReactions(currentReactions)

    // Add new notifications
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 5)) // Keep only 5 most recent
    }
  }, [game.imageHistory, players, currentPlayerId, lastProcessedReactions])

  // Auto-remove notifications after 6 seconds
  useEffect(() => {
    if (notifications.length === 0) return

    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1)) // Remove oldest notification
    }, 6000)

    return () => clearTimeout(timer)
  }, [notifications])

  // Don't render if no notifications
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 space-y-2" style={{ zIndex: 9999 }}>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs transform transition-all duration-300 animate-in slide-in-from-right-full"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{notification.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                <span className="font-semibold">{notification.playerName}</span> reacted to image {notification.imageIndex + 1}
              </p>
            </div>
            
            {/* Subtle close button */}
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
