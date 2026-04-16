/** RGBA pixel data input. Accepts Uint8Array, Uint8ClampedArray, plain number array, or Canvas ImageData. */
export type PixelData = Uint8Array | Uint8ClampedArray | number[] | ImageData;

export interface PixelmatchOptions {
  /** Matching threshold (0 to 1). Smaller = more sensitive. Default: 0.1 */
  threshold?: number;
  /** Whether to count anti-aliased pixels as diff. Default: false */
  includeAA?: boolean;
  /** Blending factor of unchanged pixels in output (0 to 1). Default: 0.1 */
  alpha?: number;
  /** Draw only changed pixels in output. Default: false */
  diffMask?: boolean;
  /** Optional output buffer. If provided, diff image is written here. Must be same size as input (width * height * 4). */
  output?: Uint8Array | Uint8ClampedArray;
}

export interface PixelmatchResult {
  /** Number of different pixels */
  diffCount: number;
  /** Diff image RGBA data (only present when output buffer was provided) */
  output?: Uint8Array | Uint8ClampedArray;
}

/**
 * Compare two images pixel by pixel.
 *
 * @example
 * ```ts
 * const result = pixelmatch(img1, img2, 800, 600);
 * console.log(result.diffCount); // number of different pixels
 *
 * // With diff output image
 * const output = new Uint8Array(800 * 600 * 4);
 * const result = pixelmatch(img1, img2, 800, 600, { output });
 * // result.output contains the diff visualization
 * ```
 */
export function pixelmatch(
  img1: PixelData,
  img2: PixelData,
  width: number,
  height: number,
  options?: PixelmatchOptions,
): PixelmatchResult;

/**
 * Simple (fast) pixel comparison without anti-aliasing detection.
 * Use this when you only need the diff count and want maximum performance.
 *
 * @returns Number of different pixels
 */
export function pixelmatchSimple(
  img1: PixelData,
  img2: PixelData,
  width: number,
  height: number,
  threshold?: number,
): number;

/**
 * Calculate match ratio between two images.
 *
 * @returns Match ratio (0.0 = completely different, 1.0 = identical)
 */
export function matchRatio(
  img1: PixelData,
  img2: PixelData,
  width: number,
  height: number,
  options?: Omit<PixelmatchOptions, "output">,
): number;

/** Classification of a diff region */
export type RegionType = "shift" | "content" | "edge";

export interface DiffRegion {
  /** Left edge of bounding box */
  x: number;
  /** Top edge of bounding box */
  y: number;
  /** Width of bounding box */
  width: number;
  /** Height of bounding box */
  height: number;
  /** Number of different pixels in this region */
  diffPixels: number;
  /**
   * Region classification:
   * - `"shift"`: full-width horizontal band (vertical layout shift)
   * - `"content"`: localized region (actual visual change)
   * - `"edge"`: thin line (anti-aliasing / subpixel boundary)
   */
  regionType: RegionType;
}

export interface ShiftRegion {
  /** Start row (inclusive) */
  yStart: number;
  /** End row (exclusive) */
  yEnd: number;
  /** Vertical shift in pixels (positive = shifted down) */
  shift: number;
}

export interface DiffReport {
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Total number of pixels (width * height) */
  totalPixels: number;
  /** Number of pixels that differ beyond threshold */
  diffCount: number;
  /** Number of anti-aliased pixels detected */
  aaCount: number;
  /** Similarity ratio (0.0 = completely different, 1.0 = identical) */
  matchRatio: number;
  /** Heatmap grid: grid[row][col] = diff count in that cell */
  grid: number[][];
  /** Classified diff regions with bounding boxes */
  regions: DiffRegion[];
  /** True if all diff regions are classified as "shift" (no content changes) */
  shiftOnly: boolean;
  /** Number of regions classified as "content" */
  contentChangeCount: number;
  /** Global vertical shift in pixels (0 if detectShift is false) */
  globalShift: number;
  /** Compensated diff count after shift alignment (0 if detectShift is false) */
  compensatedDiffCount: number;
  /** Detected shift regions (empty if detectShift is false) */
  shiftRegions: ShiftRegion[];
}

export interface DiffReportOptions {
  /** Matching threshold (0 to 1). Default: 0.1 */
  threshold?: number;
  /** Whether to count anti-aliased pixels. Default: false */
  includeAA?: boolean;
  /** Blending factor. Default: 0.1 */
  alpha?: number;
  /** Mask mode. Default: false */
  diffMask?: boolean;
  /** Grid size for heatmap (NxN). Default: 10 */
  gridSize?: number;
  /** Enable shift compensation detection. Default: false */
  detectShift?: boolean;
}

/**
 * Generate a comprehensive diff report with clustering, region classification,
 * and optional shift detection.
 *
 * @example
 * ```ts
 * const report = diffReport(img1, img2, 800, 600, { detectShift: true });
 * console.log(report.matchRatio);        // 0.95
 * console.log(report.shiftOnly);         // true = only layout shift, no content change
 * console.log(report.regions);           // classified diff regions
 * console.log(report.compensatedDiffCount); // diff after shift compensation
 * ```
 */
export function diffReport(
  img1: PixelData,
  img2: PixelData,
  width: number,
  height: number,
  options?: DiffReportOptions,
): DiffReport;
