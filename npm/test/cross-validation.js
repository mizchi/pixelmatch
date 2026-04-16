/**
 * Cross-validation test: verify @mizchi/pixelmatch produces identical results
 * to the original mapbox/pixelmatch for the overlapping API surface.
 *
 * Compared: diffCount and output image (byte-for-byte).
 */
import originalPixelmatch from "pixelmatch";
import { pixelmatch } from "../dist/index.js";
import { strict as assert } from "assert";

// ============================================================
// Helpers
// ============================================================

/** Create a solid RGBA image */
function solid(w, h, r, g, b, a = 255) {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    d[i * 4] = r;
    d[i * 4 + 1] = g;
    d[i * 4 + 2] = b;
    d[i * 4 + 3] = a;
  }
  return d;
}

/** Create a random RGBA image (seeded for reproducibility) */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >> 16) & 0xff;
  };
}

function randomImage(w, h, seed) {
  const rng = seededRandom(seed);
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < d.length; i++) d[i] = rng();
  return d;
}

/** Create gradient image */
function gradient(w, h, vertical = true) {
  const d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = vertical ? Math.round((y / h) * 255) : Math.round((x / w) * 255);
      const i = (y * w + x) * 4;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  return d;
}

/** Create image with a colored rectangle */
function withRect(base, w, _h, rx, ry, rw, rh, r, g, b) {
  const d = new Uint8Array(base);
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      const i = (y * w + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  return d;
}

// ============================================================
// Compare helper
// ============================================================

function compare(label, img1, img2, w, h, opts = {}) {
  const { threshold = 0.1, includeAA = false, alpha = 0.1, diffMask = false } = opts;

  // --- original mapbox/pixelmatch ---
  const origOut = new Uint8Array(w * h * 4);
  const origDiff = originalPixelmatch(img1, img2, origOut, w, h, {
    threshold,
    includeAA,
    alpha,
    diffMask,
  });

  // --- our @mizchi/pixelmatch ---
  const ourOut = new Uint8Array(w * h * 4);
  const { diffCount: ourDiff, output } = pixelmatch(img1, img2, w, h, {
    threshold,
    includeAA,
    alpha,
    diffMask,
    output: ourOut,
  });

  // Compare diff count
  if (origDiff !== ourDiff) {
    console.error(`  FAIL [${label}]: diffCount mismatch: original=${origDiff}, ours=${ourDiff}`);
    return false;
  }

  // Compare output image byte-for-byte
  let outputMismatch = 0;
  for (let i = 0; i < origOut.length; i++) {
    if (origOut[i] !== ourOut[i]) outputMismatch++;
  }

  if (outputMismatch > 0) {
    console.error(
      `  FAIL [${label}]: output mismatch: ${outputMismatch}/${origOut.length} bytes differ (diffCount=${origDiff})`
    );
    return false;
  }

  console.log(`  PASS [${label}]: diffCount=${origDiff}`);
  return true;
}

// ============================================================
// Test cases
// ============================================================

let passed = 0;
let failed = 0;

function run(label, img1, img2, w, h, opts) {
  if (compare(label, img1, img2, w, h, opts)) {
    passed++;
  } else {
    failed++;
  }
}

console.log("Cross-validation: @mizchi/pixelmatch vs mapbox/pixelmatch\n");

// --- Identical images ---
console.log("Category: identical images");
run("solid black", solid(50, 50, 0, 0, 0), solid(50, 50, 0, 0, 0), 50, 50);
run("solid white", solid(50, 50, 255, 255, 255), solid(50, 50, 255, 255, 255), 50, 50);
run("gradient", gradient(50, 50), gradient(50, 50), 50, 50);

// --- Completely different ---
console.log("\nCategory: completely different");
run("black vs white", solid(50, 50, 0, 0, 0), solid(50, 50, 255, 255, 255), 50, 50);
run("red vs blue", solid(50, 50, 255, 0, 0), solid(50, 50, 0, 0, 255), 50, 50);

// --- Partial diff ---
console.log("\nCategory: partial differences");
{
  const w = 50, h = 50;
  const bg = solid(w, h, 128, 128, 128);
  const modified = withRect(bg, w, h, 10, 10, 15, 15, 255, 0, 0);
  run("gray + red rect", bg, modified, w, h);
}
{
  const w = 100, h = 100;
  const bg = solid(w, h, 0, 0, 0);
  const modified = withRect(bg, w, h, 0, 0, 50, 100, 255, 255, 255);
  run("black + white left half", bg, modified, w, h);
}
{
  const w = 100, h = 100;
  const img1 = gradient(w, h, true);
  const img2 = gradient(w, h, false);
  run("vertical vs horizontal gradient", img1, img2, w, h);
}

// --- Random images ---
console.log("\nCategory: random noise");
run("random same seed", randomImage(30, 30, 42), randomImage(30, 30, 42), 30, 30);
run("random diff seeds", randomImage(30, 30, 42), randomImage(30, 30, 99), 30, 30);
run("random 100x100", randomImage(100, 100, 1), randomImage(100, 100, 2), 100, 100);

// --- Threshold variations ---
console.log("\nCategory: threshold variations");
{
  const w = 50, h = 50;
  const a = solid(w, h, 100, 100, 100);
  const b = solid(w, h, 110, 110, 110);
  run("near-threshold t=0.1", a, b, w, h, { threshold: 0.1 });
  run("near-threshold t=0.01", a, b, w, h, { threshold: 0.01 });
  run("near-threshold t=0.5", a, b, w, h, { threshold: 0.5 });
}

// --- Alpha / transparency ---
console.log("\nCategory: transparency");
run("opaque vs transparent", solid(50, 50, 255, 0, 0, 255), solid(50, 50, 255, 0, 0, 0), 50, 50);
run("semi-transparent", solid(50, 50, 255, 0, 0, 128), solid(50, 50, 0, 0, 255, 128), 50, 50);

// --- diffMask mode ---
console.log("\nCategory: diffMask mode");
{
  const w = 50, h = 50;
  const a = solid(w, h, 0, 0, 0);
  const b = withRect(solid(w, h, 0, 0, 0), w, h, 10, 10, 10, 10, 255, 255, 255);
  run("diffMask=true", a, b, w, h, { diffMask: true });
}

// --- includeAA ---
console.log("\nCategory: includeAA");
{
  const w = 50, h = 50;
  const a = solid(w, h, 0, 0, 0);
  const b = withRect(solid(w, h, 0, 0, 0), w, h, 10, 10, 10, 10, 255, 255, 255);
  run("includeAA=true", a, b, w, h, { includeAA: true });
  run("includeAA=false", a, b, w, h, { includeAA: false });
}

// --- Small images ---
console.log("\nCategory: small/edge-case sizes");
run("1x1 same", solid(1, 1, 0, 0, 0), solid(1, 1, 0, 0, 0), 1, 1);
run("1x1 diff", solid(1, 1, 0, 0, 0), solid(1, 1, 255, 255, 255), 1, 1);
run("2x2", solid(2, 2, 100, 0, 0), solid(2, 2, 0, 100, 0), 2, 2);
run("1x100", solid(1, 100, 0, 0, 0), solid(1, 100, 255, 0, 0), 1, 100);
run("100x1", solid(100, 1, 0, 0, 0), solid(100, 1, 0, 0, 255), 100, 1);

// --- Alpha blending output ---
console.log("\nCategory: alpha blending (output pixel correctness)");
{
  const w = 20, h = 20;
  const a = solid(w, h, 50, 100, 150);
  const b = solid(w, h, 50, 100, 150);
  run("alpha=0.1 identical", a, b, w, h, { alpha: 0.1 });
  run("alpha=0.5 identical", a, b, w, h, { alpha: 0.5 });
  run("alpha=1.0 identical", a, b, w, h, { alpha: 1.0 });
}

// ============================================================
// Summary
// ============================================================

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) {
  console.error("\nCross-validation FAILED");
  process.exit(1);
} else {
  console.log("\nAll cross-validation tests passed!");
}
