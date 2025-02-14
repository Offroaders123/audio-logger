#!/usr/bin/env node

import { argv } from "node:process";
import { collectFiles, processFiles, prettyMetadata } from "./index.js";

/**
 * @returns {never}
 */
function exitUsage() {
  console.error("Usage: audio-logger <music_directory> [-p]");
  process.exit(1);
}

if (argv.length > 4) {
  exitUsage();
}

/** @type {string} */
const MUSIC_DIR = /** @type {string} */ (process.argv[2]);
/** @type {boolean} */
const PRETTY_OUT = argv.length === 4 && (argv.at(3) === "-p" || exitUsage());

// Run the script
/** @type {AsyncGenerator<string, void, void>} */
const files = collectFiles(MUSIC_DIR);

/** @type {AsyncGenerator<import("./index.js").Metadata, void, void>} */
const metadataList = processFiles(MUSIC_DIR, files);

// Log results
if (PRETTY_OUT) {
  for await (const entry of metadataList) {
    console.log(prettyMetadata(entry));
  }
} else {
  /** @type {import("./index.js").Metadata[]} */
  const results = (await Array.fromAsync(metadataList));
  /** @type {string} */
  const json = JSON.stringify(results, null, 2);
  console.log(json);
}
