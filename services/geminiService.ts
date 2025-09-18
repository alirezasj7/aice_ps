/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
let lastUsedApiKey: string | null = null;
let lastUsedBaseUrl: string | undefined | null = null;

// Function to get the current API key
const getApiKey = (): string | null => {
    // Prioritize user-provided key from localStorage
    try {
      const userApiKey = localStorage.getItem('gemini-api-key');
      if (userApiKey && userApiKey.trim() !== '') {
          return userApiKey;
      }
    } catch(e) {
      console.warn("Could not access localStorage for API key.", e);
    }
    // Fallback to the system-level environment variable
    return process.env.API_KEY || null;
}

// Function to get the current API Base URL
const getBaseUrl = (): string | undefined => {
    try {
        const userBaseUrl = localStorage.getItem('gemini-base-url');
        if (userBaseUrl && userBaseUrl.trim() !== '') {
            return userBaseUrl.trim();
        }
    } catch(e) {
      console.warn("Could not access localStorage for API base URL.", e);
    }
    return undefined; // Return undefined to use the default endpoint
}


// Centralized function to get the GoogleGenAI instance
const getGoogleAI = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API key not found. Please enter your key in settings, or ensure the system API key is properly configured in the environment.");
    }
    const baseUrl = getBaseUrl();
    
    // Re-initialize if the API key or base URL has changed, or if there's no instance
    if (!aiInstance || apiKey !== lastUsedApiKey || baseUrl !== lastUsedBaseUrl) {
      try {
        const config: { apiKey: string, apiEndpoint?: string } = { apiKey };
        if (baseUrl) {
            config.apiEndpoint = baseUrl;
        }
        aiInstance = new GoogleGenAI(config);
        lastUsedApiKey = apiKey;
        lastUsedBaseUrl = baseUrl;
      } catch(e) {
        console.error("Failed to initialize GoogleGenAI", e);
        aiInstance = null; // Invalidate on failure
        lastUsedApiKey = null;
        lastUsedBaseUrl = null;
        throw new Error(`Failed to initialize AI service: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return aiInstance;
};

const handleApiError = (error: any, action: string): Error => {
    console.error(`API call for "${action}" failed:`, error);
    // Attempt to parse a meaningful message from the error object or string
    let message = `Error occurred during "${action}": ${error.message || 'Unknown communication error'}`;
    try {
      // Errors from the backend might be JSON strings
      const errorObj = JSON.parse(error.message);
      if (errorObj?.error?.message) {
         // Use the specific message from the API if available
         message = `Error occurred during "${action}": ${errorObj.error.message}`;
      }
    } catch(e) {
      // It's not a JSON string, use the original message
      if (String(error.message).includes('API key not valid')) {
          message = 'API key is invalid. Please check the key you entered in settings.';
      } else if (String(error.message).includes('xhr error')) {
           message = `Communication with AI service failed. This may be caused by network issues or an invalid API key.`;
      }
    }

    return new Error(message);
}


// Helper to resize and convert image if necessary
const resizeImageForApi = async (file: File): Promise<{ file: File, mimeType: string }> => {
    const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png'];
    const MAX_DIMENSION = 2048;

    const needsConversion = !SUPPORTED_MIME_TYPES.includes(file.type);

    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            if (typeof e.target?.result !== 'string') {
                return reject(new Error('Failed to read file for processing.'));
            }
            image.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));

        image.onload = () => {
            const { naturalWidth: width, naturalHeight: height } = image;
            const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

            // If no resize and no conversion is needed, we're good.
            if (!needsResize && !needsConversion) {
                return resolve({ file, mimeType: file.type });
            }

            // Otherwise, we need to draw to canvas.
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not create canvas context.'));
            }

            let newWidth = width;
            let newHeight = height;

            if (needsResize) {
                if (width > height) {
                    newWidth = MAX_DIMENSION;
                    newHeight = Math.round((height * MAX_DIMENSION) / width);
                } else {
                    newHeight = MAX_DIMENSION;
                    newWidth = Math.round((width * MAX_DIMENSION) / height);
                }
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(image, 0, 0, newWidth, newHeight);

            // Always convert to PNG when using canvas for simplicity and to handle transparency.
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        return reject(new Error('Failed to create blob from canvas.'));
                    }
                    const newFileName = (file.name.split('.').slice(0, -1).join('.') || 'image') + '.png';
                    const newFile = new File([blob], newFileName, { type: 'image/png' });
                    resolve({ file: newFile, mimeType: 'image/png' });
                },
                'image/png',
                0.95
            );
        };

        image.onerror = (err) => {
            reject(new Error(`Failed to load image for processing: ${err}`));
        };

        reader.readAsDataURL(file);
    });
};

// Helper to convert a File to a base64 string
const fileToGenerativePart = async (file: File) => {
    const { file: processedFile, mimeType } = await resizeImageForApi(file);
    const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
    });
    return {
        inlineData: {
            mimeType: mimeType,
            data: base64data,
        },
    };
};

const callImageEditingModel = async (parts: any[], action: string): Promise<string> => {
    try {
        const ai = getGoogleAI();
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const candidate = response.candidates?.[0];

        // Check for valid response structure
        if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            const finishReason = candidate?.finishReason;
            const safetyRatings = candidate?.safetyRatings;
            
            let detailedError = `AI did not return a valid result.`;
            if (finishReason) {
                detailedError += ` Reason: ${finishReason}.`;
            }
            if (safetyRatings?.some(r => r.blocked)) {
                detailedError += ` The prompt may have been blocked by safety filters.`;
            }
            throw new Error(detailedError);
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        // This is a special case for prompt-blocking or other non-image responses
        if (candidate.content.parts[0]?.text) {
             throw new Error("Model responded with text instead of an image. The prompt may have been blocked.");
        }

        throw new Error('AI 未能返回预期的图片结果。');
        throw new Error('AI failed to return expected image result.');
    } catch (e) {
        // Re-throw specific errors, otherwise wrap in a generic handler
        if (e instanceof Error && (e.message.includes("Model responded with text") || e.message.includes("AI did not return a valid result"))) {
            throw e;
        }
        throw handleApiError(e, action);
    }
}

export const generateImageFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        const ai = getGoogleAI();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error('AI 未能生成图片。');
        throw new Error('AI failed to generate image.');
    } catch (e) {
        throw handleApiError(e, 'generate image');
    }
};

export const generateEditedImage = async (imageFile: File, prompt: string, hotspot: { x: number; y: number }): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: `Apply this edit at hotspot (${hotspot.x}, ${hotspot.y}): ${prompt}` };
    return callImageEditingModel([imagePart, textPart], 'retouch');
};

export const generateFilteredImage = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const primaryTextPart = { text: `Apply this filter: ${prompt}` };
    try {
        return await callImageEditingModel([imagePart, primaryTextPart], 'filter');
    } catch (error) {
        if (error instanceof Error && error.message.includes("Model responded with text instead of an image")) {
            console.warn("Original filter prompt failed. Trying a fallback without the English prefix.");
            const fallbackTextPart = { text: prompt };
            return await callImageEditingModel([imagePart, fallbackTextPart], 'filter (fallback)');
        }
        throw error;
    }
};

export const generateStyledImage = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const primaryTextPart = { text: `Apply this artistic style: ${prompt}` };
    try {
        return await callImageEditingModel([imagePart, primaryTextPart], 'apply style');
    } catch (error) {
        if (error instanceof Error && error.message.includes("Model responded with text instead of an image")) {
            console.warn("Original styled image prompt failed. Trying a fallback without the English prefix.");
            const fallbackTextPart = { text: prompt };
            return await callImageEditingModel([imagePart, fallbackTextPart], 'apply style (fallback)');
        }
        throw error;
    }
};

export const generateAdjustedImage = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const primaryTextPart = { text: `Apply this adjustment: ${prompt}` };
    try {
        return await callImageEditingModel([imagePart, primaryTextPart], 'adjustment');
    } catch (error) {
        if (error instanceof Error && error.message.includes("Model responded with text instead of an image")) {
            console.warn("Original adjustment prompt failed. Trying a fallback without the English prefix.");
            const fallbackTextPart = { text: prompt };
            return await callImageEditingModel([imagePart, fallbackTextPart], 'adjustment (fallback)');
        }
        throw error;
    }
};

export const generateTexturedImage = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const primaryTextPart = { text: `Apply this texture: ${prompt}` };
    try {
        return await callImageEditingModel([imagePart, primaryTextPart], 'texture');
    } catch (error) {
        if (error instanceof Error && error.message.includes("Model responded with text instead of an image")) {
            console.warn("Original texture prompt failed. Trying a fallback without the English prefix.");
            const fallbackTextPart = { text: prompt };
            return await callImageEditingModel([imagePart, fallbackTextPart], 'texture (fallback)');
        }
        throw error;
    }
};

export const removeBackgroundImage = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: 'Remove the background of this image, leaving only the main subject with a transparent background.' };
    return callImageEditingModel([imagePart, textPart], 'background removal');
};

export const generateFusedImage = async (mainImage: File, sourceImages: File[], prompt: string): Promise<string> => {
    try {
        const mainImagePart = await fileToGenerativePart(mainImage);
        
        const sourceImageParts = await Promise.all(
            sourceImages.map((file, index) => fileToGenerativePart(file).then(part => ({ ...part, index: index + 1 })))
        );

        let fullPrompt = `Fuse the images. The main image is the one I'm editing. `;

        sourceImageParts.forEach(part => {
            fullPrompt += `Source image ${part.index} is provided. `;
        });
        
        fullPrompt += `Instructions: ${prompt}`;
        
        const textPart = { text: fullPrompt };
        const allParts = [mainImagePart, ...sourceImageParts.map(p => ({ inlineData: p.inlineData })), textPart];
        
        return await callImageEditingModel(allParts, '合成');
        return await callImageEditingModel(allParts, 'fusion');

    } catch (e) {
       throw handleApiError(e, 'fusion');
    }
};

export const generateCreativeSuggestions = async (imageFile: File, type: 'filter' | 'adjustment' | 'texture'): Promise<{ name: string, prompt: string }[]> => {
    try {
        const ai = getGoogleAI();
        const imagePart = await fileToGenerativePart(imageFile);
        const textPrompt = `Analyze this image. Suggest 4 creative and interesting image ${type}s that would look good on it. Provide a very short, catchy name (2-4 words, in Chinese) and the corresponding detailed English prompt for each suggestion.`;
        const textPart = { text: textPrompt };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [ imagePart, textPart ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "A very short, catchy name for the effect in Chinese." },
                                    prompt: { type: Type.STRING, description: "The detailed English prompt to achieve the effect." }
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result.suggestions;
    } catch (e) {
        throw handleApiError(e, 'get inspiration');
    }
};


// Past Forward Feature
const getFallbackPrompt = (decade: string) => `Create a photograph of the person in this image as if they were living in the ${decade}. The photograph should capture the distinct fashion, hairstyles, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;

const extractDecade = (prompt: string) => {
    const match = prompt.match(/(\d{4}s)/);
    return match ? match[1] : null;
}

export const generateDecadeImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid image data URL format.");
  }
  const [, mimeType, base64Data] = match;

    const imagePart = {
        inlineData: { mimeType, data: base64Data },
    };

    try {
        // First attempt with the primary prompt
        const textPart = { text: prompt };
        return await callImageEditingModel([imagePart, textPart], `generate ${extractDecade(prompt)} image`);
    } catch (error) {
        // If it failed because the model returned text (prompt was likely blocked)
        if (error instanceof Error && error.message.includes("Model responded with text instead of an image")) {
            console.warn("Original prompt failed. Trying a fallback.");
            const decade = extractDecade(prompt);
            if (!decade) throw error; 
            
            // Second attempt with a safer, fallback prompt
            const fallbackPrompt = getFallbackPrompt(decade);
            const fallbackTextPart = { text: fallbackPrompt };
            return await callImageEditingModel([imagePart, fallbackTextPart], `generate ${decade} image (fallback)`);
        }
        // For other errors, re-throw them
        throw error;
    }
};