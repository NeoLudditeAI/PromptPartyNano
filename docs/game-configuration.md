# 🎮 Game Configuration System

This document explains how to use the flexible game configuration system for experimenting with different game mechanics.

## 🎯 **Overview**

The game configuration system allows you to easily experiment with different game mechanics without changing code. All game parameters are centralized and configurable.

## 📋 **Configuration Options**

### **Turn Management**
- `TURNS_PER_GAME`: Total turns allowed per game (default: 6)
- `MIN_PLAYERS`: Minimum players required to start (default: 2)
- `MAX_PLAYERS`: Maximum players allowed (default: 6)

### **Character Limits**
- `MAX_TURN_LENGTH`: Maximum characters per turn (default: 25)
- `MAX_TOTAL_LENGTH`: Maximum total prompt length (default: 1000)
- `WARNING_THRESHOLD`: Show warning at this character count (default: 20)

### **Game Flow**
- `AUTO_START_ON_FULL`: Auto-start when max players reached (default: false)
- `ALLOW_MID_GAME_JOINS`: Allow players to join after start (default: false)

### **Image Generation**
- `GENERATE_IMAGE_EVERY_TURN`: Generate image after each turn (default: true)
- `IMAGE_HISTORY_ENABLED`: Store all generated images (default: true)

### **Session Management**
- `SESSION_TIMEOUT_MS`: Session timeout in milliseconds (default: 30 minutes)
- `MAX_SESSIONS_PER_PLAYER`: Max sessions per player per game (default: 1)

### **Performance**
- `DEBOUNCE_DELAY_MS`: Debounce Firebase updates (default: 500ms)
- `MAX_CONCURRENT_UPDATES`: Max concurrent Firebase updates (default: 3)

## 🎲 **Game Presets**

### **QUICK** (Fast-paced)
```typescript
{
  TURNS_PER_GAME: 4,
  MAX_TURN_LENGTH: 20,
  AUTO_START_ON_FULL: true,
}
```

### **STANDARD** (Balanced)
```typescript
{
  TURNS_PER_GAME: 6,
  MAX_TURN_LENGTH: 25,
  AUTO_START_ON_FULL: false,
}
```

### **EXTENDED** (More turns, longer prompts)
```typescript
{
  TURNS_PER_GAME: 10,
  MAX_TURN_LENGTH: 30,
  MAX_TOTAL_LENGTH: 1500,
  AUTO_START_ON_FULL: false,
}
```

### **EXPERIMENTAL** (Testing new mechanics)
```typescript
{
  TURNS_PER_GAME: 8,
  MAX_TURN_LENGTH: 35,
  MAX_TOTAL_LENGTH: 2000,
  ALLOW_MID_GAME_JOINS: true,
  GENERATE_IMAGE_EVERY_TURN: false,
}
```

## 🔧 **Usage Examples**

### **Using a Preset**
```typescript
import { getGameConfig } from './lib/game-config'
import { createGame } from './lib/game'

// Create a quick game
const quickConfig = getGameConfig('QUICK')
const game = createGame('alice', quickConfig)

// Create an extended game
const extendedConfig = getGameConfig('EXTENDED')
const game = createGame('alice', extendedConfig)
```

### **Creating Custom Configuration**
```typescript
import { createCustomGameConfig } from './lib/game-config'

// Custom configuration for testing
const customConfig = createCustomGameConfig({
  TURNS_PER_GAME: 12,
  MAX_TURN_LENGTH: 40,
  AUTO_START_ON_FULL: true,
  ALLOW_MID_GAME_JOINS: true
})

const game = createGame('alice', customConfig)
```

### **Validating Configuration**
```typescript
import { validateGameConfig } from './lib/game-config'

const config = createCustomGameConfig({
  TURNS_PER_GAME: 15,
  MIN_PLAYERS: 3
})

const validation = validateGameConfig(config)
if (!validation.isValid) {
  console.error('Invalid config:', validation.errors)
}
```

### **Getting Configuration Summary**
```typescript
import { getConfigSummary } from './lib/game-config'

const config = getGameConfig('EXTENDED')
const summary = getConfigSummary(config)
// Returns: "10 turns, 2-6 players, 30 chars/turn"
```

### **Calculating Turns Per Player**
```typescript
import { calculateTurnsPerPlayer } from './lib/game-config'

const config = getGameConfig('STANDARD')
const turnsPerPlayer = calculateTurnsPerPlayer(config, 3)
// Returns: 2 (6 turns / 3 players = 2 each)
```

## 🧪 **Experimentation Guidelines**

### **Safe Experiments**
- Change `TURNS_PER_GAME` (1-20)
- Change `MAX_TURN_LENGTH` (10-50)
- Change `MAX_TOTAL_LENGTH` (500-3000)
- Toggle `AUTO_START_ON_FULL`

### **Advanced Experiments**
- Enable `ALLOW_MID_GAME_JOINS`
- Disable `GENERATE_IMAGE_EVERY_TURN`
- Increase `MAX_PLAYERS` beyond 6
- Modify `SESSION_TIMEOUT_MS`

### **Validation Rules**
- `TURNS_PER_GAME` must be ≥ 1
- `MIN_PLAYERS` must be ≥ 1
- `MAX_PLAYERS` must be ≥ `MIN_PLAYERS`
- `MAX_TURN_LENGTH` must be ≥ 1
- `MAX_TOTAL_LENGTH` must be ≥ `MAX_TURN_LENGTH`
- `WARNING_THRESHOLD` must be < `MAX_TURN_LENGTH`

## 🔄 **Migration from Hard-coded Values**

### **Before (Hard-coded)**
```typescript
const maxTurns = 6
const maxTurnLength = 25
const minPlayers = 2
```

### **After (Configurable)**
```typescript
const config = getGameConfig('STANDARD')
const maxTurns = config.TURNS_PER_GAME
const maxTurnLength = config.MAX_TURN_LENGTH
const minPlayers = config.MIN_PLAYERS
```

## 📊 **Configuration Impact Analysis**

### **Turn Count Impact**
- **4 turns**: Quick games, good for testing
- **6 turns**: Standard experience, balanced
- **8-10 turns**: Extended games, more creative time
- **12+ turns**: Long-form games, deep collaboration

### **Character Limit Impact**
- **20 chars**: Quick, punchy additions
- **25 chars**: Standard, balanced creativity
- **30-35 chars**: Extended descriptions
- **40+ chars**: Detailed, narrative additions

### **Player Count Impact**
- **2-3 players**: Intimate, focused collaboration
- **4-6 players**: Social, diverse perspectives
- **6+ players**: Large group dynamics

## 🚀 **Future Extensibility**

The configuration system is designed to easily accommodate new features:

### **Adding New Configuration Options**
1. Add to `GAME_CONFIG` in `types/index.ts`
2. Update `GameConfig` type
3. Add validation rules in `validateGameConfig()`
4. Update presets if needed
5. Add tests in `game-config.test.ts`

### **Example: Adding Time Limits**
```typescript
// In types/index.ts
export const GAME_CONFIG = {
  // ... existing config
  TURN_TIME_LIMIT_MS: 60000, // 1 minute per turn
  GAME_TIME_LIMIT_MS: 300000, // 5 minutes total
} as const
```

## 🧪 **Testing Different Configurations**

### **Quick Testing**
```typescript
// Test a 4-turn game
const quickGame = createGame('alice', getGameConfig('QUICK'))
```

### **A/B Testing**
```typescript
// Compare different turn counts
const gameA = createGame('alice', createCustomGameConfig({ TURNS_PER_GAME: 4 }))
const gameB = createGame('alice', createCustomGameConfig({ TURNS_PER_GAME: 8 }))
```

### **Performance Testing**
```typescript
// Test with high limits
const stressTest = createCustomGameConfig({
  TURNS_PER_GAME: 20,
  MAX_TURN_LENGTH: 100,
  MAX_TOTAL_LENGTH: 5000
})
```

## 📝 **Best Practices**

1. **Always validate configurations** before using them
2. **Use presets** for common scenarios
3. **Test edge cases** with custom configurations
4. **Document experimental configurations** for team reference
5. **Monitor performance** when using high limits
6. **Version control** configuration changes for reproducibility

## 🔍 **Debugging Configuration Issues**

### **Common Issues**
- Invalid turn counts (must be ≥ 1)
- Character limits too low/high
- Player limits inconsistent
- Performance issues with high limits

### **Debugging Tools**
```typescript
import { validateGameConfig, getConfigSummary } from './lib/game-config'

// Validate before use
const validation = validateGameConfig(config)
if (!validation.isValid) {
  console.error('Config errors:', validation.errors)
}

// Get human-readable summary
console.log('Config:', getConfigSummary(config))
```

This configuration system ensures you can experiment freely without "painting yourself into a corner" and maintains flexibility for future game mechanic evolution. 