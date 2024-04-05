import { exec } from "child_process";
import fs from "fs";
import { writeFile, readFile, unlink } from "fs/promises";
import path from "path";

import { v4 as uuidv4 } from "uuid";

import { Image } from "./utils";

export async function combine({ images }: { images: Image[] }) {
  try {
    console.log("Images to combine: ", images);
    const tempDirectory = "";
    const videoPaths: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i].url;
      const imagePath = path.join(tempDirectory, `image_${i}.jpeg`);
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      await writeFile(imagePath, buffer);

      const videoPath = path.join(tempDirectory, `video_${i}.mp4`);
      const videoLength = calculateDuration(images[i].start, images[i].end);
      const fps = 25;

      await convertImageToVideo(imagePath, videoLength, fps, videoPath);
      videoPaths.push(videoPath);
    }

    const fileListPath = path.join(tempDirectory, "filelist.txt");
    const fileListContent = videoPaths.map((vp) => `file '${vp}'`).join("\n");
    await writeFile(fileListPath, fileListContent);

    const id = uuidv4();
    const outputVideoPath = path.join(tempDirectory, `output_${id}.mp4`);
    await mergeVideos(fileListPath, outputVideoPath);
    await cleanupGeneratedFiles(fileListPath);

    return { videoPath: outputVideoPath };
  } catch (error) {
    console.error("Error in combine action:", error);
    return { error: error.message };
  }
}

function calculateDuration(start: number, end: number): number {
  return end - start;
}

export async function convertImageToVideo(
  imagePath: string,
  videoLength: number,
  fps: number,
  outputVideoPath: string,
): Promise<void> {
  const command = `ffmpeg -loop 1 -i "${imagePath}" -c:v libx264 -t ${videoLength} -pix_fmt yuv420p -vf fps=${fps} -y "${outputVideoPath}"`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error);
        return reject(
          new Error(`Error converting image to video: ${error.message}`),
        );
      }
      console.log("stdout:", stdout);
      console.error("stderr:", stderr);
      resolve();
    });
  });
}

export async function mergeVideos(
  videoListFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const command = `ffmpeg -f concat -safe 0 -i "${videoListFilePath}" -c copy -y "${outputFilePath}"`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error);
        return reject(new Error(`Error merging videos: ${error.message}`));
      }
      console.log("stdout:", stdout);
      console.error("stderr:", stderr);
      resolve();
    });
  });
}

export async function cleanupGeneratedFiles(
  fileListPath: string,
): Promise<void> {
  try {
    const fileListContent = await readFile(fileListPath, "utf-8");
    const filePaths = fileListContent
      .split("\n")
      .map((line) => line.trim().replace(/^file '(.+)'$/, "$1"));

    for (const filePath of filePaths) {
      if (filePath) {
        await unlink(filePath);
      }
    }

    await unlink(fileListPath);
  } catch (error) {
    console.error("Error cleaning up generated files:", error);
  }
}

export async function createSlideshowFromBuffers(
  imageBuffers: ArrayBuffer[],
): Promise<string> {
  const tempDirectory = "/home/node";
  const videoPaths: string[] = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    const imagePath = path.join(tempDirectory, `image_${i}.jpeg`);
    const videoPath = path.join(tempDirectory, `video_${i}.mp4`);
    const buffer = Buffer.from(imageBuffers[i]);
    const fps = 25;
    const length_s = 2;
    console.log("writing file");
    await writeFile(imagePath, buffer);
    console.log("converting image");
    await convertImageToVideo(imagePath, length_s, fps, videoPath);
    await unlink(imagePath);
    videoPaths.push(videoPath);
  }

  const fileListPath = path.join(tempDirectory, "filelist.txt");
  const fileListContent = videoPaths
    .map((videoPath) => `file '${videoPath}'`)
    .join("\n");
  await writeFile(fileListPath, fileListContent);

  const outputVideoPath = path.join(tempDirectory, "merged.mp4");
  await mergeVideos(fileListPath, outputVideoPath);
  // const videoBuffer = await readFile(outputVideoPath);
  return outputVideoPath;
}

export async function merge({
  videoFilePath,
  audioFilePath,
  supabase,
}: {
  videoFilePath: string;
  audioFilePath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}) {
  const id = uuidv4();
  const outputFilePath = `merged_${id}.mp4`;

  // Construct the ffmpeg command
  const command = `ffmpeg -i "${videoFilePath}" -i "${audioFilePath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a libmp3lame -ac 2 -shortest -y "${outputFilePath}"`;

  return new Promise((resolve, reject) => {
    exec(command, async (error) => {
      if (error) {
        console.error("Error:", error);
        return reject({
          message: "Error merging video and audio",
          error: error.message,
        });
      }

      // Read the merged video file
      const videoFile = fs.readFileSync(outputFilePath);
      const { data, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(`public/${id}.mp4`, videoFile, {
          contentType: "video/mp4",
        });

      if (uploadError) {
        console.error("Error uploading video to Supabase:", uploadError);
        return reject({
          message: "Error uploading video to Supabase",
          error: uploadError.message,
        });
      }

      const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${data?.fullPath}`;
      return resolve({
        url,
      });
    });
  });
}
