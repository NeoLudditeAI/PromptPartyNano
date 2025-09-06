# 📚 Prompt Party: Nano Banana Edit Mode – Glossary

Shared language and domain definitions for the Nano Banana Edit Mode. Cursor must refer here to maintain naming consistency and reduce ambiguity.

---

## 🍌 **Core Concepts**

- **Edit Mode**: The collaborative image editing gameplay mode powered by Nano Banana
- **Image Edit**: A single player's contribution (≤25-char command) that modifies the current image
- **Edit Chain**: The sequence of all edits applied to create the final image
- **Reference Image**: Optional image attached to an edit for style transfer/fusion
- **Feature Badge**: Visual indicator showing which Nano Banana capabilities were used

---

## 🎮 **Gameplay Terms**

- **Start Image**: The initial image (uploaded or generated from text prompt)
- **Current Image**: The latest version after all edits have been applied
- **Edit Command**: The ≤25-character instruction submitted by a player
- **Expanded Prompt**: The server-processed version of the edit command
- **Turn**: A single player's opportunity to submit an edit
- **Edit History**: Chronological list of all edits made in the game

---

## 🍌 **Nano Banana Features**

- **Iterative Editing**: Multi-turn editing where each edit builds on the previous image
- **Multi-image Fusion**: Combining reference images with the main image
- **Style Transfer**: Applying visual style from reference images
- **High-fidelity Text**: Rendering readable text within images
- **Consistency**: Maintaining visual coherence across edits
- **SynthID**: Google's watermark for AI-generated content verification

---

## 🏷️ **Feature Badges**

- **Edit**: Any text-and-image editing call
- **Fusion**: Reference image was used for style transfer
- **Text**: Legible text was rendered (verified by OCR)
- **Consistency**: Subject similarity maintained across edits
- **Verified**: SynthID watermark detected and verified

---

## 🔧 **Technical Terms**

- **Structured Instruction**: Server-expanded edit command with context
- **Base Instruction**: Standard prompt template for all edits
- **Delta**: The specific change described in the edit command
- **Reference Handling**: Processing of attached reference images
- **Feature Detection**: Automatic analysis of which capabilities were used
- **OCR Verification**: Text recognition to verify readable text rendering

---

## 📱 **UI Components**

- **Edit Input**: Text field for ≤25-character edit commands
- **Reference Upload**: Optional image attachment for fusion
- **Feature Badges**: Visual indicators of Nano Banana capabilities
- **Edit History**: Timeline showing all edits and their effects
- **Image Comparison**: Before/after view of edits
- **Start Image Upload**: Initial image selection or generation

---

## 🎯 **Hackathon Terms**

- **Wow Factor**: The compelling demonstration of Nano Banana's unique capabilities
- **Demo Scenario**: A prepared sequence showcasing specific features
- **Capability Showcase**: Highlighting what makes Nano Banana special
- **Iterative Workflow**: The multi-turn editing process that demonstrates AI capabilities
- **Feature Detection**: Automatic identification of which Nano Banana features were used

---

## 🔄 **Workflow Terms**

- **T2I Generation**: Text-to-image generation for start images
- **I2I Editing**: Image-to-image editing for turn-based modifications
- **Multi-turn Chat**: The iterative editing conversation style
- **Edit Expansion**: Converting user commands into detailed instructions
- **Badge Analysis**: Determining which features were demonstrated

This glossary ensures consistent terminology throughout the Nano Banana Edit Mode development, helping maintain clarity about the unique capabilities we're showcasing.