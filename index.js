#!/usr/bin/env node

import { readdir, stat } from "node:fs/promises";
import { extname, relative, sep, basename, join } from "node:path";
import ffprobe from "ffprobe";
import { path as ffprobeStaticPath } from "ffprobe-static";

if (process.argv.length !== 3) {
  console.error("Usage: ./audio-logger <music_directory>");
  process.exit(1);
}

/** @type {string} */
const MUSIC_DIR = /** @type {string} */ (process.argv[2]);

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
    /** @type {import("ffprobe").FFProbeResult} */
    const metadata = await ffprobe(filePath, { path: ffprobeStaticPath });
    /** @type {import("ffprobe").FFProbeStream | null} */
    const audioStream = metadata.streams.find(stream => stream.codec_type === "audio") ?? null;
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
 *   - Full music directory `~/Music/Music/Media/Music/`
 *   - Artist folders `~/Music/Music/Media/Music/<artist>/`
 *   - Album folders `~/Music/Music/Media/Music/<artist>/<album>/`
 * @param {string} filePath
 * @returns {{ artist: string; album: string; title: string }}
 */
function extractMusicInfo(filePath) {
  /** @type {string} */
  const relativePath = relative(MUSIC_DIR, filePath);
  /** @type {string[]} */
  const pathParts = relativePath.split(sep);

  return {
    artist: pathParts.at(-3) ?? "<artist>",
    album: pathParts.at(-2) ?? "<album>",
    title: basename(filePath, extname(filePath))
  };
}

/**
 * @param {string} dir
 * @returns {AsyncGenerator<string, void, void>}
 */
async function* collectFiles(dir) {
  /** @type {string[]} */
  const files = await readdir(dir);

  for (const file of files) {
    /** @type {string} */
    const filePath = join(dir, file);
    /** @type {import("node:fs").Stats} */
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      yield* collectFiles(filePath);
    } else if (/\.(mp3|flac|wav|m4a|aac|ogg|wma)$/i.test(file)) {
      yield filePath;
    }
  }
}

/**
 * @param {AsyncGenerator<string, void, void>} files
 * @returns {AsyncGenerator<Metadata, void, void>}
*/
async function* processFiles(files) {
  for await (const filePath of files) {
    /** @type {Metadata | null} */
    const metadata = await getMetadata(filePath);
    if (!metadata) continue;
    yield metadata;
  }
}

// Run the script
/** @type {AsyncGenerator<string, void, void>} */
const files = collectFiles(MUSIC_DIR);

/** @type {AsyncGenerator<Metadata, void, void>} */
const metadataList = processFiles(files);

/**
 * @param {Metadata} entry
 * @returns {string}
 */
function prettyMetadata({ artist, album, title, extension, codec, bitrate, sampleRate }) {
  return `\
${title} (${extension})
${artist} - ${album}
Codec: ${codec}
Bitrate: ${bitrate}
Sample Rate: ${sampleRate}
`;
}

// Log results
for await (const entry of metadataList) {
  console.log(prettyMetadata(entry));
}
