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
const OUTPUT_LOG = "music_metadata.log";

/**
 * @typedef {{ file: string; extension: string; codec: any; bitrate: string; sampleRate: string; }} Metadata
 */

/**
 * @param {string} filePath
 * @returns {Metadata | null}
 */
function getMetadata(filePath) {
  try {
    const command = `ffprobe -v quiet -print_format json -show_format "${filePath}"`;
    const output = execSync(command, { encoding: "utf8" });
    const metadata = JSON.parse(output);

    return {
      file: path.basename(filePath),
      extension: path.extname(filePath),
      codec: metadata.format.format_name || "Unknown",
      bitrate: metadata.format.bit_rate ? `${(metadata.format.bit_rate / 1000).toFixed(1)} kbps` : "Unknown",
      sampleRate: metadata.format.sample_rate ? `${metadata.format.sample_rate} Hz` : "Unknown"
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * @param {string} dir
 * @returns {Metadata[]}
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  /** @type {Metadata[]} */
  let results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(processDirectory(filePath));
    } else if (/\.(mp3|flac|wav|m4a|aac|ogg|wma)$/i.test(file)) {
      const metadata = getMetadata(filePath);
      if (metadata) results.push(metadata);
    }
  }
  return results;
}

// Run the script
/** @type {Metadata[]} */
const metadataList = processDirectory(MUSIC_DIR);

// Write to log file
/** @type {string} */
const logData = metadataList.map(entry =>
  `${entry.file} (${entry.extension})\nCodec: ${entry.codec}\nBitrate: ${entry.bitrate}\nSample Rate: ${entry.sampleRate}\n`
).join("\n");

fs.writeFileSync(OUTPUT_LOG, logData);
console.log(`Metadata logged to ${OUTPUT_LOG}`);
