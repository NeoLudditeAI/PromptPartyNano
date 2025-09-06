# 🎭 Reaction System Architecture

This document defines the reaction system design for Prompt Party - capturing emotional moments during image reveals.

---

## 📌 Overview

The reaction system allows players to express immediate emotional responses to generated images through emoji reactions. It integrates seamlessly with the existing image overlay to capture the peak emotional moment when new images are revealed.

## 🎯 Design Goals

- **Instant emotional expression** - React during the moment of image reveal
- **Low friction UX** - One-tap emoji reactions, thumb-accessible on mobile
- **Asynchronous social feedback** - Like WhatsApp reactions, not real-time pressure
- **Future-ready attribution** - Architecture supports "who reacted" features later
- **Zero breaking changes** - All reaction features are additive and optional

## 🏗️ Architecture Phases

### Phase 0: Static Buttons ✅ (CURRENT)
- 3 hardcoded emoji buttons (❤️, 😍, 🎨) in new image overlay
- Console.log click handlers for UX validation
- Zero Firebase changes, zero type changes
- Perfect thumb accessibility at bottom of image

### Phase 1: Local State (NEXT)
- Local useState for reaction counts per image
- Visual feedback with count display
- No persistence - validates UI before Firebase integration

### Phase 2: Firebase Persistence
- Store anonymous reaction counts in `imageHistory[].reactions`
- Real-time sync via existing `subscribeToGame()` infrastructure
- Simple increment/decrement operations

### Phase 3: Attribution (Future)
- Add `reactionUsers` tracking who reacted
- "Alice reacted ❤️" notifications
- Reaction history and analytics

## 🎨 UX Integration

### Primary Location: New Image Overlay
The reaction system integrates into the existing dramatic image reveal moment:

```
Player submits turn → Generating overlay → 
🎉 NEW IMAGE OVERLAY with reactions ← Peak emotional moment
→ Dismiss → Back to game board
```

### Mobile-First Design
- **Thumb zone positioning** - Reaction bar at bottom of image
- **Large touch targets** - 48px buttons for easy tapping
- **Visual feedback** - Hover effects, scale animations
- **Backdrop blur** - Semi-transparent overlay doesn't obstruct image
- **Accessibility** - ARIA labels, keyboard navigation

## 🗂️ Data Architecture

### Current Types (No Changes)
```typescript
export type ImageGenerationResult = {
  prompt: string;
  imageUrl: string;
  createdAt: number;
  // Future: Optional reaction fields will be added here
}
```

### Future Type Extensions
```typescript
export type ImageGenerationResult = {
  prompt: string;
  imageUrl: string;
  createdAt: number;
  id?: string;                 // Unique ID for reaction targeting
  reactions?: {                // Anonymous counts (Phase 2)
    [emoji: string]: number;   // "❤️": 3, "😍": 1, "🎨": 7
  };
  reactionUsers?: {            // Attribution (Phase 3)
    [emoji: string]: PlayerId[];
  };
}
```

### Firebase Path Structure
```
games/{gameId}/
  imageHistory/
    [index]: {
      prompt: "...",
      imageUrl: "...",
      createdAt: 123456789,
      // Phase 2+:
      reactions: {
        "❤️": 3,
        "😍": 1,
        "🎨": 7
      }
    }
```

## 🔄 Real-time Synchronization

### Leveraging Existing Infrastructure
- **No new Firebase listeners** - Reactions sync via existing `subscribeToGame()`
- **Automatic real-time updates** - All players see reaction changes instantly
- **Minimal Firebase reads** - Piggybacks on proven game state subscription
- **Consistent with patterns** - Uses same real-time architecture as turn updates

### Benefits
- **Reliable** - Built on tested subscription system
- **Performant** - No additional Firebase connections
- **Maintainable** - Consistent with existing patterns
- **Cost-effective** - Minimal additional Firebase usage

## 🎮 User Experience Flow

### Reaction Moment
1. **Image generates** → Firebase updates `game.imageHistory`
2. **Overlay appears** → Dramatic full-screen reveal for all players
3. **Emotion peaks** → "Wow!" / "Hilarious!" / "Beautiful!" moment
4. **Instant reaction** → Tap emoji at bottom of image
5. **Visual feedback** → Button animation, count update (future)
6. **Social validation** → Other players see reaction (future)

### Interaction Patterns
- **Primary gesture** - Single tap on emoji
- **Prevention** - `e.stopPropagation()` prevents overlay dismissal
- **Accessibility** - Keyboard navigation, screen reader support
- **Error handling** - Graceful degradation if reactions fail

## 🔧 Configuration Integration

### Future Configuration Options
```typescript
// Add to GAME_CONFIG for experimentation
REACTIONS_ENABLED: true,              // Feature flag
REACTION_EMOJI: ['❤️', '😍', '🎨'],   // Customizable emoji set
MAX_REACTIONS_PER_USER: 1,           // Spam prevention
REACTION_COOLDOWN_MS: 1000,          // Rate limiting
SHOW_REACTION_COUNTS: true,          // Anonymous vs full attribution
```

### Game Mode Variations
- **Quick games** - Only ❤️ reaction for speed
- **Art games** - Extended emoji set (🎨, 🌟, 🔥, 💎)
- **Funny games** - Humor-focused reactions (😂, 🤣, 😆)
- **Experimental** - Multiple reactions per user, animated emojis

## 🧪 Testing Strategy

### Phase 0 Testing
- **Manual UX validation** - Buttons render, clicks work, thumb accessibility
- **No automated tests** - Static implementation, console.log validation
- **Vercel deployment** - Immediate production testing

### Future Testing
- **Component tests** - ReactionBar rendering, click handlers
- **Integration tests** - Firebase reaction CRUD operations
- **E2E tests** - Full reaction flow from click to real-time sync
- **Performance tests** - Reaction system under load

## 🚀 Deployment Strategy

### Immediate: Phase 0
- Deploy static buttons to validate UX integration
- Get user feedback on positioning, accessibility
- Confirm technical integration works correctly

### Iterative Expansion
- Each phase deployed independently
- Feature flags for gradual rollout
- A/B testing for optimal emoji sets
- Performance monitoring at each phase

## 🔮 Future Expandability

### Enhanced Interactions
- **Gesture reactions** - Long press, swipe patterns
- **Audio reactions** - Sound feedback for PWA
- **Animated reactions** - Floating emojis, particle effects
- **Voice reactions** - "React with love" voice commands

### Social Features
- **Reaction notifications** - Push alerts for image reactions
- **Reaction leaderboards** - Most loved images, reactive players
- **Cross-game reactions** - React to images from completed games
- **Reaction analytics** - Personal reaction style insights

### Technical Evolution
- **Reaction heat maps** - Visual areas that get most reactions
- **Advanced attribution** - Reaction timing, intensity, context
- **Multi-platform** - Native mobile gestures, Apple Watch reactions
- **AI insights** - Reaction pattern analysis, emoji suggestions

---

## Notes

- **Mobile-first** - All design decisions prioritize mobile/touch experience
- **Zero breaking changes** - All reaction features are optional and additive
- **Performance conscious** - Leverages existing infrastructure, minimal overhead
- **Configurable** - Fits into existing game configuration system for experimentation
- **Social at core** - Designed to enhance the asynchronous social experience that defines Prompt Party
