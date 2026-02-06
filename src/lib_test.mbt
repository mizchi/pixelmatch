///|
test "identical images have zero diff" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  // Fill both with same color
  for i in 0..<(10 * 10 * 4) {
    img1.data[i] = 128
    img2.data[i] = 128
  }
  let diff = pixelmatch_simple(img1, img2, 0.1)
  assert_eq!(diff, 0)
}

///|
test "completely different images" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  // Fill img1 with black, img2 with white
  for y in 0..<10 {
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let diff = pixelmatch_simple(img1, img2, 0.1)
  assert_eq!(diff, 100) // All pixels different
}

///|
test "partial difference" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  // Fill both with black
  for y in 0..<10 {
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
    }
  }
  // Make top-left quarter white in img2
  for y in 0..<5 {
    for x in 0..<5 {
      img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
    }
  }
  let diff = pixelmatch_simple(img1, img2, 0.1)
  assert_eq!(diff, 25) // 5x5 = 25 pixels different
}

///|
test "threshold sensitivity" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  // Fill img1 with gray, img2 with slightly different gray
  for y in 0..<10 {
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(128, 128, 128, 255))
      img2.set_pixel(x, y, Color::rgba(130, 130, 130, 255)) // Slight difference
    }
  }
  // High threshold should ignore small differences
  let diff_high = pixelmatch_simple(img1, img2, 0.5)
  assert_eq!(diff_high, 0)
  // Low threshold should catch small differences
  let diff_low = pixelmatch_simple(img1, img2, 0.001)
  assert_eq!(diff_low, 100)
}

///|
test "match_ratio identical" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  for y in 0..<10 {
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
    }
  }
  let ratio = match_ratio(img1, img2, Options::default())
  assert_eq!(ratio, 1.0)
}

///|
test "match_ratio half different" {
  let img1 = Image::new(10, 10)
  let img2 = Image::new(10, 10)
  for y in 0..<10 {
    for x in 0..<10 {
      img1.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      // Top half same, bottom half different
      if y < 5 {
        img2.set_pixel(x, y, Color::rgba(0, 0, 0, 255))
      } else {
        img2.set_pixel(x, y, Color::rgba(255, 255, 255, 255))
      }
    }
  }
  let ratio = match_ratio(img1, img2, Options::default())
  assert_eq!(ratio, 0.5)
}

///|
test "pixelmatch with output" {
  let img1 = Image::new(4, 4)
  let img2 = Image::new(4, 4)
  let output = Image::new(4, 4)
  // Fill with same color except one pixel
  for y in 0..<4 {
    for x in 0..<4 {
      img1.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
      img2.set_pixel(x, y, Color::rgba(100, 100, 100, 255))
    }
  }
  // Make one pixel different
  img2.set_pixel(2, 2, Color::rgba(255, 0, 0, 255))
  let diff = pixelmatch(img1, img2, Some(output), Options::default())
  assert_eq!(diff, 1)
  // Check that diff pixel is marked with diff_color (red)
  let diff_pixel = output.get_pixel(2, 2)
  assert_eq!(diff_pixel.r, 255)
  assert_eq!(diff_pixel.g, 0)
  assert_eq!(diff_pixel.b, 0)
}

///|
test "Image::from_pixels" {
  let pixels = [
    Color::rgba(255, 0, 0, 255),
    Color::rgba(0, 255, 0, 255),
    Color::rgba(0, 0, 255, 255),
    Color::rgba(255, 255, 255, 255),
  ]
  let img = Image::from_pixels(2, 2, pixels)
  assert_eq!(img.get_pixel(0, 0), Color::rgba(255, 0, 0, 255))
  assert_eq!(img.get_pixel(1, 0), Color::rgba(0, 255, 0, 255))
  assert_eq!(img.get_pixel(0, 1), Color::rgba(0, 0, 255, 255))
  assert_eq!(img.get_pixel(1, 1), Color::rgba(255, 255, 255, 255))
}

///|
test "Color constructors" {
  let c1 = Color::rgba(10, 20, 30, 40)
  assert_eq!(c1.r, 10)
  assert_eq!(c1.g, 20)
  assert_eq!(c1.b, 30)
  assert_eq!(c1.a, 40)
  let c2 = Color::rgb(100, 150, 200)
  assert_eq!(c2.r, 100)
  assert_eq!(c2.g, 150)
  assert_eq!(c2.b, 200)
  assert_eq!(c2.a, 255)
}
