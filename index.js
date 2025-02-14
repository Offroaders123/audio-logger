#!/usr/bin/env node

import { readdir, stat, writeFile } from 'fs/promises';
import { resolve, extname, relative, sep, basename, join } from 'path';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';

if (process.argv.length < 3) {
  console.error("Usage: ./audio-logger <music_directory> [-o]");
  process.exit(1);
}

/** @type {string} */
const MUSIC_DIR = resolve(/** @type {string} */ (process.argv[2])); // Ensure absolute path
/** @type {boolean} */
const SAVE_LOG = process.argv.some(arg => arg === "-o");
const OUTPUT_LOG = "music_metadata.log";

/**
 * @typedef {{ file: string; extension: string; codec: string; bitrate: string; sampleRate: string; artist: string; album: string; title: string; }} Metadata
 */

/**
 * Extracts metadata from an audio file.
 * @param {string} filePath
 * @returns {Promise<Metadata | null>}
 */
async function getMetadata(filePath) {
  try {
    const metadata = await ffprobe(filePath, { path: ffprobeStatic.path });

    const audioStream = metadata.streams.find(stream => stream.codec_type === "audio");

    const { artist, album, title } = extractMusicInfo(filePath);

    return {
      file: filePath,
      extension: extname(filePath),
      codec: audioStream?.codec_name || "Unknown",
      bitrate: audioStream?.bit_rate ? `${(audioStream.bit_rate / 1000).toFixed(1)} kbps` : "Unknown",
      sampleRate: audioStream?.sample_rate ? `${audioStream.sample_rate} Hz` : "Unknown",
      artist,
      album,
      title
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Extracts Artist, Album, and Title from the file path.
 * Works with both:
 *   - Full music directory `/Users/brandon/Music/Music/Media/Music/`
 *   - Artist folders `/Users/brandon/Music/Music/Media/Music/Himiko Kikuchi/`
 *   - Album folders `/Users/brandon/Music/Music/Media/Music/Himiko Kikuchi/Album Name`
 * @param {string} filePath
 * @returns {{ artist: string; album: string; title: string }}
 */
function extractMusicInfo(filePath) {
  const relativePath = relative(MUSIC_DIR, filePath);
  const pathParts = relativePath.split(sep);

  return {
    artist: pathParts.at(-3) ?? "<artist>",
    album: pathParts.at(-2) ?? "<album>",
    title: basename(filePath, extname(filePath))
  };
}

/**
 * @param {string} dir
 * @returns {AsyncGenerator<Metadata, void, void>}
 */
async function* processDirectory(dir) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
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

/**
 * @param {Metadata} entry
 */
function prettyMetadata(entry) {
  return (
    `\n${entry.title} (${entry.extension})` +
    `\n${entry.artist} - ${entry.album}` +
    `\nCodec: ${entry.codec}` +
    `\nBitrate: ${entry.bitrate}` +
    `\nSample Rate: ${entry.sampleRate}\n`
  );
}

if (!SAVE_LOG) {
  // Log results
  for await (const entry of metadataList) {
    console.log(prettyMetadata(entry));
  }
} else {
  console.log("Calculating metadata... (may take some time)");

  // Write to log file
  /** @type {string} */
  const logData = (await Array.fromAsync(metadataList))
    .map(prettyMetadata)
    .join("\n");

  await writeFile(OUTPUT_LOG, logData);
  console.log(`Metadata logged to '${OUTPUT_LOG}'`);
}
