# 🕹️ Prompt Party – Game Logic Specification

This file defines the core game mechanics for Prompt Party. These functions operate purely on in-memory data and should be tested exhaustively. They are side-effect free unless otherwise noted.

---

## Overview

A Game progresses through turn-based contributions by a fixed set of players. Each player appends text to an evolving prompt. After each turn, an updated prompt is generated and submitted to DALL·E.

---

## ✅ `createGame(players: PlayerId[]): Game`

Initializes a new game with the given players.

- Assigns a random UUID as `id`
- Clones the input `players` array to preserve order
- Sets `status: 'in_progress'`
- Sets `currentPlayerIndex = 0`
- Initializes an empty `turns` array
- Adds `createdAt` (epoch ms timestamp)
- `latestImageUrl` is `undefined` on creation — added later after DALL·E generation

Returns: a complete `Game` object

---

## ✅ `getCurrentPlayer(game: Game): PlayerId`

- Returns the `PlayerId` of the player whose turn is next
- Determined by `game.currentPlayerIndex`

---

## ✅ `addTurn(game: Game, userId: PlayerId, text: string): Game`

- Validates that it *is* `userId`’s turn (throws if not)
- Appends a new `PromptTurn` to `game.turns`
- Advances `currentPlayerIndex` (loops if needed)
- Returns updated `Game`

---

## ✅ `buildFullPrompt(turns: PromptTurn[]): string`

- Concatenates all `turn.text` fields into one space-separated prompt
- Trimmed and sanitized (e.g., no double spaces)

Returns: `string`

---

## ✅ `isGameComplete(game: Game): boolean`

- MVP Rule: Game ends when each player has had `N` turns (TBD)
- Returns `true` if done, otherwise `false`

---

## 🔮 Future (Not in MVP)

- Voting on turns
- Multiple rounds per game
- Public prompt gallery
- User-submitted DALL·E parameters (style, mood)

---

## Notes

- These functions are pure — they never call Firebase or DALL·E directly
- Logic tests must be written for all functions
- Cursor must reference this file before editing `game.ts`
- `latestImageUrl` is a transient field used to store the most recent DALL·E result
