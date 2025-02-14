#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';

if (process.argv.length < 3) {
  console.error("Usage: ./audio-logger <music_directory>");
  process.exit(1);
}

/** @type {string} */
const MUSIC_DIR = /** @type {string} */ (process.argv[2]);

/**
 * @typedef {{ file: string; extension: string; codec: string; bitrate: string; sampleRate: string; }} Metadata
 */

/**
 * @param {string} filePath
 * @returns {Promise<Metadata | null>}
 */
async function getMetadata(filePath) {
  try {
    const metadata = await ffprobe(filePath, { path: ffprobeStatic.path });

    const audioStream = metadata.streams.find(stream => stream.codec_type === "audio");

    return {
      file: path.basename(filePath),
      extension: path.extname(filePath),
      codec: audioStream?.codec_name || "Unknown",
      bitrate: audioStream?.bit_rate ? `${(audioStream.bit_rate / 1000).toFixed(1)} kbps` : "Unknown",
      sampleRate: audioStream?.sample_rate ? `${audioStream.sample_rate} Hz` : "Unknown"
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * @param {string} dir
 * @returns {AsyncGenerator<Metadata, void, void>}
 */
async function* processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      yield* processDirectory(filePath);
    } else if (/\.(mp3|flac|wav|m4a|aac|ogg|wma)$/i.test(file)) {
      const metadata = await getMetadata(filePath);
      if (metadata) yield metadata;
    }
  }
}

// Run the script
/** @type {AsyncGenerator<Metadata>} */
const metadataList = processDirectory(MUSIC_DIR);

// Log results
for await (const entry of metadataList) {
  console.log(
    `\n${entry.file} (${entry.extension})` +
    `\nCodec: ${entry.codec}` +
    `\nBitrate: ${entry.bitrate}` +
    `\nSample Rate: ${entry.sampleRate}\n`
  );
}
