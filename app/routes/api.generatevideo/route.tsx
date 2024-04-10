import { ActionFunctionArgs, json } from "@remix-run/node";
import { createServerClient, parse, serialize } from "@supabase/ssr";

import { createVideo } from "~/models/video.server";

import {
  Image,
  formatTranscribedTranscript,
  generateStyle,
  generateTranscript,
  transcribeAudio,
  getImageDescriptions,
  ImageDescription,
  generateConsistantCharacters,
  getStabilityImage,
  CHARACTER_LIMIT,
  generateElevenLabsAudio,
  elevenlabsSettings,
  batch_size,
} from "./utils";
import { combine, merge } from "./video_utils";
import { createStableDiffusionPrompt } from "./prompts";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { text, aspect_ratio, userId } = await request.json();
  console.log(`Text: ${text}, Aspect ratio: ${aspect_ratio}`);

  console.log(`Generating video for user: ${userId}`);

  if (!process.env.ELEVEN_LABS_API_KEY) {
    throw new Error("ELEVEN_LABS_API_KEY is not defined");
  }

  if (!text) {
    throw Error("Text is required");
  }

  const supabase = initSupabase({ request });

  // make sure text is under the character limit
  if (text.length > CHARACTER_LIMIT) {
    throw Error(`Text is too long: ${text.length}`);
  }

  const images: Image[] = [];

  console.log(
    `Generating video for text: ${text} with length: ${text.length} characters`,
  );

  const [base_style, image_consistancies] = await Promise.all([
    generateStyle(text),
    generateConsistantCharacters(text),
  ]);

  if (
    typeof image_consistancies === "object" &&
    image_consistancies !== null &&
    "error" in image_consistancies
  ) {
    throw Error(image_consistancies.error);
  }

  console.log(
    `Image consistancies: ${JSON.stringify(
      image_consistancies,
      null,
      2,
    )}\nBase style: ${base_style}`,
  );

  // const image_consistancies_obj = image_consistancies.reduce(
  //   (acc, curr) => {
  //     acc[curr.id] = curr;
  //     return acc;
  //   },
  //   {} as Record<string, { name: string; description: string; id: string }>,
  // );

  // console.log(
  //   `Image consistancies object: ${JSON.stringify(
  //     image_consistancies_obj,
  //     null,
  //     2,
  //   )}`,
  // );

  const transcript = await generateTranscript({
    text,
  });

  console.log(`Generated transcript: ${JSON.stringify(transcript, null, 2)}`);

  const audioURL = await generateElevenLabsAudio({
    text: transcript.transcript,
    supabase,
    elevenlabsSettings: elevenlabsSettings,
  });

  console.log(`Generated audio URL: ${JSON.stringify(audioURL, null, 2)}`);

  const transcribedAudio = await transcribeAudio({
    audioUrl: audioURL.url,
  });

  const audioTranscription = formatTranscribedTranscript(
    transcribedAudio.transcription,
  );

  console.log(
    `Generated audio transcription: ${JSON.stringify(audioTranscription, null, 2)}`,
  );

  // add something in here to generate a coherent story line

  // pass the story line to the image descriptions
  const imageDescriptions = await getImageDescriptions(
    image_consistancies,
    audioTranscription.text,
    audioTranscription.chunks,
  );

  console.log(
    `Generated ${imageDescriptions.length} image descriptions: ${JSON.stringify(
      imageDescriptions,
      null,
      2,
    )}`,
  );

  // batch
  const imageDescription_batches: ImageDescription[][] =
    imageDescriptions.reduce((acc, _, i) => {
      if (i % batch_size === 0) {
        acc.push(imageDescriptions.slice(i, i + batch_size));
      }
      return acc;
    }, []);

  for (const imageDescription_batch of imageDescription_batches) {
    const images_batch = await Promise.all(
      imageDescription_batch.map(async (imageDescription) => {
        const prompt = createStableDiffusionPrompt(
          image_consistancies,
          base_style,
          imageDescription.description,
        );
        console.log("Prompt: ", prompt);
        return getStabilityImage({
          start: imageDescription.start,
          end: imageDescription.end,
          prompt,
          supabase,
          aspect_ratio,
        });
      }),
    );

    images.push(...images_batch.flat());
  }

  console.log(`Generating videos`);

  const { videoPath } = await combine({
    images,
  });

  const { url } = await merge({
    videoFilePath: videoPath,
    audioFilePath: audioURL.url,
    supabase,
  });

  console.log(`Merged video URL: ${url}`);

  // TODO - implement ourselves with Whisper transcript segments and ffmpeg - this is super slow!
  // const captionResponse = await fetch("http://localhost:3000/api/caption", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ video_file_input: url }),
  // });

  // const caption = await captionResponse.json();

  // create it in the database

  const createdVideo = await createVideo({
    url,
    userId,
  });

  return json({
    base_style,
    image_consistancies_obj,
    image_consistancies,
    imageDescriptions,
    images,
    createdVideo,
  });
};

function initSupabase({ request }: { request: Request }) {
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();

  // we should do this at root and pass down as context?
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    },
  );
}
