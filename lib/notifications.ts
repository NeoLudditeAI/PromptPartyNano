// lib/notifications.ts
// Client-side notification management for Prompt Party

import { PlayerId, GameId } from '../types'
import { messaging, database } from './firebase-config'
import { getToken, onMessage } from 'firebase/messaging'
import { ref, set } from 'firebase/database'

// Notification permission states
export type NotificationPermission = 'default' | 'granted' | 'denied'

// Notification types for analytics and routing
export type NotificationType = 'turn' | 'reaction' | 'game-complete'

// Notification data structure
export interface NotificationData {
  title: string
  body: string
  gameId?: GameId
  playerId?: PlayerId
  type: NotificationType
  url?: string
  icon?: string
}

/**
 * Service Worker Registration and Management
 */
export class NotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private isSupported: boolean = false
  private fcmToken: string | null = null

  constructor() {
    this.isSupported = this.checkSupport()
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied'
    return Notification.permission as NotificationPermission
  }

  /**
   * Check if notifications are currently enabled
   */
  isEnabled(): boolean {
    return this.getPermissionStatus() === 'granted'
  }

  /**
   * Initialize service worker and setup push notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('[Notifications] Push notifications not supported')
      return false
    }

    try {
      // Register service worker
      console.log('[Notifications] Registering service worker...')
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('[Notifications] Service worker registered:', this.registration.scope)

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      console.log('[Notifications] Service worker ready')

      return true
    } catch (error) {
      console.error('[Notifications] Service worker registration failed:', error)
      return false
    }
  }

  /**
   * Request notification permission with compelling UX
   */
  async requestPermission(context?: string): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.log('[Notifications] Notifications not supported')
      return 'denied'
    }

    // Already granted
    if (this.isEnabled()) {
      return 'granted'
    }

    // Already denied - don't spam the user
    if (Notification.permission === 'denied') {
      console.log('[Notifications] Permission previously denied')
      return 'denied'
    }

    try {
      console.log('[Notifications] Requesting permission...', context ? `Context: ${context}` : '')
      
      // Request permission
      const permission = await Notification.requestPermission()
      console.log('[Notifications] Permission result:', permission)

      return permission as NotificationPermission
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error)
      return 'denied'
    }
  }

  /**
   * Subscribe to push notifications using Firebase Cloud Messaging
   */
  async subscribeToPush(): Promise<string | null> {
    if (!this.registration || !this.isEnabled()) {
      console.log('[Notifications] Cannot subscribe - not ready or not permitted')
      return null
    }

    if (!messaging) {
      console.log('[Notifications] FCM not supported on this platform')
      return null
    }

    try {
      // Get FCM registration token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: this.registration
      })

      if (token) {
        console.log('[Notifications] FCM registration token obtained:', token.substring(0, 20) + '...')
        this.fcmToken = token
        
        // Set up foreground message listener
        this.setupForegroundMessageListener()
        
        return token
      } else {
        console.log('[Notifications] No registration token available')
        return null
      }
    } catch (error) {
      console.error('[Notifications] FCM subscription failed:', error)
      return null
    }
  }

  /**
   * Setup listener for foreground messages (when app is open)
   */
  private setupForegroundMessageListener(): void {
    if (!messaging) return

    onMessage(messaging, (payload) => {
      console.log('[Notifications] Foreground message received:', payload)
      
      // Show notification even when app is in foreground
      if (payload.notification) {
        const notificationData: NotificationData = {
          title: payload.notification.title || 'Prompt Party',
          body: payload.notification.body || 'Something happened in your game!',
          gameId: payload.data?.gameId as GameId,
          playerId: payload.data?.playerId as PlayerId,
          type: (payload.data?.type as NotificationType) || 'turn'
        }
        
        this.showLocalNotification(notificationData)
      }
    })
  }

  /**
   * Get current FCM token
   */
  getFCMToken(): string | null {
    return this.fcmToken
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(data: NotificationData): Promise<void> {
    if (!this.isEnabled()) {
      console.log('[Notifications] Cannot show notification - permission not granted')
      return
    }

    try {
      // Create notification via service worker for consistency
      if (this.registration) {
        await this.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: `prompt-party-${data.type}`,
          requireInteraction: false,
          data: {
            gameId: data.gameId,
            type: data.type,
            url: data.url
          }
        })
        console.log('[Notifications] Local notification shown:', data.title)
      }
    } catch (error) {
      console.error('[Notifications] Failed to show local notification:', error)
    }
  }

  /**
   * Get user-friendly permission prompt message
   */
  getPermissionPromptMessage(context: NotificationType): string {
    switch (context) {
      case 'turn':
        return "Get notified when it's your turn! Never miss a game again."
      case 'reaction':
        return "Get notified when someone reacts to your images! Stay engaged with your friends."
      case 'game-complete':
        return "Get notified when games finish! See the final results."
      default:
        return "Enable notifications to stay updated on your games!"
    }
  }

  /**
   * Check if we should ask for permission (smart timing)
   */
  shouldRequestPermission(context: string): boolean {
    // Don't ask if already decided
    if (this.getPermissionStatus() !== 'default') {
      return false
    }

    // Only ask in positive contexts
    const positiveContexts = ['after-first-turn', 'after-game-complete', 'after-reaction']
    return positiveContexts.includes(context)
  }
}

/**
 * Global notification manager instance
 */
export const notificationManager = new NotificationManager()

/**
 * Utility functions for common notification scenarios
 */

/**
 * Initialize notifications on app startup
 */
export async function initializeNotifications(): Promise<boolean> {
  const success = await notificationManager.initialize()
  
  if (success) {
    // Try to get FCM token if permission already granted
    try {
      const token = await notificationManager.subscribeToPush()
      if (token) {
        // Store the token if we have a player context
        await storeFCMTokenForCurrentPlayer(token)
      }
    } catch (error) {
      console.error('[Notifications] Error during initialization:', error)
    }
  }
  
  return success
}

/**
 * Request permission at the right moment with context
 */
export async function requestNotificationPermission(context: NotificationType): Promise<boolean> {
  const permission = await notificationManager.requestPermission(context)
  
  if (permission === 'granted') {
    // Try to get and store FCM token
    try {
      const token = await notificationManager.subscribeToPush()
      if (token) {
        await storeFCMTokenForCurrentPlayer(token)
      }
    } catch (error) {
      console.error('[Notifications] Error getting FCM token after permission granted:', error)
    }
  }
  
  return permission === 'granted'
}

/**
 * Store FCM token for the current player using Firebase Functions
 */
async function storeFCMTokenForCurrentPlayer(fcmToken: string): Promise<void> {
  try {
    // Get current player ID from session storage or current game context
    const currentPlayerId = getCurrentPlayerIdFromContext()
    
    if (!currentPlayerId) {
      // Store token locally for when player joins a game
      localStorage.setItem('pendingFCMToken', fcmToken)
      return
    }

    // Store the token directly in Firebase Realtime Database
    const tokenRef = ref(database, `/players/${currentPlayerId}/fcmToken`)
    await set(tokenRef, fcmToken)
    
    // Clear any pending token
    localStorage.removeItem('pendingFCMToken')
    
  } catch (error) {
    console.error('[Notifications] Error storing FCM token:', error)
    console.error('[Notifications] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      details: (error as any)?.details
    })
    // Store token locally as backup
    localStorage.setItem('pendingFCMToken', fcmToken)
  }
}

/**
 * Get current player ID from various possible sources
 */
function getCurrentPlayerIdFromContext(): string | null {
  // Try to get from global context first
  const globalContext = (window as any).promptPartyContext
  if (globalContext?.currentPlayerId) {
    return globalContext.currentPlayerId
  }
  
  // Try to get from URL parameters (for active games)
  const urlParams = new URLSearchParams(window.location.search)
  const gameParam = urlParams.get('game')
  if (gameParam) {
    // Extract player ID from game URL if available
    const storedPlayerId = sessionStorage.getItem(`playerId_${gameParam}`)
    if (storedPlayerId) {
      return storedPlayerId
    }
  }
  
  // Check if there's a general current player ID in session storage
  const generalPlayerId = sessionStorage.getItem('currentPlayerId')
  if (generalPlayerId) {
    return generalPlayerId
  }
  
  return null
}

/**
 * Store FCM token for a specific player (called when player joins game)
 */
export async function storeFCMTokenForPlayer(playerId: PlayerId, fcmToken?: string): Promise<void> {
  const tokenToStore = fcmToken || notificationManager.getFCMToken() || localStorage.getItem('pendingFCMToken')
  
  if (!tokenToStore) {
    console.log('[Notifications] No FCM token available for player:', playerId)
    return
  }
  
  try {
    // Store the token directly in Firebase Realtime Database
    const tokenRef = ref(database, `/players/${playerId}/fcmToken`)
    await set(tokenRef, tokenToStore)
    
    // Clear pending token and store current player context
    localStorage.removeItem('pendingFCMToken')
    sessionStorage.setItem('currentPlayerId', playerId)
    
    // Update global context
    if (typeof window !== 'undefined') {
      (window as any).promptPartyContext = {
        ...(window as any).promptPartyContext,
        currentPlayerId: playerId
      }
    }
    
  } catch (error) {
    console.error('[Notifications] Error storing FCM token for player:', error)
    console.error('[Notifications] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      details: (error as any)?.details
    })
  }
}

/**
 * Show a turn notification (for testing)
 */
export async function showTurnNotification(gameId: GameId, playerName?: string): Promise<void> {
  const data: NotificationData = {
    title: 'Your Turn!',
    body: playerName 
      ? `${playerName}, it's your turn in Prompt Party!`
      : "It's your turn in Prompt Party! Add to the story...",
    gameId,
    type: 'turn',
    url: `/game/${gameId}`
  }

  await notificationManager.showLocalNotification(data)
}

/**
 * Show a reaction notification (for testing)
 */
export async function showReactionNotification(
  gameId: GameId, 
  reactorName: string, 
  emoji: string
): Promise<void> {
  const data: NotificationData = {
    title: 'New Reaction!',
    body: `${reactorName} ${emoji} reacted to your image!`,
    gameId,
    type: 'reaction',
    url: `/game/${gameId}`
  }

  await notificationManager.showLocalNotification(data)
}

/**
 * Check notification support for feature detection
 */
export function isNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}
