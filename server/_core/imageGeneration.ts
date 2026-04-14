/**
 * Image generation — stub implementation.
 *
 * The original Manus Forge image service has been removed.
 * Replace with OpenAI DALL-E, Replicate, or another provider as needed.
 */

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  console.warn("[ImageGeneration] generateImage called but no backend is configured. Prompt:", options.prompt);
  return { url: "" };
}
