// pixelmatch compute shader - YIQ color delta calculation
// Each invocation processes one pixel

struct Params {
    width: u32,
    height: u32,
    max_delta: f32,
    _pad: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> img1: array<u32>;  // RGBA packed
@group(0) @binding(2) var<storage, read> img2: array<u32>;  // RGBA packed
@group(0) @binding(3) var<storage, read_write> result: array<u32>; // 0=match, 1=diff

fn unpack_rgba(packed: u32) -> vec4<f32> {
    return vec4<f32>(
        f32(packed & 0xffu),
        f32((packed >> 8u) & 0xffu),
        f32((packed >> 16u) & 0xffu),
        f32((packed >> 24u) & 0xffu),
    );
}

fn color_delta(p1: vec4<f32>, p2: vec4<f32>) -> f32 {
    var r1 = p1.x; var g1 = p1.y; var b1 = p1.z; var a1 = p1.w;
    var r2 = p2.x; var g2 = p2.y; var b2 = p2.z; var a2 = p2.w;

    // Alpha blending against white
    if a1 < 255.0 || a2 < 255.0 {
        let alpha1 = a1 / 255.0;
        let white1 = 255.0 * (1.0 - alpha1);
        let alpha2 = a2 / 255.0;
        let white2 = 255.0 * (1.0 - alpha2);
        r1 = r1 * alpha1 + white1;
        g1 = g1 * alpha1 + white1;
        b1 = b1 * alpha1 + white1;
        r2 = r2 * alpha2 + white2;
        g2 = g2 * alpha2 + white2;
        b2 = b2 * alpha2 + white2;
    }

    let dr = r1 - r2;
    let dg = g1 - g2;
    let db = b1 - b2;

    // YIQ
    let y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db;
    let i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db;
    let q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db;

    let delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
    return delta;
}

// Anti-aliasing detection: check 8 neighbors
fn is_antialiased(x: u32, y: u32, w: u32, h: u32) -> bool {
    let offsets = array<vec2<i32>, 8>(
        vec2<i32>(-1, -1), vec2<i32>(0, -1), vec2<i32>(1, -1),
        vec2<i32>(-1,  0),                    vec2<i32>(1,  0),
        vec2<i32>(-1,  1), vec2<i32>(0,  1), vec2<i32>(1,  1),
    );

    var min_delta: f32 = 0.0;
    var max_delta: f32 = 0.0;
    var min_x: i32 = i32(x);
    var min_y: i32 = i32(y);
    var max_x: i32 = i32(x);
    var max_y: i32 = i32(y);

    let ix = i32(x);
    let iy = i32(y);
    let iw = i32(w);
    let ih = i32(h);

    // Find min/max luminance delta among neighbors (img1 vs img2)
    for (var k = 0u; k < 8u; k = k + 1u) {
        let nx = ix + offsets[k].x;
        let ny = iy + offsets[k].y;
        if nx < 0 || nx >= iw || ny < 0 || ny >= ih {
            continue;
        }
        let idx = u32(ny) * w + u32(nx);
        let p1 = unpack_rgba(img1[idx]);
        let p2 = unpack_rgba(img2[idx]);
        // Y-only delta for luminance
        var r1 = p1.x; var g1 = p1.y; var b1 = p1.z; var a1 = p1.w;
        var r2 = p2.x; var g2 = p2.y; var b2 = p2.z; var a2 = p2.w;
        if a1 < 255.0 || a2 < 255.0 {
            let al1 = a1 / 255.0; let wh1 = 255.0 * (1.0 - al1);
            let al2 = a2 / 255.0; let wh2 = 255.0 * (1.0 - al2);
            r1 = r1 * al1 + wh1; g1 = g1 * al1 + wh1; b1 = b1 * al1 + wh1;
            r2 = r2 * al2 + wh2; g2 = g2 * al2 + wh2; b2 = b2 * al2 + wh2;
        }
        let d = 0.29889531 * (r1 - r2) + 0.58662247 * (g1 - g2) + 0.11448223 * (b1 - b2);
        if d < min_delta { min_delta = d; min_x = nx; min_y = ny; }
        if d > max_delta { max_delta = d; max_x = nx; max_y = ny; }
    }

    if min_delta == 0.0 && max_delta == 0.0 { return false; }

    // Check if the darkest/brightest neighbor has many same-color siblings
    return has_many_siblings(u32(min_x), u32(min_y), w, h)
        || has_many_siblings(u32(max_x), u32(max_y), w, h);
}

fn has_many_siblings(x: u32, y: u32, w: u32, h: u32) -> bool {
    let offsets = array<vec2<i32>, 8>(
        vec2<i32>(-1, -1), vec2<i32>(0, -1), vec2<i32>(1, -1),
        vec2<i32>(-1,  0),                    vec2<i32>(1,  0),
        vec2<i32>(-1,  1), vec2<i32>(0,  1), vec2<i32>(1,  1),
    );
    let idx0 = y * w + x;
    let p0 = unpack_rgba(img1[idx0]);
    var count = 0u;
    let ix = i32(x);
    let iy = i32(y);
    let iw = i32(w);
    let ih = i32(h);

    for (var k = 0u; k < 8u; k = k + 1u) {
        let nx = ix + offsets[k].x;
        let ny = iy + offsets[k].y;
        if nx < 0 || nx >= iw || ny < 0 || ny >= ih { continue; }
        let idx = u32(ny) * w + u32(nx);
        let p = unpack_rgba(img1[idx]);
        if abs(p0.x - p.x) < 3.0 && abs(p0.y - p.y) < 3.0 && abs(p0.z - p.z) < 3.0 {
            count = count + 1u;
            if count >= 3u { return true; }
        }
    }
    return false;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let idx = gid.x;
    let total = params.width * params.height;
    if idx >= total {
        return;
    }

    let p1 = unpack_rgba(img1[idx]);
    let p2 = unpack_rgba(img2[idx]);
    let delta = color_delta(p1, p2);

    if delta > params.max_delta {
        let x = idx % params.width;
        let y = idx / params.width;
        // Check AA in both directions
        if is_antialiased(x, y, params.width, params.height)
            || is_antialiased(x, y, params.width, params.height) {
            result[idx] = 2u; // AA pixel
        } else {
            result[idx] = 1u; // diff pixel
        }
    } else {
        result[idx] = 0u; // match
    }
}
