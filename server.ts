import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for large payload (e.g. base64 images, large documents)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Transformation Endpoint
// Converts images, documents, and code with Gemini
app.post('/api/ai/transform', async (req: Request, res: Response) => {
  try {
    if (!aiClient) {
      if (process.env.GEMINI_API_KEY) {
        aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } else {
        return res.status(503).json({
          error: 'Gemini AI API key is not configured in environment. Standard conversions are fully functional client-side.',
        });
      }
    }

    const {
      sourceType, // 'image' | 'text' | 'document' | 'audio'
      targetFormat, // 'markdown' | 'html' | 'svg' | 'json' | 'latex' | 'summary' | 'transcription' | 'code' | 'csv'
      content, // base64 or raw string
      mimeType,
      fileName,
      options,
    } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided for transformation.' });
    }

    let systemInstruction = `You are a high-performance universal file converter and extractor engine.
Your mission is to accurately transform the provided input file into the requested target format (${targetFormat}).
Rules:
1. Output strictly the converted content in the target format.
2. For code/markup/json/svg outputs, do not wrap in unnecessary chat chit-chat.
3. For SVG conversion: output valid, scalable, self-contained SVG code with <svg ...> root tag that accurately represents the shapes, colors, and layout of the image.
4. For Markdown / OCR conversion: extract all legible text, tables, equations, and hierarchy cleanly.
5. For JSON / Data conversion: structure the parsed content into clean, semantic JSON without syntax errors.
6. For HTML conversion: create responsive, semantic HTML structure.`;

    let userPrompt = `Transform this ${sourceType || 'file'} (${fileName || 'input'}) into ${targetFormat}.`;
    if (options?.instructions) {
      userPrompt += `\nAdditional requirements: ${options.instructions}`;
    }

    let contents: any;

    if (sourceType === 'image' && content.includes(',')) {
      // Base64 data URL
      const base64Data = content.split(',')[1];
      const actualMime = mimeType || content.substring(content.indexOf(':') + 1, content.indexOf(';'));

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: actualMime || 'image/png',
              data: base64Data,
            },
          },
          {
            text: `${userPrompt}\nEnsure accurate extraction, recreation, or transformation as requested.`,
          },
        ],
      };
    } else if (sourceType === 'audio' && content.includes(',')) {
      // Audio file base64
      const base64Data = content.split(',')[1];
      const actualMime = mimeType || 'audio/mp3';

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: actualMime,
              data: base64Data,
            },
          },
          {
            text: `Transcribe and transform this audio recording accurately into ${targetFormat}. If timestamp or speaker distinction is detected, format cleanly.`,
          },
        ],
      };
    } else {
      // Text / Document content
      contents = `${userPrompt}\n\n--- INPUT CONTENT ---\n${typeof content === 'string' ? content.slice(0, 50000) : JSON.stringify(content)}`;
    }

    // Attempt with retry and fallback model for transient 503 spikes
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let outputText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
          },
        });
        outputText = response.text || '';
        if (outputText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error:`, err?.message || err);
        // If 503 or 429, try the next model candidate
        if (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand')) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }

    if (!outputText && lastError) {
      throw lastError;
    }

    return res.json({
      success: true,
      targetFormat,
      result: outputText,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Error in AI transformation:', err);
    let message = err.message || 'Failed to complete AI transformation';
    
    // Check if error message is wrapped in JSON
    try {
      if (typeof message === 'string' && message.includes('{')) {
        const jsonStart = message.indexOf('{');
        const parsed = JSON.parse(message.slice(jsonStart));
        if (parsed.error?.message) {
          message = parsed.error.message;
        }
      }
    } catch {
      // Keep original message if JSON parse fails
    }

    if (message.includes('high demand') || message.includes('503')) {
      message = 'The AI model is currently experiencing a temporary demand spike. Please retry in a few moments, or use instant client-side conversions.';
    }

    return res.status(500).json({
      error: message,
    });
  }
});

// Start server with Vite middleware in dev or static in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Universal Converter running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
