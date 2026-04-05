# Diff Clustering & Shift Compensation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add region classification (shift/content/edge) to DiffReport and vertical shift compensation via cross-correlation.

**Architecture:** Extend existing `DiffRegion` and `DiffReport` structs in `src/lib.mbt` with new fields. Add shift detection as pure functions operating on `Image` data. All changes are additive — existing API remains backward compatible.

**Tech Stack:** MoonBit, moon test (js target)

---

## File Structure

- **Modify:** `src/lib.mbt` — Add `region_type` to DiffRegion, `ShiftRegion` struct, shift detection functions, extend DiffReport and all output methods
- **Modify:** `src/lib_test.mbt` — Add tests for region classification, shift detection, and shift compensation

---

### Task 1: Add `region_type` field to DiffRegion and classification logic

**Files:**
- Modify: `src/lib.mbt:520-526` (DiffRegion struct)
- Modify: `src/lib.mbt:627-695` (find_diff_regions_flat)
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test for region classification**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "diff_report classifies shift region" {
  // 100x20 image, full-width horizontal band of diff (rows 5-9)
  let img1 = Image::new(100, 20)
  let img2 = Image::new(100, 20)
  for y in 0..<20 {
    for x in 0..<100 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  // Full-width band: width=100 > 80% of 100, aspect ratio > 3
  for y in 5..<10 {
    for x in 0..<100 {
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let report = diff_report(img1, img2, Options::default())
  assert_true(report.regions.length() >= 1)
  assert_eq(report.regions[0].region_type, "shift")
}

///|
test "diff_report classifies content region" {
  // 100x100 image, small localized diff (10x10 box)
  let img1 = Image::new(100, 100)
  let img2 = Image::new(100, 100)
  for y in 0..<100 {
    for x in 0..<100 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  for y in 20..<30 {
    for x in 20..<30 {
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let report = diff_report(img1, img2, Options::default())
  assert_true(report.regions.length() >= 1)
  assert_eq(report.regions[0].region_type, "content")
}

///|
test "diff_report classifies edge region" {
  // 100x100 image, thin horizontal line (1px tall)
  let img1 = Image::new(100, 100)
  let img2 = Image::new(100, 100)
  for y in 0..<100 {
    for x in 0..<100 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  for x in 20..<30 {
    img2.set_pixel(x, 50, Color::rgba(255, 255, 255, 255))
  }
  let report = diff_report(img1, img2, Options::default())
  assert_true(report.regions.length() >= 1)
  assert_eq(report.regions[0].region_type, "edge")
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — `region_type` field does not exist on DiffRegion

- [ ] **Step 3: Add `region_type` to DiffRegion struct**

In `src/lib.mbt`, change the DiffRegion struct (line ~520):

```moonbit
pub(all) struct DiffRegion {
  x : Int
  y : Int
  width : Int
  height : Int
  diff_pixels : Int
  region_type : String  // "shift" | "content" | "edge"
}
```

- [ ] **Step 4: Add classification function and update `find_diff_regions_flat`**

Add classification function after `find_diff_regions_flat` in `src/lib.mbt`:

```moonbit
///|
fn classify_region(region : DiffRegion, image_width : Int) -> String {
  if region.height <= 2 || region.width <= 2 {
    "edge"
  } else if region.width.to_double() / region.height.to_double() > 3.0 &&
    region.width > image_width * 80 / 100 {
    "shift"
  } else {
    "content"
  }
}
```

Update `find_diff_regions_flat` signature to accept `image_width`:

```moonbit
fn find_diff_regions_flat(
  diff_map : Array[Bool],
  width : Int,
  height : Int,
) -> Array[DiffRegion] {
```

In the region push block at the end of flood fill, add classification:

```moonbit
        if pixel_count > 0 {
          let region : DiffRegion = {
            x: min_x,
            y: min_y,
            width: max_x - min_x + 1,
            height: max_y - min_y + 1,
            diff_pixels: pixel_count,
            region_type: "",  // placeholder, classified below
          }
          regions.push({ ..region, region_type: classify_region(region, width) })
        }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: add region_type classification to DiffRegion (shift/content/edge)"
```

---

### Task 2: Add summary fields to DiffReport (`shift_only`, `content_change_count`)

**Files:**
- Modify: `src/lib.mbt:530-544` (DiffReport struct)
- Modify: `src/lib.mbt:549-622` (diff_report function)
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "diff_report shift_only true when all regions are shift" {
  let img1 = Image::new(100, 20)
  let img2 = Image::new(100, 20)
  for y in 0..<20 {
    for x in 0..<100 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  for y in 5..<10 {
    for x in 0..<100 {
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let report = diff_report(img1, img2, Options::default())
  assert_true(report.shift_only)
  assert_eq(report.content_change_count, 0)
}

///|
test "diff_report shift_only false when content region exists" {
  let img1 = Image::new(100, 100)
  let img2 = Image::new(100, 100)
  for y in 0..<100 {
    for x in 0..<100 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  for y in 20..<30 {
    for x in 20..<30 {
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let report = diff_report(img1, img2, Options::default())
  assert_false(report.shift_only)
  assert_eq(report.content_change_count, 1)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — `shift_only` and `content_change_count` do not exist

- [ ] **Step 3: Add fields to DiffReport and compute them in diff_report()**

In `src/lib.mbt`, update DiffReport struct:

```moonbit
pub(all) struct DiffReport {
  // Basic statistics
  width : Int
  height : Int
  total_pixels : Int
  diff_count : Int
  aa_count : Int
  match_ratio : Double
  // Grid heatmap
  grid : Array[Array[Int]]
  grid_cols : Int
  grid_rows : Int
  // Diff regions
  regions : Array[DiffRegion]
  // Classification summary
  shift_only : Bool
  content_change_count : Int
}
```

In `diff_report()`, after computing regions (line ~604), add:

```moonbit
  let mut content_change_count = 0
  let mut has_non_shift = false
  for region in regions {
    if region.region_type == "content" {
      content_change_count += 1
      has_non_shift = true
    } else if region.region_type == "edge" {
      has_non_shift = true
    }
  }
  let shift_only = regions.length() > 0 && !has_non_shift
```

Update the return struct to include the new fields.

- [ ] **Step 4: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: add shift_only and content_change_count to DiffReport"
```

---

### Task 3: Update output methods (`to_json`, `to_text`, `to_compact_with_hints`) for new fields

**Files:**
- Modify: `src/lib.mbt:699-1035` (to_text, to_compact, to_json)
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "diff_report to_json includes region_type" {
  let img1 = Image::new(100, 100)
  let img2 = Image::new(100, 100)
  for y in 0..<100 {
    for x in 0..<100 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  for y in 20..<30 {
    for x in 20..<30 {
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let report = diff_report(img1, img2, Options::default())
  let json = report.to_json()
  assert_true(json.contains("\"region_type\": \"content\""))
  assert_true(json.contains("\"shift_only\": false"))
  assert_true(json.contains("\"content_change_count\": 1"))
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — JSON output does not contain new fields

- [ ] **Step 3: Update to_json()**

In `src/lib.mbt`, update `DiffReport::to_json()`:

Add after `"match_ratio"` line:
```moonbit
  s += "  \"shift_only\": " + self.shift_only.to_string() + ",\n"
  s += "  \"content_change_count\": " + self.content_change_count.to_string() + ",\n"
```

In the regions section, add `region_type`:
```moonbit
    s += "    {\"x\": " + region.x.to_string()
    s += ", \"y\": " + region.y.to_string()
    s += ", \"width\": " + region.width.to_string()
    s += ", \"height\": " + region.height.to_string()
    s += ", \"diff_pixels\": " + region.diff_pixels.to_string()
    s += ", \"region_type\": \"" + region.region_type + "\"}"
```

- [ ] **Step 4: Update to_text()**

In the regions section of `to_text()`, add region_type:
```moonbit
      s += "  [" + i.to_string() + "] "
      s += "type=" + region.region_type + " "
      s += "pos=(" + region.x.to_string() + "," + region.y.to_string() + ") "
```

Add summary section:
```moonbit
  s += "\nClassification:\n"
  s += "  Shift only: " + self.shift_only.to_string() + "\n"
  s += "  Content changes: " + self.content_change_count.to_string() + "\n"
```

- [ ] **Step 5: Update to_compact()**

In the regions line of `to_compact()`, add type:
```moonbit
      s += r.region_type +
        ":" +
        r.x.to_string() +
        "," +
        r.y.to_string() +
        "," +
        r.width.to_string() +
        "x" +
        r.height.to_string()
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: include region_type and classification summary in all output formats"
```

---

### Task 4: Add ShiftRegion struct and luminance profile function

**Files:**
- Modify: `src/lib.mbt` (add after DiffReport struct)
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test for luminance_profile**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "luminance_profile computes row averages" {
  // 4x3 image: row 0 = black, row 1 = white, row 2 = mid-gray
  let img = Image::new(4, 3)
  for x in 0..<4 {
    img.set_pixel(x, 0, Color::rgba(0, 0, 0, 255))
    img.set_pixel(x, 1, Color::rgba(255, 255, 255, 255))
    img.set_pixel(x, 2, Color::rgba(128, 128, 128, 255))
  }
  let profile = luminance_profile(img)
  assert_eq(profile.length(), 3)
  // Row 0: Y = 0.299*0 + 0.587*0 + 0.114*0 = 0
  assert_true(profile[0] < 1.0)
  // Row 1: Y = 0.299*255 + 0.587*255 + 0.114*255 = 255
  assert_true(profile[1] > 254.0)
  // Row 2: mid gray ~128
  assert_true(profile[2] > 100.0 && profile[2] < 160.0)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — `luminance_profile` not defined

- [ ] **Step 3: Implement ShiftRegion and luminance_profile**

Add to `src/lib.mbt` after DiffReport struct:

```moonbit
///|
pub(all) struct ShiftRegion {
  y_start : Int
  y_end : Int
  shift : Int
}

///|
/// Compute average luminance (Y channel) per row
pub fn luminance_profile(img : Image) -> Array[Double] {
  let profile : Array[Double] = Array::make(img.height, 0.0)
  let data = img.data
  let width = img.width
  for y in 0..<img.height {
    let mut sum = 0.0
    let row_base = y * width * 4
    for x in 0..<width {
      let base = row_base + x * 4
      let r = data[base].to_double()
      let g = data[base + 1].to_double()
      let b = data[base + 2].to_double()
      sum += 0.299 * r + 0.587 * g + 0.114 * b
    }
    profile[y] = sum / width.to_double()
  }
  profile
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: add ShiftRegion struct and luminance_profile function"
```

---

### Task 5: Add cross-correlation and global shift detection

**Files:**
- Modify: `src/lib.mbt`
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "detect_global_shift finds known offset" {
  // Create two images: img2 is img1 shifted down by 5px
  let img1 = Image::new(20, 40)
  let img2 = Image::new(20, 40)
  // Fill with gradient pattern (each row has different brightness)
  for y in 0..<40 {
    let v = (y * 6) % 256  // varying brightness per row
    for x in 0..<20 {
      img1.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  // img2 = img1 shifted down by 5 pixels
  for y in 0..<40 {
    let src_y = y - 5
    let v = if src_y >= 0 && src_y < 40 { (src_y * 6) % 256 } else { 0 }
    for x in 0..<20 {
      img2.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  let p1 = luminance_profile(img1)
  let p2 = luminance_profile(img2)
  let shift = detect_global_shift(p1, p2, 10)
  assert_eq(shift, 5)
}

///|
test "detect_global_shift returns 0 for identical images" {
  let img1 = Image::new(10, 20)
  let img2 = Image::new(10, 20)
  for y in 0..<20 {
    let v = y * 12
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(v, v, v, 255))
      img2.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  let p1 = luminance_profile(img1)
  let p2 = luminance_profile(img2)
  let shift = detect_global_shift(p1, p2, 10)
  assert_eq(shift, 0)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — `detect_global_shift` not defined

- [ ] **Step 3: Implement detect_global_shift**

Add to `src/lib.mbt`:

```moonbit
///|
/// Detect global vertical shift via normalized cross-correlation
/// Returns the offset (positive = img2 shifted down relative to img1)
/// max_shift: maximum offset to search in each direction
pub fn detect_global_shift(
  profile1 : Array[Double],
  profile2 : Array[Double],
  max_shift : Int,
) -> Int {
  let n = profile1.length()
  if n != profile2.length() || n == 0 {
    return 0
  }
  let limit = if max_shift < n / 4 { max_shift } else { n / 4 }
  let mut best_corr = -1.0
  let mut best_offset = 0
  for offset in -limit..limit + 1 {
    let mut sum_xy = 0.0
    let mut sum_xx = 0.0
    let mut sum_yy = 0.0
    let start = if offset > 0 { offset } else { 0 }
    let end = if offset > 0 { n } else { n + offset }
    for i in start..<end {
      let j = i - offset
      let x = profile1[j]
      let y = profile2[i]
      sum_xy += x * y
      sum_xx += x * x
      sum_yy += y * y
    }
    let denom = (sum_xx * sum_yy).sqrt()
    let corr = if denom > 0.0 { sum_xy / denom } else { 0.0 }
    if corr > best_corr {
      best_corr = corr
      best_offset = offset
    }
  }
  best_offset
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: add detect_global_shift via cross-correlation"
```

---

### Task 6: Add piecewise shift detection

**Files:**
- Modify: `src/lib.mbt`
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "detect_piecewise_shift finds multiple offsets" {
  // 20x100 image: rows 0-49 identical, rows 50-99 shifted by 3
  let img1 = Image::new(20, 100)
  let img2 = Image::new(20, 100)
  for y in 0..<100 {
    let v = (y * 5) % 256
    for x in 0..<20 {
      img1.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  // Top half: identical
  for y in 0..<50 {
    let v = (y * 5) % 256
    for x in 0..<20 {
      img2.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  // Bottom half: shifted down by 3
  for y in 50..<100 {
    let src_y = y - 3
    let v = if src_y >= 0 && src_y < 100 { (src_y * 5) % 256 } else { 0 }
    for x in 0..<20 {
      img2.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  let p1 = luminance_profile(img1)
  let p2 = luminance_profile(img2)
  let regions = detect_piecewise_shift(p1, p2, 10, window_size=25)
  // Should have at least 2 regions with different shifts
  assert_true(regions.length() >= 2)
  // First region (top) should have shift ~0
  assert_true(regions[0].shift.abs() <= 1)
  // A later region should have shift ~3
  let has_shifted = regions.iter().any(fn(r) { r.shift == 3 })
  assert_true(has_shifted)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — `detect_piecewise_shift` not defined

- [ ] **Step 3: Implement detect_piecewise_shift**

Add to `src/lib.mbt`:

```moonbit
///|
/// Detect piecewise vertical shifts using sliding window cross-correlation
/// window_size: height of each analysis window (default 100)
/// Returns merged ShiftRegion array
pub fn detect_piecewise_shift(
  profile1 : Array[Double],
  profile2 : Array[Double],
  max_shift : Int,
  window_size? : Int = 100,
) -> Array[ShiftRegion] {
  let n = profile1.length()
  if n == 0 {
    return []
  }
  // Compute per-window shifts
  let step = window_size / 2  // 50% overlap
  let step = if step < 1 { 1 } else { step }
  let window_shifts : Array[(Int, Int, Int)] = []  // (y_start, y_end, shift)
  let mut y = 0
  while y < n {
    let end = if y + window_size > n { n } else { y + window_size }
    let len = end - y
    if len < 4 {
      break
    }
    // Extract window slices
    let w1 : Array[Double] = Array::make(len, 0.0)
    let w2 : Array[Double] = Array::make(len, 0.0)
    for i in 0..<len {
      w1[i] = profile1[y + i]
      w2[i] = profile2[y + i]
    }
    let shift = detect_global_shift(w1, w2, max_shift)
    window_shifts.push((y, end, shift))
    y += step
  }
  if window_shifts.length() == 0 {
    return [{ y_start: 0, y_end: n, shift: 0 }]
  }
  // Merge adjacent windows with same shift
  let regions : Array[ShiftRegion] = []
  let (first_start, first_end, first_shift) = window_shifts[0]
  let mut current_start = first_start
  let mut current_end = first_end
  let mut current_shift = first_shift
  for i in 1..<window_shifts.length() {
    let (_, w_end, w_shift) = window_shifts[i]
    if w_shift == current_shift {
      current_end = w_end
    } else {
      regions.push({ y_start: current_start, y_end: current_end, shift: current_shift })
      current_start = current_end
      current_end = w_end
      current_shift = w_shift
    }
  }
  regions.push({ y_start: current_start, y_end: current_end, shift: current_shift })
  regions
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: add detect_piecewise_shift with sliding window cross-correlation"
```

---

### Task 7: Integrate shift compensation into DiffReport

**Files:**
- Modify: `src/lib.mbt` (DiffReport struct, diff_report function, Options struct)
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "diff_report with shift compensation" {
  // 20x40 image: img2 is img1 shifted down by 5px
  let img1 = Image::new(20, 40)
  let img2 = Image::new(20, 40)
  for y in 0..<40 {
    let v = (y * 6) % 256
    for x in 0..<20 {
      img1.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  for y in 0..<40 {
    let src_y = y - 5
    let v = if src_y >= 0 && src_y < 40 { (src_y * 6) % 256 } else { 0 }
    for x in 0..<20 {
      img2.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  let options = { ..Options::default(), detect_shift: true }
  let report = diff_report(img1, img2, options)
  assert_eq(report.global_shift, 5)
  // Raw diff should be large (most rows shifted)
  assert_true(report.diff_count > 0)
  // Compensated diff should be much smaller
  assert_true(report.compensated_diff_count < report.diff_count)
  assert_true(report.shift_regions.length() > 0)
}

///|
test "diff_report without shift compensation has defaults" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  for y in 0..<10 {
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(50, 50, 50, 255))
      img2.set_pixel(x, y, Color::rgba(50, 50, 50, 255))
    }
  }
  let report = diff_report(img1, img2, Options::default())
  assert_eq(report.global_shift, 0)
  assert_eq(report.compensated_diff_count, 0)
  assert_eq(report.shift_regions.length(), 0)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — `detect_shift`, `global_shift`, `compensated_diff_count`, `shift_regions` not defined

- [ ] **Step 3: Add `detect_shift` to Options**

In `src/lib.mbt`, update Options struct:

```moonbit
pub(all) struct Options {
  threshold : Double
  include_aa : Bool
  alpha : Double
  aa_color : Color
  diff_color : Color
  diff_color_alt : Color?
  diff_mask : Bool
  detect_shift : Bool
}
```

Update `Options::default()`:

```moonbit
pub fn Options::default() -> Options {
  {
    threshold: 0.1,
    include_aa: false,
    alpha: 0.1,
    aa_color: Color::rgba(255, 255, 0, 255),
    diff_color: Color::rgba(255, 0, 0, 255),
    diff_color_alt: None,
    diff_mask: false,
    detect_shift: false,
  }
}
```

- [ ] **Step 4: Add shift fields to DiffReport and integrate into diff_report()**

Update DiffReport struct:

```moonbit
pub(all) struct DiffReport {
  width : Int
  height : Int
  total_pixels : Int
  diff_count : Int
  aa_count : Int
  match_ratio : Double
  grid : Array[Array[Int]]
  grid_cols : Int
  grid_rows : Int
  regions : Array[DiffRegion]
  shift_only : Bool
  content_change_count : Int
  // Shift compensation
  global_shift : Int
  shift_regions : Array[ShiftRegion]
  compensated_diff_count : Int
}
```

Add compensated diff helper function:

```moonbit
///|
/// Compute diff count with shift compensation per region
fn compensated_diff(
  img1 : Image,
  img2 : Image,
  shift_regions : Array[ShiftRegion],
  threshold : Double,
) -> Int {
  let width = img1.width
  let height = img1.height
  let max_delta = 35215.0 * threshold * threshold * threshold * threshold
  let data1 = img1.data
  let data2 = img2.data
  let mut count = 0
  for region in shift_regions {
    for y in region.y_start..<region.y_end {
      let src_y = y - region.shift
      if src_y < 0 || src_y >= height {
        // Out of bounds after compensation — count entire row as diff
        count += width
        continue
      }
      let row1 = src_y * width * 4
      let row2 = y * width * 4
      for x in 0..<width {
        let base1 = row1 + x * 4
        let base2 = row2 + x * 4
        let delta = color_delta_inline(data1, data2, base1, offset2=base2)
        if delta > max_delta {
          count += 1
        }
      }
    }
  }
  count
}
```

Note: `color_delta_inline` currently takes a single `base` offset assuming both images use the same index. We need a variant that accepts separate offsets. Add this helper:

```moonbit
///|
fn color_delta_inline2(
  data1 : FixedArray[Int],
  base1 : Int,
  data2 : FixedArray[Int],
  base2 : Int,
) -> Double {
  let r1 = data1[base1].to_double()
  let g1 = data1[base1 + 1].to_double()
  let b1 = data1[base1 + 2].to_double()
  let a1 = data1[base1 + 3].to_double()
  let r2 = data2[base2].to_double()
  let g2 = data2[base2 + 1].to_double()
  let b2 = data2[base2 + 2].to_double()
  let a2 = data2[base2 + 3].to_double()
  if a1 == a2 && r1 == r2 && g1 == g2 && b1 == b2 {
    return 0.0
  }
  // Blend with white background if alpha differs or not fully opaque
  let (r1, g1, b1) = if a1 < 255.0 {
    let a = a1 / 255.0
    (r1 * a + 255.0 * (1.0 - a), g1 * a + 255.0 * (1.0 - a), b1 * a + 255.0 * (1.0 - a))
  } else {
    (r1, g1, b1)
  }
  let (r2, g2, b2) = if a2 < 255.0 {
    let a = a2 / 255.0
    (r2 * a + 255.0 * (1.0 - a), g2 * a + 255.0 * (1.0 - a), b2 * a + 255.0 * (1.0 - a))
  } else {
    (r2, g2, b2)
  }
  let y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1
  let i1 = 0.596 * r1 - 0.275 * g1 - 0.321 * b1
  let q1 = 0.212 * r1 - 0.523 * g1 + 0.311 * b1
  let y2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2
  let i2 = 0.596 * r2 - 0.275 * g2 - 0.321 * b2
  let q2 = 0.212 * r2 - 0.523 * g2 + 0.311 * b2
  let dy = y1 - y2
  let di = i1 - i2
  let dq = q1 - q2
  0.5053 * dy * dy + 0.299 * di * di + 0.1957 * dq * dq
}
```

Then update `compensated_diff` to use `color_delta_inline2(data1, base1, data2, base2)`.

In `diff_report()`, after computing regions and classification, add shift detection:

```moonbit
  let (global_shift, shift_regions, compensated_diff_count) = if options.detect_shift &&
    height > 4 {
    let p1 = luminance_profile(img1)
    let p2 = luminance_profile(img2)
    let max_shift = if height / 4 < 500 { height / 4 } else { 500 }
    let gs = detect_global_shift(p1, p2, max_shift)
    let sr = detect_piecewise_shift(p1, p2, max_shift, window_size=100)
    let cd = compensated_diff(img1, img2, sr, options.threshold)
    (gs, sr, cd)
  } else {
    (0, [], 0)
  }
```

Update the return struct with the new fields.

- [ ] **Step 5: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: integrate shift compensation into diff_report with detect_shift option"
```

---

### Task 8: Update to_json and to_text for shift compensation fields

**Files:**
- Modify: `src/lib.mbt` (to_json, to_text)
- Test: `src/lib_test.mbt`

- [ ] **Step 1: Write failing test**

Add to `src/lib_test.mbt`:

```moonbit
///|
test "diff_report to_json includes shift fields when enabled" {
  let img1 = Image::new(20, 40)
  let img2 = Image::new(20, 40)
  for y in 0..<40 {
    let v = (y * 6) % 256
    for x in 0..<20 {
      img1.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  for y in 0..<40 {
    let src_y = y - 5
    let v = if src_y >= 0 && src_y < 40 { (src_y * 6) % 256 } else { 0 }
    for x in 0..<20 {
      img2.set_pixel(x, y, Color::rgba(v, v, v, 255))
    }
  }
  let options = { ..Options::default(), detect_shift: true }
  let report = diff_report(img1, img2, options)
  let json = report.to_json()
  assert_true(json.contains("\"global_shift\":"))
  assert_true(json.contains("\"shift_regions\":"))
  assert_true(json.contains("\"compensated_diff_count\":"))
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `moon test --target js`
Expected: FAIL — JSON output does not contain shift fields

- [ ] **Step 3: Update to_json() with shift fields**

Add after `content_change_count` in `to_json()`:

```moonbit
  s += "  \"global_shift\": " + self.global_shift.to_string() + ",\n"
  s += "  \"compensated_diff_count\": " +
    self.compensated_diff_count.to_string() + ",\n"
  s += "  \"shift_regions\": [\n"
  for i, sr in self.shift_regions {
    s += "    {\"y_start\": " + sr.y_start.to_string()
    s += ", \"y_end\": " + sr.y_end.to_string()
    s += ", \"shift\": " + sr.shift.to_string() + "}"
    if i < self.shift_regions.length() - 1 {
      s += ","
    }
    s += "\n"
  }
  s += "  ],\n"
```

- [ ] **Step 4: Update to_text() with shift fields**

Add shift section in `to_text()`:

```moonbit
  if self.global_shift != 0 || self.shift_regions.length() > 0 {
    s += "\nShift Analysis:\n"
    s += "  Global shift: " + self.global_shift.to_string() + "px\n"
    s += "  Compensated diff: " +
      self.compensated_diff_count.to_string() + " pixels\n"
    if self.shift_regions.length() > 0 {
      s += "  Shift regions:\n"
      for sr in self.shift_regions {
        s += "    y=[" + sr.y_start.to_string() + ".." +
          sr.y_end.to_string() + "] shift=" +
          sr.shift.to_string() + "px\n"
      }
    }
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `moon test --target js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "feat: include shift compensation fields in to_json and to_text output"
```

---

### Task 9: Run full test suite and verify backward compatibility

**Files:**
- All modified files

- [ ] **Step 1: Run moon check**

Run: `moon check --deny-warn --target js`
Expected: No warnings or errors

- [ ] **Step 2: Run full test suite**

Run: `moon test --target js`
Expected: All tests PASS including existing tests

- [ ] **Step 3: Verify existing test assertions still hold**

Run: `moon test --target js 2>&1 | tail -20`
Expected: No failures in previously existing tests

- [ ] **Step 4: Commit if any fixes needed, otherwise done**

If fixes were needed:
```bash
git add src/lib.mbt src/lib_test.mbt
git commit -m "fix: ensure backward compatibility of new DiffReport fields"
```
