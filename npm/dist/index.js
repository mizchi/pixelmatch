// @mizchi/pixelmatch - Fast pixel-level image comparison
// Generated from MoonBit source code
import {
  pixelmatch_js,
  pixelmatch_simple_js,
  match_ratio_js,
  diff_report_js,
} from "./pixelmatch.gen.js";

/**
 * Convert Uint8Array/Uint8ClampedArray RGBA data to a plain Array for MoonBit interop.
 * @param {Uint8Array | Uint8ClampedArray | number[]} data
 * @returns {number[]}
 */
function toIntArray(data) {
  if (Array.isArray(data)) return data;
  return Array.from(data);
}

/**
 * Compare two images pixel by pixel.
 *
 * @param {Uint8Array | Uint8ClampedArray | number[]} img1 - RGBA pixel data of image 1
 * @param {Uint8Array | Uint8ClampedArray | number[]} img2 - RGBA pixel data of image 2
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {object} [options] - Comparison options
 * @param {number} [options.threshold=0.1] - Matching threshold (0 to 1). Smaller = more sensitive.
 * @param {boolean} [options.includeAA=false] - Whether to count anti-aliased pixels as diff
 * @param {number} [options.alpha=0.1] - Blending factor of unchanged pixels in output
 * @param {boolean} [options.diffMask=false] - Draw only changed pixels in output
 * @param {Uint8Array | number[]} [options.output] - Optional output buffer (same size as input). If provided, diff image will be written here.
 * @returns {{ diffCount: number, output?: Uint8Array }}
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
    return { diffCount: result.diffCount, output: new Uint8Array(result.output) };
  }

  return { diffCount: result.diffCount };
}

/**
 * Simple (fast) pixel comparison without anti-aliasing detection.
 *
 * @param {Uint8Array | Uint8ClampedArray | number[]} img1 - RGBA pixel data of image 1
 * @param {Uint8Array | Uint8ClampedArray | number[]} img2 - RGBA pixel data of image 2
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} [threshold=0.1] - Matching threshold (0 to 1)
 * @returns {number} Number of different pixels
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
 *
 * @param {Uint8Array | Uint8ClampedArray | number[]} img1 - RGBA pixel data of image 1
 * @param {Uint8Array | Uint8ClampedArray | number[]} img2 - RGBA pixel data of image 2
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {object} [options] - Comparison options
 * @param {number} [options.threshold=0.1] - Matching threshold (0 to 1)
 * @param {boolean} [options.includeAA=false] - Whether to count anti-aliased pixels
 * @param {number} [options.alpha=0.1] - Blending factor
 * @param {boolean} [options.diffMask=false] - Mask mode
 * @returns {number} Match ratio (0.0 = completely different, 1.0 = identical)
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
 * Generate a comprehensive diff report.
 *
 * @param {Uint8Array | Uint8ClampedArray | number[]} img1 - RGBA pixel data of image 1
 * @param {Uint8Array | Uint8ClampedArray | number[]} img2 - RGBA pixel data of image 2
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {object} [options] - Report options
 * @param {number} [options.threshold=0.1] - Matching threshold (0 to 1)
 * @param {boolean} [options.includeAA=false] - Whether to count anti-aliased pixels
 * @param {number} [options.alpha=0.1] - Blending factor
 * @param {boolean} [options.diffMask=false] - Mask mode
 * @param {number} [options.gridSize=10] - Grid size for heatmap
 * @param {boolean} [options.detectShift=false] - Enable shift compensation detection
 * @returns {DiffReport}
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

  return JSON.parse(
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
}
