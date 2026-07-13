/**
 * Manual HEIC conversion smoke test:
 *   node scripts/test-heic-convert.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const samplePath = path.join(root, "tmp", "sample2.heic");
const outPath = path.join(root, "tmp", "test-heic-out.jpg");

if (!fs.existsSync(samplePath)) {
  console.error("Missing tmp/sample2.heic — download a HEIC sample first.");
  process.exit(1);
}

const buffer = fs.readFileSync(samplePath);
console.log("Input:", samplePath, `(${buffer.length} bytes)`);

let sharpFailed = false;
try {
  const sharp = require("sharp");
  await sharp(buffer).jpeg().toBuffer();
  console.log("sharp: unexpected success");
} catch (err) {
  sharpFailed = true;
  console.log("sharp: failed (expected for HEVC/HEIC)");
}

const convert = require("heic-convert");
const output = Buffer.from(
  await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  })
);

if (!output.length) {
  console.error("heic-convert produced empty output");
  process.exit(1);
}

fs.writeFileSync(outPath, output);
console.log("heic-convert: OK", `${output.length} bytes → ${outPath}`);
console.log(sharpFailed ? "PASS: fallback path is the correct approach" : "WARN: sharp worked unexpectedly");
