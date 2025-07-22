import 'dotenv/config'; // MUST be the first import
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateImageFromPrompt } from './generator.js';

const app = express();
const port = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- FIX 1: API ROUTES DEFINED BEFORE STATIC FILE SERVING ---
// This ensures that a request to '/generate-batch-images' is never mistaken for a file.

// Existing single image endpoint (no changes to its logic)
app.post('/generate-image', async (req, res, next) => {
  // Pass errors to the global error handler with `next`
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    console.log(`Received prompt: "${prompt}"`);
    const imageUrl = await generateImageFromPrompt(prompt);
    res.json({ imageUrl });
  } catch (error) {
    next(error); // Pass error to the global handler
  }
});

// Batch minting endpoint
app.post('/generate-batch-images', async (req, res, next) => {
  // Pass errors to the global error handler with `next`
  try {
    const { prompt, count } = req.body;
    if (!prompt || !count || count < 1) {
      return res.status(400).json({ error: 'A valid prompt and count are required' });
    }

    const imageCount = Math.min(parseInt(count, 10), 10);
    console.log(`Received batch request for ${imageCount} images with prompt: "${prompt}"`);

    const imagePromises = Array.from({ length: imageCount }, (_, i) => {
        const variedPrompt = `${prompt}, high quality, digital art #${i + 1}`;
        return generateImageFromPrompt(variedPrompt);
    });

    const imageUrls = await Promise.all(imagePromises);
    console.log(`Sending back ${imageUrls.length} image URLs.`);
    res.json({ imageUrls });
  } catch (error) {
    next(error); // Pass any errors to the global handler
  }
});

// --- Static file serving comes after API routes ---
app.use(express.static(path.join(process.cwd(), 'public')));

// --- FIX 2: GLOBAL ERROR HANDLING MIDDLEWARE ---
// This is the safety net. Any `next(error)` call will land here.
// This guarantees we always send a JSON error and never crash.
app.use((err, req, res, next) => {
  console.error("--- Global Server Error ---");
  console.error(err.stack); // Log the full error to the server console
  res.status(500).json({
    error: 'An unexpected server error occurred.',
    details: err.message, // Provide the error message in the JSON response
  });
});

app.listen(port, () => {
  console.log(`✅ AI Agent server listening at http://localhost:${port}`);
});
