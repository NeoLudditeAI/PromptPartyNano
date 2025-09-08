// lib/reaction-constants.ts

// Centralized emoji configuration for the reaction system
export const REACTION_EMOJIS = ['❤️', '😂', '🔥', '✨', '🎨'] as const

// Type for emoji strings
export type ReactionEmoji = typeof REACTION_EMOJIS[number]

// Helper function to create empty reaction state for all emojis
export function createEmptyReactions(): Record<string, number> {
  return Object.fromEntries(REACTION_EMOJIS.map(emoji => [emoji, 0]))
}

// Helper function to create empty user reaction state for all emojis
export function createEmptyUserReactions(): Record<string, boolean> {
  return Object.fromEntries(REACTION_EMOJIS.map(emoji => [emoji, false]))
}

// Helper function to get reactions for all emojis from image data
export function getReactionsFromImage(imageData: any): Record<string, number> {
  const reactions = imageData?.reactions || {}
  return Object.fromEntries(REACTION_EMOJIS.map(emoji => [emoji, reactions[emoji] || 0]))
}

// Helper function to get user reaction state for all emojis from image data
export function getUserReactionsFromImage(imageData: any, currentPlayerId: string): Record<string, boolean> {
  const reactionUsers = imageData?.reactionUsers || {}
  return Object.fromEntries(REACTION_EMOJIS.map(emoji => [emoji, (reactionUsers[emoji] || []).includes(currentPlayerId)]))
}
