# Image Generation Setup Guide

## Overview

Your diary miniapp now generates AI-powered images based on user memories! Here's how to set it up:

## Step 1: Get Hugging Face API Key

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" permissions
3. Copy the token

## Step 2: Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Hugging Face API Key for image generation
HUGGING_FACE_API_KEY=your_hugging_face_api_key_here

# Pinata API credentials (if not already set)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_api_key_here
```

## Step 3: Deploy API Endpoint

The image generation API endpoint is located at `api/generateImage.ts`. Make sure it's deployed with your application.

## How It Works

1. **User writes a memory** in the textarea
2. **AI generates an image** based on the memory content using Stable Diffusion
3. **Image is displayed** to the user with download/copy options
4. **Memory is minted as NFT** on Base network
5. **User gets both the image and NFT** as a complete memory package

## Features Added

- ✅ AI image generation using Hugging Face Stable Diffusion
- ✅ Beautiful image display with download functionality
- ✅ Copy image to clipboard feature
- ✅ Loading states for image generation
- ✅ Error handling for API failures
- ✅ Responsive design for mobile devices

## API Endpoint Details

- **URL**: `/api/generateImage`
- **Method**: POST
- **Body**: `{ "memory": "user's memory text" }`
- **Response**: `{ "success": true, "image": "data:image/png;base64,...", "prompt": "..." }`

## Troubleshooting

If image generation fails:

1. Check your Hugging Face API key
2. Ensure you have sufficient API credits
3. Check browser console for error messages
4. Verify the API endpoint is deployed correctly

## Cost Considerations

- Hugging Face offers free tier with limited requests
- Consider upgrading for production use
- Monitor API usage in your Hugging Face dashboard
