#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

if (process.argv.length < 3) {
  console.error("Usage: ./audio-logger <music_directory>");
  process.exit(1);
}

/** @type {string} */
const MUSIC_DIR = /** @type {string} */ (process.argv[2]);

/**
 * @typedef {{ file: string; extension: string; codec: any; bitrate: string; sampleRate: string; }} Metadata
 */

/**
 * @param {string} filePath
 * @returns {Metadata | null}
 */
function getMetadata(filePath) {
  try {
    const command = `ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`;
    const output = execSync(command, { encoding: "utf8" });
    const metadata = JSON.parse(output);

    const audioStream = metadata.streams.find(stream => stream.codec_type === "audio");

    return {
      file: path.basename(filePath),
      extension: path.extname(filePath),
      codec: audioStream ? audioStream.codec_name : "Unknown",
      bitrate: metadata.format.bit_rate ? `${(metadata.format.bit_rate / 1000).toFixed(1)} kbps` : "Unknown",
      sampleRate: audioStream ? `${audioStream.sample_rate} Hz` : "Unknown"
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * @param {string} dir
 * @returns {Generator<Metadata, void, void>}
 */
function* processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      yield* processDirectory(filePath);
    } else if (/\.(mp3|flac|wav|m4a|aac|ogg|wma)$/i.test(file)) {
      const metadata = getMetadata(filePath);
      if (metadata) yield metadata;
    }
  }
}

// Run the script
/** @type {Generator<Metadata>} */
const metadataList = processDirectory(MUSIC_DIR);

// Log results
for (const entry of metadataList) {
  console.log(
    `\n${entry.file} (${entry.extension})` +
    `\nCodec: ${entry.codec}` +
    `\nBitrate: ${entry.bitrate}` +
    `\nSample Rate: ${entry.sampleRate}\n`
  );
}
