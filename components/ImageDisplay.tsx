// components/ImageDisplay.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Game, PlayerId } from '../types'
import { getLatestImageUrl, getImageCount, buildFullPrompt } from '../lib/game'

interface ImageDisplayProps {
  game: Game
  currentPlayerId: PlayerId
}

export default function ImageDisplay({ game, currentPlayerId }: ImageDisplayProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const imageCount = getImageCount(game)
  const fullPrompt = buildFullPrompt(game.turns)

  // Create a combined image list that includes seed image if it exists
  const getAllImages = () => {
    const images = []
    
    // Add seed image first if it exists and is not already in history
    if (game.seedImage && (!game.imageHistory.length || game.imageHistory[0].imageUrl !== game.seedImage)) {
      images.push({
        id: 'seed-image',
        imageUrl: game.seedImage,
        prompt: game.seedImagePrompt || 'Starting image',
        createdAt: Date.now(),
        reactions: {},
        reactionUsers: {}
      })
    }
    
    // Add all images from history
    images.push(...game.imageHistory)
    
    return images
  }

  // Helper function to check if an image is the seed image
  const isSeedImage = (image: any) => {
    return image.id === 'seed-image' || image.imageUrl === game.seedImage
  }

  const allImages = getAllImages()
  const totalImageCount = allImages.length

  // Auto-show latest image when new images are added
  useEffect(() => {
    if (totalImageCount > 0) {
      // Always show the latest image (last in the array)
      setCurrentImageIndex(totalImageCount - 1)
    }
  }, [totalImageCount, game.imageHistory.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (totalImageCount <= 1) return
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentImageIndex, totalImageCount])

  // If no images at all, show empty state
  if (totalImageCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🎨 Generated Image
          </h3>
        </div>
        
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🎨</div>
            <p className="font-medium">No image yet</p>
            <p className="text-sm">Add to the prompt to generate an image!</p>
          </div>
        </div>
        
        {/* Image Info */}
        <div className="mt-4 text-sm text-gray-600">
          <p>Images are generated using Google Gemini 2.5 Flash Image Preview</p>
          <p>Each turn edits the previous image based on player commands</p>
        </div>
      </div>
    )
  }

  const currentImage = allImages[currentImageIndex]
  const isFirst = currentImageIndex === 0
  const isLast = currentImageIndex === totalImageCount - 1

  const goToPrevious = () => {
    if (!isFirst) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const goToNext = () => {
    if (!isLast) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Get reactions data for current image
  const getCurrentImageReactions = (): { 
    reactions: Record<string, number>; 
    userHasReacted: Record<string, boolean>; 
  } => {
    if (!currentImage?.id) {
      return { reactions: { '❤️': 0, '😍': 0, '🎨': 0 }, userHasReacted: { '❤️': false, '😍': false, '🎨': false } }
    }
    
    const reactions = (currentImage.reactions || {}) as Record<string, number>
    const reactionUsers = (currentImage.reactionUsers || {}) as Record<string, string[]>
    
    return {
      reactions: {
        '❤️': (reactions as any)['❤️'] || 0,
        '😍': (reactions as any)['😍'] || 0,
        '🎨': (reactions as any)['🎨'] || 0
      },
      userHasReacted: {
        '❤️': ((reactionUsers as any)['❤️'] || []).includes(currentPlayerId),
        '😍': ((reactionUsers as any)['😍'] || []).includes(currentPlayerId),
        '🎨': ((reactionUsers as any)['🎨'] || []).includes(currentPlayerId)
      }
    }
  }

  const { reactions: currentReactions, userHasReacted } = getCurrentImageReactions()

  // Handle reaction toggle for carousel images
  const handleReaction = async (emoji: string) => {
    if (!currentImage?.id) {
      console.log(`No image ID available for reaction: ${emoji}`)
      return
    }
    
    try {
      const hasReacted = userHasReacted[emoji]
      
      if (hasReacted) {
        // User has already reacted - remove the reaction (toggle off)
        const { removeReactionFromImage } = await import('../lib/firebase')
        await removeReactionFromImage(game.id, currentImage.id, emoji, currentPlayerId)
        console.log(`Reaction: ${emoji} removed from carousel image ${currentImage.id} by player ${currentPlayerId}`)
      } else {
        // User hasn't reacted - add the reaction (toggle on)
        const { addReactionToImage } = await import('../lib/firebase')
        await addReactionToImage(game.id, currentImage.id, emoji, currentPlayerId)
        console.log(`Reaction: ${emoji} added to carousel image ${currentImage.id} by player ${currentPlayerId}`)
      }
    } catch (error) {
      console.error('Error toggling reaction in carousel:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎨 Generated Image
        </h3>
        
        {totalImageCount > 1 && (
          <div className="text-sm text-gray-600">
            {currentImageIndex + 1} of {totalImageCount}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Main Image with Navigation */}
        <div className="relative">
          <img
            src={currentImage.imageUrl}
            alt={`AI Generated Image ${currentImageIndex + 1}`}
            className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
          />
          
          {/* Image Badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
            {isSeedImage(currentImage) ? 'Starting Image' : 'AI Generated'}
          </div>
          
          {/* Navigation Arrows - Only show if multiple images */}
          {totalImageCount > 1 && (
            <>
              {/* Left Arrow */}
              {!isFirst && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {/* Right Arrow */}
              {!isLast && (
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Reaction Buttons - Positioned below the image */}
        {currentImage?.id && (
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-full px-4 py-2 flex space-x-3 border border-gray-200">
              {['❤️', '😍', '🎨'].map(emoji => {
                const hasReacted = userHasReacted[emoji]
                const count = currentReactions[emoji]
                
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      hasReacted 
                        ? 'bg-blue-100 border border-blue-300' // Highlighted when user has reacted
                        : 'bg-white border border-gray-300 hover:border-gray-400' // Normal state
                    }`}
                    aria-label={`${hasReacted ? 'Remove' : 'Add'} ${emoji} reaction. Current count: ${count}`}
                  >
                    <span className="text-sm">{emoji}</span>
                    {count > 0 && (
                      <span className="text-xs text-gray-700 font-semibold -mt-0.5">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Image Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {isSeedImage(currentImage) ? 'Starting image' : 'Generated from'}: <span className="text-gray-900 font-medium">
              "{currentImage.prompt}"
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isSeedImage(currentImage) ? 'Ready for collaborative editing!' : formatDate(currentImage.createdAt)}
          </p>
        </div>
      </div>
      
      {/* Thumbnail Navigation - Only show if multiple images */}
      {totalImageCount > 1 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900 mb-2">All Images:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.map((image, index) => {
              // Calculate total reactions for this image
              const imageReactions = image.reactions || {}
              const totalReactions = Object.values(imageReactions).reduce((sum: number, count: any) => sum + (count || 0), 0)
              
              return (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded border-2 transition-colors ${
                    index === currentImageIndex
                      ? 'border-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-label={`Go to image ${index + 1}${totalReactions > 0 ? `. ${totalReactions} reactions` : ''}`}
                >
                  <img
                    src={image.imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  
                  {/* Reaction Count Badge */}
                  {totalReactions > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {totalReactions}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Image Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>Powered by Google Gemini 2.5 Flash - maintaining image consistency across edits</p>
        <p>Each edit builds on the previous version, preserving the subject while making changes</p>
        {totalImageCount > 1 && (
          <p className="text-blue-600 font-medium mt-1">
            Use the arrows, keyboard (← →), or thumbnails to browse all {totalImageCount} images
          </p>
        )}
      </div>
    </div>
  )
} 