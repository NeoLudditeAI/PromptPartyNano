#!/bin/bash

# 🚀 PromptPartyNano Deployment Setup Script
# This script helps set up the deployment environment

echo "🚀 Setting up PromptPartyNano deployment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local template..."
    cat > .env.local << EOL
# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key-here
FIREBASE_AUTH_DOMAIN=prompt-party-nano.firebaseapp.com
FIREBASE_DATABASE_URL=https://prompt-party-nano-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=prompt-party-nano
FIREBASE_STORAGE_BUCKET=prompt-party-nano.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
FIREBASE_APP_ID=your-app-id-here
EOL
    echo "✅ .env.local template created"
    echo "⚠️  Please update .env.local with your actual API keys"
else
    echo "✅ .env.local already exists"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

# Check if user is logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
else
    echo "✅ Already logged into Vercel"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Create Firebase project: https://console.firebase.google.com/"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Test the deployment"
echo ""
echo "📚 See docs/deployment-setup.md for detailed instructions"
