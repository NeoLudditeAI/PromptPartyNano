# Gemini API Quick Reference

## 🚀 Quick Start

### Generate Image from Text
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: "A cat wearing a hat" })
});
const { imageUrl } = await response.json();
```

### Edit Existing Image
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt: "Make the hat red",
    sourceImage: "data:image/png;base64,..."
  })
});
const { imageUrl } = await response.json();
```

## 🎯 Edit Command Examples

### Good Commands
- "Make the sky blue"
- "Add a red hat to the character"
- "Change the background to a forest"
- "Make the character smile"
- "Add sunglasses to the person"

### Bad Commands
- "Change everything" ❌
- "Make it better" ❌
- "Fix this" ❌

## 🔧 Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Invalid API key | Check GEMINI_API_KEY |
| 400 | Content policy violation | Try different prompt |
| 429 | Rate limit exceeded | Wait and retry |
| 500 | Server error | Check API status |

## 📊 Rate Limits

- **60 requests/minute**
- **1,500 requests/day**
- **$30 per 1M tokens**

## 🎨 Our Game Flow

1. **Player 1:** Creates seed image (text → image)
2. **Player 2+:** Edit commands (image + text → image)
3. **All Players:** See progression in image history

## 🔍 Testing Checklist

- [ ] Seed image generates correctly
- [ ] Edit commands work with previous image
- [ ] Image consistency maintained across edits
- [ ] Error handling works for all scenarios
- [ ] Rate limiting prevents abuse
