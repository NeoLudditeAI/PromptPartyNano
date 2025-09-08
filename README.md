# 🍌 Prompt Party: Nano Banana Edit Mode 🧪

A collaborative image editing game powered by Google's Gemini 2.5 Flash Image Preview (Nano Banana). Players take turns making small edits to an evolving image, showcasing the advanced capabilities of iterative AI image editing.

## 🎮 How It Works

1. **Start**: Upload a photo or generate from a rich text prompt
2. **Edit**: Each player submits ≤45-character edit commands (e.g., "add neon sign", "make it colorful")
3. **React**: Express instant feedback with emoji reactions (❤️, 😍, 🎨, 🔥, 👏)
4. **Collaborate**: Real-time multiplayer editing with live updates
5. **Evolve**: Watch the image transform through collaborative creativity

## ✨ Key Features

- **Iterative Editing**: Multi-turn image editing that builds on previous results ✅
- **Real-time Collaboration**: Turn-based editing with live updates ✅
- **Image History**: Navigate through the creative journey ✅
- **Reaction System**: Emoji reactions on generated images ✅
- **High-fidelity Text**: Render readable text within images ✅
- **Multi-image Fusion**: Style transfer and composition with reference images (planned)
- **Feature Badges**: Visual indicators of Nano Banana capabilities used (planned)
- **SynthID Verification**: Google's watermark for AI-generated content (planned)

## 🍌 Nano Banana Capabilities Showcased

- **Text-to-Image**: Generate start images from rich descriptions ✅
- **Image-to-Image Editing**: Iterative modifications with ≤45-char commands ✅
- **Consistency**: Maintain visual coherence across edits ✅
- **High-fidelity Text Rendering**: Create readable text within images ✅
- **Multi-image Fusion**: Combine reference images for style transfer (planned)
- **SynthID**: Watermark verification for AI-generated content (planned)

## 🚀 Live Demo

**🎮 [Try Prompt Party Nano Now](https://prompt-party-nano.vercel.app/)**

Experience collaborative AI creativity in action! Create a game, invite friends, and watch your images evolve through real-time collaboration.

## 🏆 Hackathon Submission

This project is designed for the **Nano Banana 48 Hour Challenge** by Google DeepMind, showcasing the unique capabilities of Gemini 2.5 Flash Image Preview.

### 🎯 **Why This Wins**

1. **Unique Innovation**: First collaborative AI image editing platform
2. **Technical Excellence**: Real-time Firebase sync with Gemini integration
3. **Nano Banana Showcase**: Perfectly demonstrates iterative editing and text rendering
4. **Social Impact**: Transforms individual AI into collective creativity
5. **Production Ready**: Polished, deployable application

### 🎬 **Demo Scenarios**

- **Creative Teams**: Collaborative design and brainstorming
- **Education**: Interactive learning through visual storytelling
- **Art Collectives**: Artists collaborating on evolving pieces
- **Social Gaming**: Fun, accessible creative collaboration

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase Realtime Database
- **AI**: Google Gemini 2.5 Flash Image Preview
- **Hosting**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Google AI API key for Gemini 2.5 Flash Image Preview
- Firebase project for real-time collaboration

### Installation

```bash
git clone https://github.com/NeoLudditeAI/PromptPartyNano.git
cd PromptPartyNano
npm install
```

### Environment Setup

Create a `.env.local` file:

```bash
# Google AI Configuration
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Roadmap](docs/roadmap.md)
- [Feature Glossary](docs/glossary.md)
- [Progress Log](docs/progresslog.md)

## 🤝 Contributing

This project is built for the Nano Banana Hackathon. The current version focuses on core collaborative editing functionality. Future contributions could add:
- Reference image drag-and-drop for fusion
- Feature badge detection and display
- Export functionality with edit chain
- SynthID verification integration

## 📄 License

ISC License - see LICENSE file for details.

## 🙏 Acknowledgments

- Google DeepMind for the Nano Banana Hackathon
- Google AI for Gemini 2.5 Flash Image Preview
- The Prompt Party community for inspiration

---

**Go Bananas!** 🍌 Showcasing the future of collaborative AI image editing.