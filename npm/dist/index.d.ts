export interface PixelmatchOptions {
  /** Matching threshold (0 to 1). Smaller = more sensitive. Default: 0.1 */
  threshold?: number;
  /** Whether to count anti-aliased pixels as diff. Default: false */
  includeAA?: boolean;
  /** Blending factor of unchanged pixels in output (0 to 1). Default: 0.1 */
  alpha?: number;
  /** Draw only changed pixels in output. Default: false */
  diffMask?: boolean;
  /** Optional output buffer. If provided, diff image is written here. */
  output?: Uint8Array | Uint8ClampedArray;
}

export interface PixelmatchResult {
  /** Number of different pixels */
  diffCount: number;
  /** Diff image RGBA data (only present when output option was provided or includeOutput was true) */
  output?: Uint8Array | Uint8ClampedArray;
}

/**
 * Compare two images pixel by pixel.
 * @param img1 RGBA pixel data of image 1
 * @param img2 RGBA pixel data of image 2
 * @param width Image width
 * @param height Image height
 * @param options Comparison options
 */
export function pixelmatch(
  img1: Uint8Array | Uint8ClampedArray | number[],
  img2: Uint8Array | Uint8ClampedArray | number[],
  width: number,
  height: number,
  options?: PixelmatchOptions,
): PixelmatchResult;

/**
 * Simple (fast) pixel comparison without anti-aliasing detection.
 * @returns Number of different pixels
 */
export function pixelmatchSimple(
  img1: Uint8Array | Uint8ClampedArray | number[],
  img2: Uint8Array | Uint8ClampedArray | number[],
  width: number,
  height: number,
  threshold?: number,
): number;

/**
 * Calculate match ratio between two images.
 * @returns Match ratio (0.0 = completely different, 1.0 = identical)
 */
export function matchRatio(
  img1: Uint8Array | Uint8ClampedArray | number[],
  img2: Uint8Array | Uint8ClampedArray | number[],
  width: number,
  height: number,
  options?: Omit<PixelmatchOptions, "output">,
): number;

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  diff_pixels: number;
  /** "shift" | "content" | "edge" */
  region_type: string;
}

export interface ShiftRegion {
  y_start: number;
  y_end: number;
  shift: number;
}

export interface DiffReport {
  width: number;
  height: number;
  total_pixels: number;
  diff_count: number;
  aa_count: number;
  match_ratio: number;
  grid: number[][];
  regions: DiffRegion[];
  shift_only: boolean;
  content_change_count: number;
  global_shift: number;
  compensated_diff_count: number;
  shift_regions: ShiftRegion[];
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
  /** Grid size for heatmap. Default: 10 */
  gridSize?: number;
  /** Enable shift compensation detection. Default: false */
  detectShift?: boolean;
}

/**
 * Generate a comprehensive diff report with clustering and shift detection.
 */
export function diffReport(
  img1: Uint8Array | Uint8ClampedArray | number[],
  img2: Uint8Array | Uint8ClampedArray | number[],
  width: number,
  height: number,
  options?: DiffReportOptions,
): DiffReport;
