# 🍌 Prompt Party: Nano Banana Edit Mode

A collaborative image editing game powered by Google's Gemini 2.5 Flash Image Preview (Nano Banana). Players take turns making small edits to an evolving image, showcasing the advanced capabilities of iterative AI image editing.

## 🎮 How It Works

1. **Start**: Upload a photo or generate from a rich text prompt
2. **Edit**: Each player submits ≤25-character edit commands (e.g., "rm coffee mug + hat")
3. **Fusion**: Optionally attach reference images for style transfer
4. **Reveal**: See the updated image with feature badges showing Nano Banana capabilities
5. **Share**: Download the final image with the complete edit chain

## ✨ Key Features

- **Iterative Editing**: Multi-turn image editing that builds on previous results
- **Multi-image Fusion**: Style transfer and composition with reference images
- **High-fidelity Text**: Render readable text within images
- **Feature Badges**: Visual indicators of Nano Banana capabilities used
- **SynthID Verification**: Google's watermark for AI-generated content
- **Real-time Collaboration**: Turn-based editing with live updates

## 🍌 Nano Banana Capabilities Showcased

- **Text-to-Image**: Generate start images from rich descriptions
- **Image-to-Image Editing**: Iterative modifications with ≤25-char commands
- **Multi-image Fusion**: Combine reference images for style transfer
- **High-fidelity Text Rendering**: Create readable text within images
- **Consistency**: Maintain visual coherence across edits
- **SynthID**: Watermark verification for AI-generated content

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

## 🏆 Hackathon Submission

This project is designed for the **Nano Banana 48 Hour Challenge** by Google DeepMind, showcasing the unique capabilities of Gemini 2.5 Flash Image Preview.

### Demo Scenarios

- **Creative Workflow**: Collaborative logo design with iterative refinements
- **E-commerce**: Product visualization with style variations
- **Storytelling**: Character consistency across multiple scenes
- **Marketing**: Brand asset creation with text integration

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase Realtime Database
- **AI**: Google Gemini 2.5 Flash Image Preview
- **Hosting**: Vercel

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Roadmap](docs/roadmap.md)
- [Feature Glossary](docs/glossary.md)
- [Progress Log](docs/progresslog.md)

## 🤝 Contributing

This project is built for the Nano Banana Hackathon. Contributions are welcome to improve the showcase of Gemini 2.5 Flash Image Preview capabilities.

## 📄 License

ISC License - see LICENSE file for details.

## 🙏 Acknowledgments

- Google DeepMind for the Nano Banana Hackathon
- Google AI for Gemini 2.5 Flash Image Preview
- The Prompt Party community for inspiration

---

**Go Bananas!** 🍌 Showcasing the future of collaborative AI image editing.