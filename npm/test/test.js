import { pixelmatch, pixelmatchSimple, matchRatio, diffReport } from "../dist/index.js";
import { strict as assert } from "assert";

// Helper: create solid RGBA image data
function makeSolid(w, h, r, g, b, a = 255) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return data;
}

// Helper: fake ImageData (Canvas-like)
function makeImageData(w, h, r, g, b, a = 255) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return { width: w, height: h, data };
}

console.log("Test 1: identical images → 0 diff");
{
  const img = makeSolid(10, 10, 128, 128, 128);
  const result = pixelmatch(img, img, 10, 10);
  assert.equal(result.diffCount, 0);
  console.log("  PASS");
}

console.log("Test 2: completely different images");
{
  const img1 = makeSolid(10, 10, 0, 0, 0);
  const img2 = makeSolid(10, 10, 255, 255, 255);
  const result = pixelmatch(img1, img2, 10, 10);
  assert.equal(result.diffCount, 100);
  console.log("  PASS: diffCount =", result.diffCount);
}

console.log("Test 3: pixelmatch with output buffer");
{
  const img1 = makeSolid(10, 10, 0, 0, 0);
  const img2 = makeSolid(10, 10, 255, 255, 255);
  const output = new Uint8Array(10 * 10 * 4);
  const result = pixelmatch(img1, img2, 10, 10, { output });
  assert.equal(result.diffCount, 100);
  assert.ok(result.output);
  assert.equal(result.output[0], 255); // R
  assert.equal(result.output[1], 0);   // G
  assert.equal(result.output[2], 0);   // B
  assert.equal(result.output[3], 255); // A
  console.log("  PASS: output buffer written");
}

console.log("Test 4: pixelmatchSimple");
{
  const img1 = makeSolid(10, 10, 0, 0, 0);
  const img2 = makeSolid(10, 10, 255, 255, 255);
  const diff = pixelmatchSimple(img1, img2, 10, 10);
  assert.equal(diff, 100);
  console.log("  PASS: diff =", diff);
}

console.log("Test 5: matchRatio identical");
{
  const img = makeSolid(10, 10, 128, 128, 128);
  const ratio = matchRatio(img, img, 10, 10);
  assert.equal(ratio, 1.0);
  console.log("  PASS: ratio =", ratio);
}

console.log("Test 6: matchRatio completely different");
{
  const img1 = makeSolid(10, 10, 0, 0, 0);
  const img2 = makeSolid(10, 10, 255, 255, 255);
  const ratio = matchRatio(img1, img2, 10, 10);
  assert.equal(ratio, 0.0);
  console.log("  PASS: ratio =", ratio);
}

console.log("Test 7: diffReport (camelCase fields)");
{
  const img1 = makeSolid(20, 20, 128, 128, 128);
  const img2 = makeSolid(20, 20, 128, 128, 128);
  // Make a small region different
  for (let y = 5; y < 10; y++) {
    for (let x = 5; x < 10; x++) {
      const i = (y * 20 + x) * 4;
      img2[i] = 255;
      img2[i + 1] = 0;
      img2[i + 2] = 0;
    }
  }
  const report = diffReport(img1, img2, 20, 20);
  // Verify camelCase field names
  assert.equal(report.width, 20);
  assert.equal(report.height, 20);
  assert.equal(report.totalPixels, 400);
  assert.ok(report.diffCount > 0);
  assert.ok(report.matchRatio > 0 && report.matchRatio < 1);
  assert.ok(report.aaCount >= 0);
  assert.ok(Array.isArray(report.grid));
  assert.ok(Array.isArray(report.regions));
  assert.equal(typeof report.shiftOnly, "boolean");
  assert.equal(typeof report.contentChangeCount, "number");
  assert.equal(typeof report.globalShift, "number");
  assert.equal(typeof report.compensatedDiffCount, "number");
  assert.ok(Array.isArray(report.shiftRegions));
  // Verify region fields are camelCase
  if (report.regions.length > 0) {
    const r = report.regions[0];
    assert.equal(typeof r.diffPixels, "number");
    assert.ok(["shift", "content", "edge"].includes(r.regionType));
  }
  console.log("  PASS: diffCount =", report.diffCount, "matchRatio =", report.matchRatio);
}

console.log("Test 8: diffReport with shift detection");
{
  const img1 = makeSolid(20, 20, 128, 128, 128);
  const img2 = makeSolid(20, 20, 128, 128, 128);
  const report = diffReport(img1, img2, 20, 20, { detectShift: true });
  assert.equal(report.diffCount, 0);
  assert.ok(Array.isArray(report.shiftRegions));
  if (report.shiftRegions.length > 0) {
    const sr = report.shiftRegions[0];
    assert.equal(typeof sr.yStart, "number");
    assert.equal(typeof sr.yEnd, "number");
    assert.equal(typeof sr.shift, "number");
  }
  console.log("  PASS");
}

console.log("Test 9: ImageData input (Canvas-like)");
{
  const img1 = makeImageData(10, 10, 0, 0, 0);
  const img2 = makeImageData(10, 10, 255, 255, 255);
  const result = pixelmatch(img1, img2, 10, 10);
  assert.equal(result.diffCount, 100);
  console.log("  PASS: ImageData input works");
}

console.log("Test 10: ImageData with pixelmatchSimple");
{
  const img1 = makeImageData(10, 10, 0, 0, 0);
  const img2 = makeImageData(10, 10, 255, 255, 255);
  const diff = pixelmatchSimple(img1, img2, 10, 10);
  assert.equal(diff, 100);
  console.log("  PASS: diff =", diff);
}

console.log("\nAll tests passed!");
