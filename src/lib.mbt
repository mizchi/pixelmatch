///|
/// Pixelmatch - Fast pixel-level image comparison library
/// Port of mapbox/pixelmatch to MoonBit

/// RGBA color representation
pub(all) struct Color {
  r : Int
  g : Int
  b : Int
  a : Int
} derive(Show, Eq)

///|
pub fn Color::rgba(r : Int, g : Int, b : Int, a : Int) -> Color {
  { r, g, b, a }
}

///|
pub fn Color::rgb(r : Int, g : Int, b : Int) -> Color {
  { r, g, b, a: 255 }
}

///|
/// Image data (RGBA pixels in row-major order)
pub(all) struct Image {
  width : Int
  height : Int
  data : Array[Int] // [r, g, b, a, r, g, b, a, ...]
}

///|
pub fn Image::new(width : Int, height : Int) -> Image {
  let size = width * height * 4
  { width, height, data: Array::make(size, 0) }
}

///|
pub fn Image::from_pixels(
  width : Int,
  height : Int,
  pixels : Array[Color],
) -> Image {
  let data = Array::make(width * height * 4, 0)
  for i, pixel in pixels {
    let base = i * 4
    data[base] = pixel.r
    data[base + 1] = pixel.g
    data[base + 2] = pixel.b
    data[base + 3] = pixel.a
  }
  { width, height, data }
}

///|
pub fn Image::get_pixel(self : Image, x : Int, y : Int) -> Color {
  let idx = (y * self.width + x) * 4
  {
    r: self.data[idx],
    g: self.data[idx + 1],
    b: self.data[idx + 2],
    a: self.data[idx + 3],
  }
}

///|
pub fn Image::set_pixel(self : Image, x : Int, y : Int, c : Color) -> Unit {
  let idx = (y * self.width + x) * 4
  self.data[idx] = c.r
  self.data[idx + 1] = c.g
  self.data[idx + 2] = c.b
  self.data[idx + 3] = c.a
}

///|
/// Pixelmatch options
pub(all) struct Options {
  /// Matching threshold (0 to 1). Smaller = more sensitive.
  threshold : Double
  /// Include anti-aliased pixels in diff
  include_aa : Bool
  /// Blending factor of unchanged pixels (0 to 1)
  alpha : Double
  /// Color of anti-aliased pixels in diff
  aa_color : Color
  /// Color of different pixels in diff
  diff_color : Color
  /// Detect dark on light differences
  diff_color_alt : Color?
  /// Mask mode - draw only changed pixels
  diff_mask : Bool
}

///|
pub fn Options::default() -> Options {
  {
    threshold: 0.1,
    include_aa: false,
    alpha: 0.1,
    aa_color: Color::rgba(255, 255, 0, 255), // Yellow
    diff_color: Color::rgba(255, 0, 0, 255), // Red
    diff_color_alt: None,
    diff_mask: false,
  }
}

///|
/// Compare two images and return the number of different pixels
/// Optionally writes diff image to output
pub fn pixelmatch(
  img1 : Image,
  img2 : Image,
  output : Image?,
  options : Options,
) -> Int {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  let width = img1.width
  let height = img1.height
  // Maximum delta based on threshold
  // 35215 is the maximum possible delta (see YIQ calculation)
  let max_delta = 35215.0 *
    options.threshold *
    options.threshold *
    options.threshold *
    options.threshold
  let mut diff_count = 0
  for y in 0..<height {
    for x in 0..<width {
      let delta = color_delta_at(img1, img2, x, y, false)
      if delta.abs() > max_delta {
        // Check for anti-aliasing
        if not(options.include_aa) &&
          (is_antialiased(img1, img2, x, y) || is_antialiased(img2, img1, x, y)) {
          // Anti-aliased pixel
          match output {
            Some(out) =>
              if not(options.diff_mask) {
                out.set_pixel(x, y, options.aa_color)
              }
            None => ()
          }
        } else {
          // Different pixel
          diff_count += 1
          match output {
            Some(out) => {
              let color = if delta < 0.0 {
                options.diff_color_alt.unwrap_or(options.diff_color)
              } else {
                options.diff_color
              }
              out.set_pixel(x, y, color)
            }
            None => ()
          }
        }
      } else {
        // Similar pixel - draw blended grayscale
        match output {
          Some(out) =>
            if not(options.diff_mask) {
              let gray = blend_gray(img1, x, y, options.alpha)
              out.set_pixel(x, y, gray)
            }
          None => ()
        }
      }
    }
  }
  diff_count
}

///|
/// Calculate color delta between two pixels using YIQ color space
fn color_delta(
  r1 : Int,
  g1 : Int,
  b1 : Int,
  a1 : Int,
  r2 : Int,
  g2 : Int,
  b2 : Int,
  a2 : Int,
  y_only : Bool,
) -> Double {
  // Handle alpha
  let (r1, g1, b1) = if a1 == a2 && a1 == 255 {
    (r1.to_double(), g1.to_double(), b1.to_double())
  } else {
    blend_with_white(r1, g1, b1, a1)
  }
  let (r2, g2, b2) = if a1 == a2 && a1 == 255 {
    (r2.to_double(), g2.to_double(), b2.to_double())
  } else {
    blend_with_white(r2, g2, b2, a2)
  }
  // Calculate YIQ components
  let dr = r1 - r2
  let dg = g1 - g2
  let db = b1 - b2
  // Y (luminance)
  let y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db
  if y_only {
    return y
  }
  // I and Q (chrominance)
  let i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db
  let q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db
  // Weighted delta (sign indicates lightening/darkening)
  let delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q
  if y < 0.0 { -delta } else { delta }
}

///|
fn color_delta_at(
  img1 : Image,
  img2 : Image,
  x : Int,
  y : Int,
  y_only : Bool,
) -> Double {
  let idx = (y * img1.width + x) * 4
  color_delta(
    img1.data[idx],
    img1.data[idx + 1],
    img1.data[idx + 2],
    img1.data[idx + 3],
    img2.data[idx],
    img2.data[idx + 1],
    img2.data[idx + 2],
    img2.data[idx + 3],
    y_only,
  )
}

///|
/// Blend color with white based on alpha
fn blend_with_white(
  r : Int,
  g : Int,
  b : Int,
  a : Int,
) -> (Double, Double, Double) {
  let alpha = a.to_double() / 255.0
  let white = 255.0 * (1.0 - alpha)
  (
    r.to_double() * alpha + white,
    g.to_double() * alpha + white,
    b.to_double() * alpha + white,
  )
}

///|
/// Check if a pixel is anti-aliased
fn is_antialiased(img1 : Image, img2 : Image, x : Int, y : Int) -> Bool {
  let width = img1.width
  let height = img1.height
  // Find min/max luminance delta among neighbors
  let mut min_delta = 0.0
  let mut max_delta = 0.0
  let mut min_x = x
  let mut min_y = y
  let mut max_x = x
  let mut max_y = y
  // Check 8 neighbors
  for dy in -1..=1 {
    for dx in -1..=1 {
      if dx == 0 && dy == 0 {
        continue
      }
      let nx = x + dx
      let ny = y + dy
      if nx < 0 || nx >= width || ny < 0 || ny >= height {
        continue
      }
      let delta = color_delta_at(img1, img1, x, y, true) -
        color_delta_at(img1, img1, nx, ny, true)
      if delta == 0.0 {
        continue // Identical neighbor
      }
      if delta < min_delta {
        min_delta = delta
        min_x = nx
        min_y = ny
      }
      if delta > max_delta {
        max_delta = delta
        max_x = nx
        max_y = ny
      }
    }
  }
  // No contrast difference
  if min_delta == 0.0 && max_delta == 0.0 {
    return false
  }
  // Check if darkest/brightest neighbor has 3+ equal siblings in both images
  (has_many_siblings(img1, min_x, min_y) && has_many_siblings(img2, min_x, min_y)) ||
  (has_many_siblings(img1, max_x, max_y) && has_many_siblings(img2, max_x, max_y))
}

///|
/// Check if pixel has 3+ siblings with similar color
fn has_many_siblings(img : Image, x : Int, y : Int) -> Bool {
  let width = img.width
  let height = img.height
  let mut count = 0
  let idx = (y * width + x) * 4
  let r = img.data[idx]
  let g = img.data[idx + 1]
  let b = img.data[idx + 2]
  let a = img.data[idx + 3]
  for dy in -1..=1 {
    for dx in -1..=1 {
      if dx == 0 && dy == 0 {
        continue
      }
      let nx = x + dx
      let ny = y + dy
      if nx < 0 || nx >= width || ny < 0 || ny >= height {
        continue
      }
      let nidx = (ny * width + nx) * 4
      // Check if colors are nearly identical
      if (img.data[nidx] - r).abs() < 3 &&
        (img.data[nidx + 1] - g).abs() < 3 &&
        (img.data[nidx + 2] - b).abs() < 3 &&
        (img.data[nidx + 3] - a).abs() < 3 {
        count += 1
        if count >= 3 {
          return true
        }
      }
    }
  }
  false
}

///|
/// Create a grayscale pixel blended with alpha
fn blend_gray(img : Image, x : Int, y : Int, alpha : Double) -> Color {
  let idx = (y * img.width + x) * 4
  let r = img.data[idx].to_double()
  let g = img.data[idx + 1].to_double()
  let b = img.data[idx + 2].to_double()
  // Luminance
  let lum = (0.299 * r + 0.587 * g + 0.114 * b).to_int()
  let blended = (lum.to_double() * alpha).to_int()
  Color::rgba(blended, blended, blended, 255)
}

///|
/// Simple comparison without anti-aliasing detection
/// Returns the number of different pixels
pub fn pixelmatch_simple(img1 : Image, img2 : Image, threshold : Double) -> Int {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  let max_delta = 35215.0 * threshold * threshold * threshold * threshold
  let mut diff_count = 0
  let len = img1.data.length() / 4
  for i in 0..<len {
    let base = i * 4
    let delta = color_delta(
      img1.data[base],
      img1.data[base + 1],
      img1.data[base + 2],
      img1.data[base + 3],
      img2.data[base],
      img2.data[base + 1],
      img2.data[base + 2],
      img2.data[base + 3],
      false,
    )
    if delta.abs() > max_delta {
      diff_count += 1
    }
  }
  diff_count
}

///|
/// Calculate match ratio (0.0 = completely different, 1.0 = identical)
pub fn match_ratio(img1 : Image, img2 : Image, options : Options) -> Double {
  let total = img1.width * img1.height
  if total == 0 {
    return 1.0
  }
  let diff = pixelmatch(img1, img2, None, options)
  1.0 - diff.to_double() / total.to_double()
}
