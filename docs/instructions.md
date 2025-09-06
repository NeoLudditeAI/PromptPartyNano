# 🍌 Prompt Party: Nano Banana Edit Mode – Project Instructions

This document defines what Prompt Party: Nano Banana Edit Mode is, how it should be built, and what rules Cursor must follow. It exists to keep development focused, modular, and aligned with the project's actual purpose.

---

## 📌 What Is Prompt Party: Nano Banana Edit Mode?

Prompt Party: Nano Banana Edit Mode is a turn-based, collaborative image editing game powered by Google's Gemini 2.5 Flash Image Preview (Nano Banana). Players take turns making small edits to an evolving image, showcasing the advanced capabilities of iterative AI image editing.

**Core Flow:**
- **Start**: Player 1 either uploads a photo or generates from a rich text prompt
- **Turns**: Each player submits ≤25-character edits (e.g., "rm coffee mug + hat", "swap to neon alley")
- **Optional**: Attach reference images for style transfer/fusion
- **Reveal**: Show updated image with feature badges (Edit, Fusion, Text, Consistency, Verified)
- **End**: Download/share final image with edit chain

**Key Features:**
- Iterative image editing (multi-turn chat-style editing)
- Multi-image fusion and style transfer
- High-fidelity text rendering
- SynthID watermark verification
- Feature badges showcasing Nano Banana capabilities

---

## ⚙️ Tech Stack

| Layer      | Tool / Library                    |
|------------|-----------------------------------|
| Frontend   | Next.js (App Router)              |
| Styling    | Tailwind CSS                      |
| Backend    | Firebase Realtime DB              |
| AI Gen     | Google Gemini 2.5 Flash Image Preview |
| Hosting    | Vercel                            |

---

## 🧱 Folder Structure

| Folder         | Purpose                            |
|----------------|------------------------------------|
| `/app`         | Next.js routes (pages)             |
| `/components`  | React UI components                |
| `/lib`         | Logic: Firebase, Gemini, gameplay  |
| `/types`       | Global TypeScript interfaces       |
| `/docs`        | Project docs (Obsidian vault)      |
| `/.cursorrules`| Cursor rule configuration          |

---

## 🎯 Development Standards

- Always use **strict TypeScript**
- Avoid `any`; if necessary, explain why in a comment
- Keep logic (Firebase, game flow, Gemini) separate from UI
- Never hard-code Firebase paths — use helper functions
- UI components must be small, clear, and composable
- Use async/await; never use chained `.then()`

## Development Philosophy

This project is built with a focus on clarity, maintainability, and AI-aligned development, specifically showcasing the unique capabilities of Google's Nano Banana model.

All code changes must be accompanied by:

- ✅ Inline comments that explain reasoning, not just behavior
- ✅ A `.md` document in the `/lib/` or `/docs/` folder explaining module design
- ✅ At least one test file or inline test logic
- ✅ An update to `ProgressLog.md` with a summary of the change and date

These practices ensure that AI collaborators like Cursor can reason about the system autonomously and that future contributors understand design decisions quickly.

---

## 🤖 Cursor Requirements

Cursor must:

1. Read `docs/Instructions.md` and `docs/Roadmap.md` before any implementation
2. Only implement features marked `[planned]` or `[in progress]` in `Roadmap.md`
3. Log all code changes in `docs/ProgressLog.md` using the defined format
4. Ask for feedback if ambiguity exists
5. Never implement surprise features or guess logic that hasn't been defined
6. Help maintain consistency of type usage, naming, and documentation
7. **Focus on showcasing Nano Banana's unique capabilities** (iterative editing, fusion, text rendering, SynthID)

Cursor may:

- Propose better structure, naming, or logic if it also updates relevant docs
- Suggest ways to better highlight Nano Banana features for hackathon judges