import { GoogleGenAI, Modality } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// --- FIX: Centralized configuration means we no longer import 'dotenv/config' here ---

// --- FIX: Explicitly configure Cloudinary. This is more robust. ---
// It will read the variables that were loaded by server.js
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const IMAGE_MODEL_NAME = "gemini-2.0-flash-preview-image-generation";

// Helper function to upload an image buffer to Cloudinary
const uploadToCloudinary = (buffer, prompt) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "nft-app",
      public_id: `${prompt.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
      resource_type: "image",
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
      }
      if (result) {
        resolve(result);
      }
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const generateImageFromPrompt = async (prompt) => {
  // --- FIX: Add a defensive check to ensure the API key was loaded ---
  if (!process.env.GOOGLE_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    console.error("Missing API Keys. Check your .env file and server startup.");
    throw new Error("Server configuration error: Missing API keys.");
  }

  try {
    // --- FIX: Use the most explicit initialization for the Google AI client ---
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log("Image data received from AI. Uploading to Cloudinary...");
        
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        const uploadResult = await uploadToCloudinary(buffer, prompt);
        
        console.log(`Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
        
        return uploadResult.secure_url;
      }
    }

    throw new Error("AI model did not return any image data.");

  } catch (error) {
    console.error(`Error in image generation pipeline: ${error.message}`);
    const fallbackUrl = `https://via.placeholder.com/1024x1024/b33e38/FFFFFF?text=AI+Generation+Failed`;
    return fallbackUrl;
  }
};