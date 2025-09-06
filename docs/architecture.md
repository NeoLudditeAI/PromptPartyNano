# 🏗️ Prompt Party: Nano Banana Edit Mode – Architecture Overview

This document outlines key relationships, data shapes, and system flow for the Nano Banana Edit Mode. It helps maintain coherence between Firebase data, frontend components, and Gemini integration logic.

---

## 🧠 Core Data Model

### Game Object (stored in Firebase)

```ts
{
  id: string;
  players: string[];         // Ordered player IDs
  edits: ImageEdit[];        // Each edit includes playerId, text, and optional ref
  createdAt: number;
  currentImageUrl: string;   // Latest edited image
  currentPlayerIndex: number;
  startImageUrl?: string;    // Original uploaded/generated image
  startPrompt?: string;      // Original text prompt if generated
  featureBadges: FeatureBadge[]; // Auto-detected capabilities used
}
```

### ImageEdit Object

```ts
{
  id: string;
  text: string;              // The ≤25-char edit command
  playerId: string;
  timestamp: number;
  referenceImageUrl?: string; // Optional reference for fusion
  expandedPrompt: string;    // Server-expanded version of the edit
  featureBadges: FeatureBadge[]; // Capabilities used in this edit
}
```

### FeatureBadge Object

```ts
{
  type: 'edit' | 'fusion' | 'text' | 'consistency' | 'verified';
  description: string;
  verified: boolean;
}
```

- `edits` array is append-only
- Each edit builds on the previous image (iterative editing)
- `featureBadges` track Nano Banana capabilities demonstrated
- `expandedPrompt` contains the server-processed version of the ≤25-char edit

---

## 🔁 Game Loop

1. **Start**: Player 1 uploads image OR generates from rich text prompt
2. **Turn**: Player N views current image + edit history
3. **Edit**: Player submits ≤25-char edit command + optional reference image
4. **Process**: Server expands edit into structured Gemini instruction
5. **Generate**: Call Gemini 2.5 Flash Image Preview with edit instruction
6. **Analyze**: Detect feature badges (Edit, Fusion, Text, Consistency, Verified)
7. **Update**: Firebase stores new edit + updated image + badges
8. **Reveal**: Next player sees updated image with feature badges

---

## 🧩 Component Flow

- `/app/page.tsx`: Home and routing logic
- `EditGamePage.tsx`: Main game UI (image + edit history + input)
- `ImageEditor.tsx`: Displays current image with feature badges
- `EditInput.tsx`: Input for ≤25-char edits + reference upload
- `FeatureBadges.tsx`: Shows detected Nano Banana capabilities
- `EditHistory.tsx`: Scrollable list of past edits
- `StartImageUpload.tsx`: Initial image upload/generation
- `ReferenceUpload.tsx`: Optional reference image for fusion

---

## 🧠 Logic Layer

- `/lib/firebase.ts` — handles game creation, edit submission, subscriptions
- `/lib/gemini.ts` — builds structured instructions + calls Gemini API
- `/lib/game.ts` — owns core turn-taking logic (validations, updates)
- `/lib/feature-detection.ts` — analyzes edits for capability badges
- `/lib/image-processing.ts` — handles uploads, resizing, format conversion

---

## 🍌 Nano Banana Integration

### Structured Edit Instructions

Each ≤25-char edit is expanded into a structured instruction:

```ts
const baseInstruction = "Edit the provided image. Preserve the main subject if present. Apply the change succinctly; keep lighting/shadows consistent. Avoid unintended alterations.";

const expandedEdit = expandUserEdit(userEdit, referenceImage);
// Example: "rm coffee mug + hat" → "Remove the coffee mug on the desk; add a hat on the person's head"
```

### Feature Detection

- **Edit**: Any text-and-image call
- **Fusion**: Reference image present
- **Text**: Headline/caption used (OCR verification)
- **Consistency**: Subject similarity maintained
- **Verified**: SynthID watermark detected

### Multi-turn Editing

- Use previous output as input for next edit
- Maintain edit chain for full prompt reconstruction
- Track feature usage across all edits

---

## 🔐 Security / Scaling

Firebase rules ensure:
- Only the current player may submit an edit
- Games can only be read/written by participants
- Reference images are properly validated

Modular Firebase paths:
- `/games/{gameId}/edits`
- `/games/{gameId}/images`
- `/users/{userId}/games`

---

## 📦 Dev Practices

- All types live in `/types/index.ts`
- Game logic is abstracted and testable
- Component props are strictly typed
- Never access Firebase directly from components
- **Focus on showcasing Nano Banana capabilities** in every interaction