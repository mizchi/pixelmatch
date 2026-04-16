// @mizchi/pixelmatch - Fast pixel-level image comparison
// Generated from MoonBit source code
import {
  pixelmatch_js,
  pixelmatch_simple_js,
  match_ratio_js,
  diff_report_js,
} from "./pixelmatch.gen.js";

/**
 * Extract RGBA data as a plain number[] from various input types.
 * Supports Uint8Array, Uint8ClampedArray, number[], and Canvas ImageData.
 */
function toIntArray(data) {
  // Canvas ImageData
  if (data && typeof data === "object" && "data" in data && "width" in data) {
    return Array.from(data.data);
  }
  if (Array.isArray(data)) return data;
  return Array.from(data);
}

/**
 * Convert a DiffRegion from snake_case (MoonBit JSON) to camelCase.
 */
function mapRegion(r) {
  return {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    diffPixels: r.diff_pixels,
    regionType: r.region_type,
  };
}

/**
 * Convert a ShiftRegion from snake_case to camelCase.
 */
function mapShiftRegion(r) {
  return {
    yStart: r.y_start,
    yEnd: r.y_end,
    shift: r.shift,
  };
}

/**
 * Convert a DiffReport from snake_case to camelCase.
 */
function mapReport(r) {
  return {
    width: r.width,
    height: r.height,
    totalPixels: r.total_pixels,
    diffCount: r.diff_count,
    aaCount: r.aa_count,
    matchRatio: r.match_ratio,
    grid: r.grid,
    regions: (r.regions || []).map(mapRegion),
    shiftOnly: r.shift_only,
    contentChangeCount: r.content_change_count,
    globalShift: r.global_shift,
    compensatedDiffCount: r.compensated_diff_count,
    shiftRegions: (r.shift_regions || []).map(mapShiftRegion),
  };
}

/**
 * Compare two images pixel by pixel.
 */
export function pixelmatch(img1, img2, width, height, options = {}) {
  const {
    threshold = 0.1,
    includeAA = false,
    alpha = 0.1,
    diffMask = false,
    output,
  } = options;

  const includeOutput = output != null;
  const result = JSON.parse(
    pixelmatch_js(
      toIntArray(img1),
      toIntArray(img2),
      width,
      height,
      includeOutput,
      threshold,
      includeAA,
      alpha,
      diffMask,
    ),
  );

  if (result.output && output) {
    const arr = result.output;
    if (output instanceof Uint8Array || output instanceof Uint8ClampedArray) {
      for (let i = 0; i < arr.length; i++) {
        output[i] = arr[i];
      }
    }
    return { diffCount: result.diffCount, output };
  }

  if (result.output) {
    return {
      diffCount: result.diffCount,
      output: new Uint8Array(result.output),
    };
  }

  return { diffCount: result.diffCount };
}

/**
 * Simple (fast) pixel comparison without anti-aliasing detection.
 * @returns Number of different pixels
 */
export function pixelmatchSimple(img1, img2, width, height, threshold = 0.1) {
  return pixelmatch_simple_js(
    toIntArray(img1),
    toIntArray(img2),
    width,
    height,
    threshold,
  );
}

/**
 * Calculate match ratio between two images.
 * @returns Match ratio (0.0 = completely different, 1.0 = identical)
 */
export function matchRatio(img1, img2, width, height, options = {}) {
  const {
    threshold = 0.1,
    includeAA = false,
    alpha = 0.1,
    diffMask = false,
  } = options;

  return match_ratio_js(
    toIntArray(img1),
    toIntArray(img2),
    width,
    height,
    threshold,
    includeAA,
    alpha,
    diffMask,
  );
}

/**
 * Generate a comprehensive diff report with clustering and shift detection.
 */
export function diffReport(img1, img2, width, height, options = {}) {
  const {
    threshold = 0.1,
    includeAA = false,
    alpha = 0.1,
    diffMask = false,
    gridSize = 10,
    detectShift = false,
  } = options;

  const raw = JSON.parse(
    diff_report_js(
      toIntArray(img1),
      toIntArray(img2),
      width,
      height,
      threshold,
      includeAA,
      alpha,
      diffMask,
      gridSize,
      detectShift,
    ),
  );

  return mapReport(raw);
}
