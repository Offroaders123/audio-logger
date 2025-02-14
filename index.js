#!/usr/bin/env node

import { readdir, stat } from "node:fs/promises";
import { extname, relative, sep, basename, join } from "node:path";
import { argv } from "node:process";
import ffprobe from "ffprobe";
import { path as ffprobeStaticPath } from "ffprobe-static";

if (argv.length !== 3) {
  console.error("Usage: ./audio-logger <music_directory>");
  process.exit(1);
}

/** @type {string} */
const MUSIC_DIR = /** @type {string} */ (process.argv[2]);

/**
 * @typedef {{
 * path: string;
 * title: string;
 * artist?: string;
 * album?: string;
 * extension: string;
 * codec_name: string;
 * bit_rate?: number;
 * sample_rate?: number;
 * }} Metadata
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
      path: filePath,
      title,
      artist,
      album,
      extension: extname(filePath),
      codec_name: audioStream?.codec_name || "Unknown",
      bit_rate: typeof audioStream?.bit_rate !== "undefined" ? (audioStream.bit_rate / 1000) : undefined,
      sample_rate: typeof audioStream?.sample_rate !== "undefined" ? audioStream.sample_rate / 1000 : undefined
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
 * @returns {{
 * title: string;
 * artist?: string;
 * album?: string;
 * }}
 */
function extractMusicInfo(filePath) {
  /** @type {string} */
  const relativePath = relative(MUSIC_DIR, filePath);
  /** @type {string[]} */
  const pathParts = relativePath.split(sep);

  return {
    title: basename(filePath, extname(filePath)),
    artist: pathParts.at(-3),
    album: pathParts.at(-2)
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
function prettyMetadata({
  title,
  artist,
  album,
  extension,
  codec_name,
  bit_rate,
  sample_rate
}) {
  return `\
${title} (${extension})
${artist ?? "<artist>"} - ${album ?? "<album>"}
Codec Name: ${codec_name}
Bit Rate: ${bit_rate ?? "<unknown>"} kbps
Sample Rate: ${sample_rate ?? "<unknown>"} kHz
`;
}

// Log results
for await (const entry of metadataList) {
  console.log(prettyMetadata(entry));
}
