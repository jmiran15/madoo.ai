import axios from "axios";
import cuid from "cuid";
import FormD from "form-data";
import OpenAI from "openai";

import {
  base_style_system,
  base_style_user,
  consistancy_system,
  image_insertion_system,
  image_insertion_user,
  transcript_system,
  transcript_user,
  user_consistancy,
  video_negative_prompt,
} from "./prompts";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const CHARACTER_LIMIT = 10000;
export const elevenlabs_rate_limit = 3;
export const batch_size = 10;

export const elevenlabsSettings = {
  model_id: process.env.ELEVEN_LABS_MODEL_ID,
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.5,
  },
};

// image settings
export const IMAGE_MODEL = "dall-e-3";
export const SIZE = "1024x1792";
export const QUALITY = "hd";

// chat settings
export const MODEL = "gpt-4-turbo";
export const TEMP = 0.2;
export const MAX_TOKENS = null; // need to do splitting on intial raw chunk so we don't exceed the max tokens

// audio settings
export const AUDIO_MODEL = "whisper-1";
export const TIMESTAMP_GRANULARITIES = "segment";
export const RESPONSE_FORMAT = "verbose_json";
export const AUDIO_URL = "https://api.openai.com/v1/audio/transcriptions"; // should be env var

export interface Chunk {
  description: string;
  raw_chunk: string;
  id: string;
}

export interface TranscriptionResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: Segment[];
}

export interface Segment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface ImageDescription {
  start: number;
  end: number;
  description: string;
}

export interface Image {
  start: number;
  end: number;
  url: string;
}

export async function generateStyle(rawText: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: base_style_system,
      },
      {
        role: "user",
        content: base_style_user({ query: rawText }),
      },
    ],
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMP,
  });

  return String(completion.choices[0].message.content);
}

export interface ConsistantCharacter {
  name: string;
  description: string;
  id: string; // used for ref later
}

export async function generateConsistantCharacters(
  rawText: string,
): Promise<ConsistantCharacter[] | { error: string }> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: consistancy_system,
      },
      {
        role: "user",
        content: user_consistancy({ query: rawText }),
      },
    ],
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMP,
    // response_format: { type: "json_object" },
  });

  try {
    let consistancies: ConsistantCharacter[] = JSON.parse(
      String(completion.choices[0].message.content),
    );

    consistancies = consistancies.map((cs) => {
      const id = cuid();
      return {
        ...cs,
        id,
      };
    });

    return consistancies;
  } catch (error) {
    console.error("Error generating consistancies:", error);
    return { error: String(error) };
  }
}

export async function generateTranscript({ text }: { text: string }): Promise<{
  transcript: string;
}> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: transcript_system,
      },
      {
        role: "user",
        content: transcript_user({
          text,
        }),
      },
    ],
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMP,
  });

  return { transcript: String(completion.choices[0].message.content) };
}

// change to replicate fast whisper
export async function transcribeAudio({
  audioUrl,
}: {
  audioUrl: string;
}): Promise<{ transcription: TranscriptionResponse }> {
  console.log(`Transcribing audio from ${audioUrl}`);
  const response = await fetch(audioUrl);
  console.log(`response: ${JSON.stringify(response)}`);
  const audioBlob = await response.blob();

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.mp3");
  formData.append("timestamp_granularities[]", TIMESTAMP_GRANULARITIES);
  formData.append("model", AUDIO_MODEL);
  formData.append("response_format", RESPONSE_FORMAT);

  const transcriptionResponse = await fetch(AUDIO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!transcriptionResponse.ok) {
    throw new Error(`HTTP error! status: ${transcriptionResponse.status}`);
  }

  const transcription = await transcriptionResponse.json();

  return {
    transcription,
  };
}

export async function getImageDescriptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunks: any,
): Promise<ImageDescription[] | { error: string }> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: image_insertion_system,
      },
      {
        role: "user",
        content: image_insertion_user({
          elements,
          text,
          chunks,
        }),
      },
    ],
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMP,
  });

  console.log(
    "Image descriptions completion:",
    String(completion.choices[0].message.content),
  );

  try {
    let imageDescriptions = JSON.parse(
      String(completion.choices[0].message.content),
    );

    imageDescriptions = imageDescriptions.map(
      (imageDescription: ImageDescription) => ({
        ...imageDescription,
      }),
    );

    return imageDescriptions;
  } catch (error) {
    console.error("Error parsing image descriptions:", error);
    return { error: String(error) };
  }
}

export function formatTranscribedTranscript(
  transcript: TranscriptionResponse,
): { text: string; chunks: Partial<Segment>[] } {
  return {
    text: transcript.text,
    chunks: transcript.segments.map((segment) => ({
      text: segment.text,
      timestamp: [segment.start, segment.end],
    })),
  };
}

export async function getStabilityImage({
  start,
  end,
  prompt,
  supabase,
  aspect_ratio,
}: {
  start: number;
  end: number;
  prompt: string;
  supabase: any;
  aspect_ratio: string;
}) {
  const formData = {
    prompt,
    aspect_ratio,
    negative_prompt: video_negative_prompt,
  };
  const response = await axios.postForm(
    `https://api.stability.ai/v2beta/stable-image/generate/core`,
    axios.toFormData(formData, new FormD()),
    {
      validateStatus: undefined,
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer sk-KX60jNy75p0m3cmo34ccR5BUviFneCZJTOGazTp3oCB8iAWO`,
        Accept: "image/*",
      },
    },
  );
  if (response.status === 200) {
    // push the file to supabase, and return the url
    // fs.writeFileSync("./lighthouse.png", Buffer.from(response.data));

    const id = cuid();

    const { data } = await supabase.storage
      .from("videos")
      .upload(`public/${id}`, response.data, {
        contentType: "image/png",
      });

    console.log(
      `Generated image, start ${start}, end ${end} at ${process.env.SUPABASE_URL}/storage/v1/object/public/${data?.fullPath}`,
    );

    return {
      start,
      end,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${data?.fullPath}`,
    };
  } else {
    throw new Error(`${response.status}: ${response.data.toString()}`);
  }
}

export async function generateElevenLabsAudio({
  text,
  supabase,
  elevenlabsSettings,
}: {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  elevenlabsSettings: {
    model_id: string;
    voice_settings: { stability: number; similarity_boost: number };
  };
}) {
  if (!process.env.ELEVEN_LABS_API_KEY) {
    throw new Error("ELEVEN_LABS_API_KEY is not defined");
  }

  console.log(
    JSON.stringify({
      text,
      ...elevenlabsSettings,
    }),
  );

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVEN_LABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        ...elevenlabsSettings,
      }),
    },
  );

  console.log(`Eleven labs response: ${JSON.stringify(response)}`);

  if (!response.ok) {
    throw new Error(
      `API request failed with status ${JSON.stringify(response.status)}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const id = cuid();

  const { data } = await supabase.storage
    .from("videos")
    .upload(`public/${id}`, arrayBuffer, {
      contentType: "audio/mpeg",
    });

  const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${data?.fullPath}`;

  return {
    url,
  };
}
