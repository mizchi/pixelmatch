// Batch pixelmatch: each dispatch handles one image pair.
// pair_index selects which counter slot to atomicAdd.

struct Params {
    width: u32,
    height: u32,
    max_delta: f32,
    pair_index: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> img1: array<u32>;
@group(0) @binding(2) var<storage, read> img2: array<u32>;
@group(0) @binding(3) var<storage, read_write> counters: array<atomic<u32>>;

fn color_delta(p1: u32, p2: u32) -> f32 {
    let r1 = f32(p1 & 0xffu);
    let g1 = f32((p1 >> 8u) & 0xffu);
    let b1 = f32((p1 >> 16u) & 0xffu);
    let a1 = f32((p1 >> 24u) & 0xffu);
    let r2 = f32(p2 & 0xffu);
    let g2 = f32((p2 >> 8u) & 0xffu);
    let b2 = f32((p2 >> 16u) & 0xffu);
    let a2 = f32((p2 >> 24u) & 0xffu);

    var rf1 = r1; var gf1 = g1; var bf1 = b1;
    var rf2 = r2; var gf2 = g2; var bf2 = b2;

    if a1 < 255.0 || a2 < 255.0 {
        let alpha1 = a1 / 255.0;
        let white1 = 255.0 * (1.0 - alpha1);
        let alpha2 = a2 / 255.0;
        let white2 = 255.0 * (1.0 - alpha2);
        rf1 = r1 * alpha1 + white1; gf1 = g1 * alpha1 + white1; bf1 = b1 * alpha1 + white1;
        rf2 = r2 * alpha2 + white2; gf2 = g2 * alpha2 + white2; bf2 = b2 * alpha2 + white2;
    }

    let dr = rf1 - rf2;
    let dg = gf1 - gf2;
    let db = bf1 - bf2;

    let y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db;
    let i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db;
    let q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db;

    return 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let idx = gid.x;
    let total = params.width * params.height;
    if idx >= total {
        return;
    }

    let delta = color_delta(img1[idx], img2[idx]);
    if delta > params.max_delta {
        atomicAdd(&counters[params.pair_index], 1u);
    }
}
