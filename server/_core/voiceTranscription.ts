/**
 * Voice transcription helper using OpenAI Whisper API.
 */

import { ENV } from "./env";

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
};

export type WhisperResponse = {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionError = {
  error: string;
  code: string;
  details?: string;
};

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

export async function transcribeAudio(options: {
  audioUrl: string;
  language?: string;
  prompt?: string;
}): Promise<WhisperResponse | TranscriptionError> {
  if (!ENV.openaiApiKey) {
    return { error: "OPENAI_API_KEY is not configured", code: "CONFIG_ERROR" };
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  try {
    const audioResponse = await fetch(options.audioUrl);
    if (!audioResponse.ok) {
      return { error: `Failed to download audio: ${audioResponse.status}`, code: "DOWNLOAD_ERROR" };
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    if (audioBuffer.byteLength > MAX_FILE_SIZE) {
      return { error: `Audio file exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, code: "FILE_TOO_LARGE" };
    }

    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const formData = new FormData();
    formData.append("file", blob, "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    if (options.language) formData.append("language", options.language);
    if (options.prompt) formData.append("prompt", options.prompt);

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { error: `Transcription failed: ${response.status} ${detail}`, code: "API_ERROR" };
    }

    return (await response.json()) as WhisperResponse;
  } catch (err) {
    return { error: String(err), code: "UNKNOWN_ERROR" };
  }
}
