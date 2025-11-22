import { GoogleGenAI } from "@google/genai";
import { InsightType } from "../types";

/**
 * Generates content based on the user's selection and desired insight type.
 */
export const generateInsight = async (
  imageBase64: string,
  type: InsightType,
  context?: string
): Promise<string> => {
  
  // Initialize the client inside the function to use the most recent API key
  // This ensures that if the user selects a new key via window.aistudio.openSelectKey(),
  // the next request picks up the updated process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Clean base64 string if needed
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  // Model Selection based on task
  let modelName = 'gemini-3-pro-preview'; // Default for reasoning/text
  if (type === InsightType.INFOGRAPHIC) {
    modelName = 'gemini-3-pro-image-preview'; // Nano Banana Pro for images
  }

  // Construct Prompt based on type
  let prompt = "";
  const latexInstruction = "Use LaTeX for all math equations. Wrap inline math in $...$ and block math in $$...$$. Do not use \\( \\) or \\[ \\].";

  switch (type) {
    case InsightType.EXPLAIN:
      prompt = `Analyze the selected section from this academic paper. Provide a clear, concise explanation of the concepts, equations, or figures shown. If it is an equation, break it down variable by variable. ${latexInstruction}`;
      break;
    case InsightType.SLIDE:
      prompt = `Create the content for a presentation slide based on this selection. Output in Markdown format with a Title, Bullet Points, and a Speaker Note. ${latexInstruction}`;
      break;
    case InsightType.CODE:
      prompt = `The selection appears to contain an algorithm, equation, or data structure. Generate Python code that implements or simulates this. Provide comments explaining the code. ${latexInstruction}`;
      break;
    case InsightType.SUMMARY:
      prompt = `Summarize the key information presented in this visual page context. ${latexInstruction}`;
      break;
    case InsightType.INFOGRAPHIC:
      // For image generation, we first need a prompt describing what to generate, 
      // but gemini-3-pro-image-preview can also take image inputs for editing/inspiration.
      // However, typically we might want to Ask Pro to describe it first, then generate.
      // For this demo, we will ask the model to "Redesign this diagram as a modern, clean infographic".
      prompt = "Redesign this figure as a modern, high-quality, clean, flat-design scientific infographic that explains the concept clearly. Return the image.";
      break;
  }

  if (context) {
    prompt += `\nAdditional Context: ${context}`;
  }

  try {
    if (type === InsightType.INFOGRAPHIC) {
      // Image Generation / Editing Flow
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            }
          ]
        },
        config: {
            imageConfig: {
                imageSize: "1K",
                aspectRatio: "1:1" // Or match the crop roughly if possible, but 1:1 is safe
            }
        }
      });

      // Extract Image
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return "No image generated.";

    } else {
      // Text/Code Generation Flow
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            }
          ]
        }
      });

      return response.text || "No response generated.";
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Error generating insight: ${error instanceof Error ? error.message : String(error)}`;
  }
};