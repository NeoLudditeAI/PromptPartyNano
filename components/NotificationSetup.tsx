// components/NotificationSetup.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { initializeNotifications, requestNotificationPermission, notificationManager, NotificationType, isNotificationSupported } from '../lib/notifications'

interface NotificationSetupProps {
  trigger?: 'app-start' | 'after-first-turn' | 'after-reaction' | 'manual'
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export default function NotificationSetup({ 
  trigger = 'app-start',
  onPermissionGranted,
  onPermissionDenied
}: NotificationSetupProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default')

  // Initialize notifications on component mount
  useEffect(() => {
    const initialize = async () => {
      if (!isNotificationSupported()) {
        console.log('[NotificationSetup] Notifications not supported')
        return
      }

      const success = await initializeNotifications()
      setIsInitialized(success)
      
      if (success) {
        const status = notificationManager.getPermissionStatus()
        setPermissionStatus(status)
        
        // Show prompt based on trigger and permission status
        if (trigger === 'app-start' && status === 'default') {
          // For testing, show prompt after a short delay
          console.log('[NotificationSetup] Notifications ready, showing prompt for testing')
          setTimeout(() => setShowPrompt(true), 2000)
        }
      }
    }

    initialize()
  }, [trigger])

  // Handle permission request
  const handleRequestPermission = async (context: NotificationType = 'turn') => {
    if (!isInitialized) {
      console.log('[NotificationSetup] Not initialized yet')
      return
    }

    const granted = await requestNotificationPermission(context)
    setPermissionStatus(granted ? 'granted' : 'denied')
    setShowPrompt(false)

    // Call callbacks
    if (granted && onPermissionGranted) {
      onPermissionGranted()
    } else if (!granted && onPermissionDenied) {
      onPermissionDenied()
    }
  }

  // Show permission prompt for specific triggers
  const triggerPermissionPrompt = (context: NotificationType = 'turn') => {
    if (permissionStatus === 'default' && isInitialized) {
      setShowPrompt(true)
    }
  }

  // Expose trigger function for parent components
  useEffect(() => {
    // Attach trigger function to window for easy access
    (window as any).promptPartyNotifications = {
      requestPermission: triggerPermissionPrompt,
      isEnabled: () => permissionStatus === 'granted',
      isSupported: () => isNotificationSupported()
    }
  }, [permissionStatus, isInitialized])

  // Don't render if notifications aren't supported
  if (!isNotificationSupported()) {
    return null
  }

  // Don't render if already granted or denied
  if (permissionStatus !== 'default' || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-full">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15h5v5l-5-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 4h5l-5 5V4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9h5V4L4 9z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Stay in the Game!
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get notified when it's your turn so you never miss the fun.
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleRequestPermission('turn')}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss notification prompt"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper hook for triggering permission requests
export function useNotificationTrigger() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkReady = () => {
      const notifications = (window as any).promptPartyNotifications
      if (notifications) {
        setIsReady(true)
      }
    }

    checkReady()
    // Check periodically until ready
    const interval = setInterval(checkReady, 100)
    
    return () => clearInterval(interval)
  }, [])

  const triggerPermissionRequest = (context: NotificationType = 'turn') => {
    const notifications = (window as any).promptPartyNotifications
    if (notifications && notifications.requestPermission) {
      notifications.requestPermission(context)
    }
  }

  const isEnabled = (): boolean => {
    const notifications = (window as any).promptPartyNotifications
    return notifications ? notifications.isEnabled() : false
  }

  const isSupported = (): boolean => {
    const notifications = (window as any).promptPartyNotifications
    return notifications ? notifications.isSupported() : false
  }

  return {
    isReady,
    triggerPermissionRequest,
    isEnabled,
    isSupported
  }
}
