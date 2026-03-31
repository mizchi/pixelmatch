///|
/// Native C-FFI benchmark: identical 200x200
test "bench: native identical 200x200" (b : @bench.T) {
  let img1 = Image::new(200, 200)
  let img2 = Image::new(200, 200)
  for y in 0..<200 {
    for x in 0..<200 {
      img1.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
    }
  }
  b.bench(() => b.keep(pixelmatch_native(img1, img2, 0.1)))
}

///|
/// Native C-FFI benchmark: 5% diff 200x200
test "bench: native 5pct 200x200" (b : @bench.T) {
  let img1 = Image::new(200, 200)
  let img2 = Image::new(200, 200)
  for y in 0..<200 {
    for x in 0..<200 {
      img1.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
    }
  }
  for y in 0..<10 {
    for x in 0..<200 {
      img2.set_pixel(x, y, Color::rgba(255, 0, 0, 255))
    }
  }
  b.bench(() => b.keep(pixelmatch_native(img1, img2, 0.1)))
}

///|
/// Native C-FFI benchmark: identical 500x500
test "bench: native identical 500x500" (b : @bench.T) {
  let img1 = Image::new(500, 500)
  let img2 = Image::new(500, 500)
  for y in 0..<500 {
    for x in 0..<500 {
      img1.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
    }
  }
  b.bench(() => b.keep(pixelmatch_native(img1, img2, 0.1)))
}

///|
/// Native C-FFI benchmark: all different 200x200
test "bench: native different 200x200" (b : @bench.T) {
  let img1 = Image::new(200, 200)
  let img2 = Image::new(200, 200)
  for y in 0..<200 {
    for x in 0..<200 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  b.bench(() => b.keep(pixelmatch_native(img1, img2, 0.1)))
}
