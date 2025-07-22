// server/server.js

// --- FIX: Load environment variables at the absolute start of the application ---
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateImageFromPrompt } from './generator.js';

const app = express();
const port = 8000;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Allow requests from our React frontend
app.use(express.json()); // Allow the server to understand JSON request bodies

// Serve static files (our generated images) from the public/generated directory
app.use(express.static(path.join(process.cwd(), 'public')));

// API endpoint that the frontend will call
app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`Received prompt: "${prompt}"`);

  try {
    // Call the generator function to get the image URL
    const imageUrl = await generateImageFromPrompt(prompt);

    if (!imageUrl) {
        throw new Error('Image generation failed to produce a valid URL or file.');
    }

    // This logic correctly handles the full URL returned by Cloudinary
    const fullImageUrl = imageUrl.startsWith('/') 
      ? `http://localhost:${port}${imageUrl}` 
      : imageUrl;

    console.log(`Sending back image URL: ${fullImageUrl}`);
    res.json({ imageUrl: fullImageUrl });

  } catch (error) {
    console.error('Error in /generate-image endpoint:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ AI Agent server listening at http://localhost:${port}`);
});