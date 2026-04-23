import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const dynamic = 'force-dynamic';
export const maxDuration = 60;


export async function POST(req: Request) {
  try {
    const { type, data, tone, language = "English" } = await req.json();

    if (!data) {
      return NextResponse.json({ error: 'Input data is required' }, { status: 400 });
    }

    let textToAnalyze = data;
    let articleContext = "";

    // 1. Fetch and Parse URL if it's a URL using Cheerio (much lighter than jsdom for Vercel)
    if (type === 'url') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s fetch timeout
        
        const response = await fetch(data, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Remove junk elements to clean the text extraction
        $('script, style, nav, header, footer, iframe, noscript, aside, .advertisement').remove();
        
        // Extract paragraph text
        const contentText = $('p, h1, h2, h3, h4, h5, h6, article')
          .map((i, el) => $(el).text())
          .get()
          .join('\n')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (!contentText || contentText.length === 0) {
           return NextResponse.json({ error: 'Could not extract raw text from this URL. The site might be blocking us or is empty. Please try pasting raw text instead.' }, { status: 400 });
        }
        
        textToAnalyze = contentText;
        const title = $('title').text() || 'Unknown Title';
        let siteName = 'Unknown Site';
        try { siteName = new URL(data).hostname; } catch(e){}
        
        articleContext = `\n\nARTICLE TITLE: ${title}\nSITE: ${siteName}`;
        
      } catch (e: any) {
        return NextResponse.json({ error: `Failed to scrape URL: ${e.message}` }, { status: 400 });
      }
    }

    // 2. Call Gemini API
    const systemPrompt = `You are an expert journalist and bias detector. Your task is to read the provided text and output a highly structured JSON response analyzing it.
    
CRITICAL LANGUAGE INSTRUCTION:
TRANSLATE THE ENTIRE RESPONSE TO ${language}. The "summary", "biasLabel", and "highlights" MUST absolutely be written natively in ${language}. If you reply in English when ${language} was requested, you fail.

REQUIREMENTS:
1. "summary": Provide a DETAILED and EXTENSIVE summary of the article. It MUST BE VERY LONG (minimum of 5-6 comprehensive paragraphs). Do not write a brief summary. Go into nuance. Format this summary using RICH MARKDOWN (e.g., use **bolding** for key terms, use '-' bullet lists for multiple facts). Write the actual summary text COMPLETELY in ${language}.
2. "biasLabel": Analyze the sentiment/tone. Translate this absolute label strictly into ${language}.
3. "confidence": A number from 0 to 100 representing how confident you are in your bias labeling.
4. "wordCount": Estimated number of words in the source text.
5. "emotionalIntensity": A number from 1 to 10 rating the sensationalism or emotional manipulation in the text (1 = completely dry facts, 10 = absolute propaganda/rage-bait).
6. "highlights": An array of objects extracting up to 3 biased or emotionally charged phrases from the text. Each object must have "text" (the exact quote in the original language) and "reason" (why it shows bias, written in ${language}).

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

    let aiText = response.text;
    
    if (!aiText) {
      throw new Error("Empty response from AI");
    }

    // Safely extract just the JSON object from the response
    const jsonBlockMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      aiText = jsonBlockMatch[1];
    } else {
      const start = aiText.indexOf('{');
      if (start !== -1) {
        let depth = 0;
        let end = -1;
        for (let i = start; i < aiText.length; i++) {
          if (aiText[i] === '{') depth++;
          else if (aiText[i] === '}') {
            depth--;
            if (depth === 0) {
              end = i;
              break;
            }
          }
        }
        if (end !== -1) {
          aiText = aiText.substring(start, end + 1);
        }
      }
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
