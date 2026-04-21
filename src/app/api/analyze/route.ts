import { NextResponse } from 'next/server';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
  try {
    const { type, data, tone } = await req.json();

    if (!data) {
      return NextResponse.json({ error: 'Input data is required' }, { status: 400 });
    }

    let textToAnalyze = data;
    let articleContext = "";

    // 1. Fetch and Parse URL if it's a URL using Mozilla Readability
    if (type === 'url') {
      try {
        const response = await fetch(data, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Suppress JSDOM CSS parsing errors from flooding the terminal
        const virtualConsole = new VirtualConsole();
        const doc = new JSDOM(html, { url: data, virtualConsole });
        
        // Mozilla's magic article extractor
        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        
        if (!article || !article.textContent || article.textContent.trim().length === 0) {
           return NextResponse.json({ error: 'Could not extract raw text from this URL. The site might be blocking us or is empty. Please try pasting raw text instead.' }, { status: 400 });
        }
        
        textToAnalyze = article.textContent;
        articleContext = `\n\nARTICLE TITLE: ${article.title}\nSITE: ${article.siteName}`;
        
      } catch (e: any) {
        return NextResponse.json({ error: `Failed to scrape URL: ${e.message}` }, { status: 400 });
      }
    }

    // 2. Call Gemini API
    const systemPrompt = `You are an expert journalist and bias detector. Your task is to read the provided text and output a highly structured JSON response analyzing it.
    
REQUIREMENTS:
1. "summary": Summarize the article based on the user's requested tone: "${tone}". If the tone is "Explain like I'm 10", use very simple metaphors. If it's "Fact-only", strip all adjectives. Format this summary using RICH MARKDOWN (e.g., use **bolding** for key terms, use '-' bullet lists for multiple facts).
2. "biasLabel": Analyze the sentiment/tone. Label must be EXACTLY ONE of: "Neutral", "Left-Leaning", "Right-Leaning", "Emotionally Charged".
3. "confidence": A number from 0 to 100 representing how confident you are in your bias labeling.
4. "wordCount": Estimated number of words in the source text.
5. "emotionalIntensity": A number from 1 to 10 rating the sensationalism or emotional manipulation in the text (1 = completely dry facts, 10 = absolute propaganda/rage-bait).
6. "highlights": An array of objects extracting up to 3 biased or emotionally charged phrases from the text. Each object must have "text" (the exact quote) and "reason" (why it shows bias).

Return ONLY valid JSON, without any markdown formatting wrappers or explanation.`;

    const instructionsText = `INSTRUCTIONS:\n${systemPrompt}\n\nTEXT TO ANALYZE:${articleContext}\n${textToAnalyze.substring(0, 50000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: instructionsText }] }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiText = response.text;
    
    if (!aiText) {
      throw new Error("Empty response from AI");
    }

    const resultJSON = JSON.parse(aiText);

    return NextResponse.json(resultJSON);

  } catch (error: any) {
    console.error('API Error:', error);
    let errorMessage = error.message || 'Internal Server Error';
    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.includes('status: 429')) {
      return NextResponse.json({ error: 'The AI is currently under heavy load (Rate Limit). Please wait a moment and try again.' }, { status: 429 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
