///|
/// Convert mizchi/image ImageData (Bytes, RGBA) to pixelmatch Image (FixedArray[Int])
fn image_data_to_image(img : @image.ImageData) -> @pixelmatch.Image {
  let w = img.width
  let h = img.height
  let data = FixedArray::make(w * h * 4, 0)
  for i in 0..<(w * h * 4) {
    data[i] = img.data[i].to_int()
  }
  { width: w, height: h, data }
}

///|
/// Convert pixelmatch Image back to mizchi/image ImageData (for PNG encode)
fn image_to_image_data(img : @pixelmatch.Image) -> @image.ImageData {
  let len = img.width * img.height * 4
  let buf = FixedArray::make(len, b'\x00')
  for i in 0..<len {
    buf[i] = img.data[i].to_byte()
  }
  { width: img.width, height: img.height, data: Bytes::from_array(buf) }
}

///|
/// Create a test image as ImageData with a solid color
fn make_solid(w : Int, h : Int, r : Int, g : Int, b : Int) -> @image.ImageData {
  let len = w * h * 4
  let buf = FixedArray::make(len, b'\x00')
  for i in 0..<(w * h) {
    let base = i * 4
    buf[base] = r.to_byte()
    buf[base + 1] = g.to_byte()
    buf[base + 2] = b.to_byte()
    buf[base + 3] = b'\xFF'
  }
  { width: w, height: h, data: Bytes::from_array(buf) }
}

///|
/// E2E: generate two images -> compare -> produce diff PNG
test "e2e: pixelmatch with PNG encode/decode" {
  let w = 100
  let h = 100

  let img1_raw = make_solid(w, h, 128, 128, 128)
  let img2_raw = make_solid(w, h, 128, 128, 128)

  // Add red square to img2
  let buf2 = FixedArray::make(w * h * 4, b'\x00')
  for i in 0..<(w * h * 4) {
    buf2[i] = img2_raw.data[i]
  }
  for y in 20..<40 {
    for x in 20..<40 {
      let base = (y * w + x) * 4
      buf2[base] = b'\xFF'
      buf2[base + 1] = b'\x00'
      buf2[base + 2] = b'\x00'
      buf2[base + 3] = b'\xFF'
    }
  }
  let img2_modified : @image.ImageData = {
    width: w,
    height: h,
    data: Bytes::from_array(buf2),
  }

  // Encode to PNG and decode back (roundtrip)
  let png1 = @image.encode_png(img1_raw)
  let png2 = @image.encode_png(img2_modified)
  let decoded1 = @image.decode_png(png1)
  let decoded2 = @image.decode_png(png2)

  // Convert to pixelmatch format
  let pm_img1 = image_data_to_image(decoded1)
  let pm_img2 = image_data_to_image(decoded2)
  let pm_output = @pixelmatch.Image::new(w, h)

  // Run pixelmatch
  let diff_count = @pixelmatch.pixelmatch(
    pm_img1,
    pm_img2,
    Some(pm_output),
    @pixelmatch.Options::default(),
  )

  assert_eq(diff_count, 400) // 20*20

  // Encode diff output to PNG
  let diff_img_data = image_to_image_data(pm_output)
  let diff_png = @image.encode_png(diff_img_data)

  // Verify it's a valid PNG
  let decoded_diff = @image.decode_png(diff_png)
  assert_eq(decoded_diff.width, w)
  assert_eq(decoded_diff.height, h)

  // Check diff pixel at (25, 25) is red
  let idx = (25 * w + 25) * 4
  assert_eq(decoded_diff.data[idx].to_int(), 255) // R
  assert_eq(decoded_diff.data[idx + 1].to_int(), 0) // G
  assert_eq(decoded_diff.data[idx + 2].to_int(), 0) // B
}

///|
/// E2E benchmark: full pipeline (decode PNG -> pixelmatch -> encode diff PNG)
test "e2e: full pipeline 200x200" (b : @bench.T) {
  let w = 200
  let h = 200
  let img1_raw = make_solid(w, h, 100, 100, 100)
  let img2_raw = make_solid(w, h, 100, 100, 100)

  let buf2 = FixedArray::make(w * h * 4, b'\x00')
  for i in 0..<(w * h * 4) {
    buf2[i] = img2_raw.data[i]
  }
  for y in 0..<20 {
    for x in 0..<200 {
      let base = (y * w + x) * 4
      buf2[base] = b'\xFF'
      buf2[base + 1] = b'\x00'
      buf2[base + 2] = b'\x00'
      buf2[base + 3] = b'\xFF'
    }
  }
  let img2_mod : @image.ImageData = {
    width: w,
    height: h,
    data: Bytes::from_array(buf2),
  }

  let png1 = try { @image.encode_png(img1_raw) } catch { _ => panic() }
  let png2 = try { @image.encode_png(img2_mod) } catch { _ => panic() }

  b.bench(fn() {
    // Decode
    let d1 = try { @image.decode_png(png1) } catch { _ => panic() }
    let d2 = try { @image.decode_png(png2) } catch { _ => panic() }
    // Convert
    let pm1 = image_data_to_image(d1)
    let pm2 = image_data_to_image(d2)
    let out = @pixelmatch.Image::new(w, h)
    // Compare
    let diff = @pixelmatch.pixelmatch(
      pm1, pm2, Some(out), @pixelmatch.Options::default(),
    )
    // Encode diff PNG
    let diff_data = image_to_image_data(out)
    let diff_png = try { @image.encode_png(diff_data) } catch { _ => panic() }
    b.keep(diff + diff_png.length())
  })
}

///|
/// Benchmark: PNG encode only
test "e2e: png encode 200x200" (b : @bench.T) {
  let img = make_solid(200, 200, 128, 128, 128)
  b.bench(fn() {
    let png = try { @image.encode_png(img) } catch { _ => panic() }
    b.keep(png.length())
  })
}

///|
/// Benchmark: PNG decode only
test "e2e: png decode 200x200" (b : @bench.T) {
  let img = make_solid(200, 200, 128, 128, 128)
  let png = try { @image.encode_png(img) } catch { _ => panic() }
  b.bench(fn() {
    let decoded = try { @image.decode_png(png) } catch { _ => panic() }
    b.keep(decoded.width)
  })
}

///|
/// Benchmark: pixelmatch only (no PNG I/O)
test "e2e: pixelmatch only 200x200" (b : @bench.T) {
  let img1 = @pixelmatch.Image::new(200, 200)
  let img2 = @pixelmatch.Image::new(200, 200)
  for y in 0..<200 {
    for x in 0..<200 {
      img1.set_pixel(x, y, @pixelmatch.Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, @pixelmatch.Color::rgba(100, 100, 100, 255))
    }
  }
  for y in 0..<20 {
    for x in 0..<200 {
      img2.set_pixel(x, y, @pixelmatch.Color::rgba(255, 0, 0, 255))
    }
  }
  let out = @pixelmatch.Image::new(200, 200)
  let opts = @pixelmatch.Options::default()
  b.bench(fn() {
    b.keep(@pixelmatch.pixelmatch(img1, img2, Some(out), opts))
  })
}

///|
/// Benchmark: pixelmatch_fast (unified API, best impl per target)
test "e2e: pixelmatch_fast 200x200" (b : @bench.T) {
  let img1 = @pixelmatch.Image::new(200, 200)
  let img2 = @pixelmatch.Image::new(200, 200)
  for y in 0..<200 {
    for x in 0..<200 {
      img1.set_pixel(x, y, @pixelmatch.Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, @pixelmatch.Color::rgba(100, 100, 100, 255))
    }
  }
  for y in 0..<20 {
    for x in 0..<200 {
      img2.set_pixel(x, y, @pixelmatch.Color::rgba(255, 0, 0, 255))
    }
  }
  b.bench(fn() {
    b.keep(@pixelmatch.pixelmatch_fast(img1, img2, 0.1))
  })
}
