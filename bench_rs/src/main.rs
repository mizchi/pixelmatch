use bytemuck::{Pod, Zeroable};
use rand::Rng;
use rayon::prelude::*;
use std::time::Instant;
use wgpu::util::DeviceExt;

// ============================================================================
// Structs
// ============================================================================

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
struct Params {
    width: u32,
    height: u32,
    max_delta: f32,
    _pad: u32,
}

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
struct BatchParams {
    width: u32,
    height: u32,
    max_delta: f32,
    pair_index: u32,
}

// ============================================================================
// CPU implementations
// ============================================================================

#[inline(always)]
fn pixel_differs(p1: u32, p2: u32, max_delta: f32) -> bool {
    let r1 = (p1 & 0xff) as f32;
    let g1 = ((p1 >> 8) & 0xff) as f32;
    let b1 = ((p1 >> 16) & 0xff) as f32;
    let a1 = ((p1 >> 24) & 0xff) as f32;
    let r2 = (p2 & 0xff) as f32;
    let g2 = ((p2 >> 8) & 0xff) as f32;
    let b2 = ((p2 >> 16) & 0xff) as f32;
    let a2 = ((p2 >> 24) & 0xff) as f32;

    let (rf1, gf1, bf1, rf2, gf2, bf2) = if a1 == 255.0 && a2 == 255.0 {
        (r1, g1, b1, r2, g2, b2)
    } else {
        let al1 = a1 / 255.0;
        let w1 = 255.0 * (1.0 - al1);
        let al2 = a2 / 255.0;
        let w2 = 255.0 * (1.0 - al2);
        (r1*al1+w1, g1*al1+w1, b1*al1+w1, r2*al2+w2, g2*al2+w2, b2*al2+w2)
    };
    let dr = rf1 - rf2;
    let dg = gf1 - gf2;
    let db = bf1 - bf2;
    let y = 0.29889531*dr + 0.58662247*dg + 0.11448223*db;
    let i = 0.59597799*dr - 0.27417610*dg - 0.32180189*db;
    let q = 0.21147017*dr - 0.52261711*dg + 0.31114694*db;
    let delta = 0.5053*y*y + 0.299*i*i + 0.1957*q*q;
    delta > max_delta
}

fn pixelmatch_cpu(img1: &[u32], img2: &[u32], total: usize, threshold: f32) -> u32 {
    let max_delta = 35215.0 * threshold.powi(4);
    let mut diff = 0u32;
    for i in 0..total {
        if pixel_differs(img1[i], img2[i], max_delta) { diff += 1; }
    }
    diff
}

fn pixelmatch_cpu_prefilter(img1: &[u32], img2: &[u32], width: usize, height: usize, threshold: f32) -> u32 {
    let max_delta = 35215.0 * threshold.powi(4);
    let mut diff = 0u32;
    for y in 0..height {
        let s = y * width;
        let row1 = &img1[s..s + width];
        let row2 = &img2[s..s + width];
        if row1 == row2 { continue; }
        for i in 0..width {
            if pixel_differs(row1[i], row2[i], max_delta) { diff += 1; }
        }
    }
    diff
}

fn pixelmatch_rayon(img1: &[u32], img2: &[u32], total: usize, threshold: f32) -> u32 {
    let max_delta = 35215.0 * threshold.powi(4);
    let chunk = (total / rayon::current_num_threads().max(1)).max(1);
    img1.par_chunks(chunk)
        .zip(img2.par_chunks(chunk))
        .map(|(c1, c2)| {
            let mut d = 0u32;
            for i in 0..c1.len() {
                if pixel_differs(c1[i], c2[i], max_delta) { d += 1; }
            }
            d
        })
        .sum()
}

fn pixelmatch_rayon_prefilter(img1: &[u32], img2: &[u32], width: usize, height: usize, threshold: f32) -> u32 {
    let max_delta = 35215.0 * threshold.powi(4);
    (0..height)
        .into_par_iter()
        .map(|y| {
            let s = y * width;
            let row1 = &img1[s..s + width];
            let row2 = &img2[s..s + width];
            if row1 == row2 { return 0u32; }
            let mut d = 0u32;
            for i in 0..width {
                if pixel_differs(row1[i], row2[i], max_delta) { d += 1; }
            }
            d
        })
        .sum()
}

// ============================================================================
// GPU implementation
// ============================================================================

fn bgl_entry(binding: u32, ty: wgpu::BufferBindingType) -> wgpu::BindGroupLayoutEntry {
    wgpu::BindGroupLayoutEntry {
        binding,
        visibility: wgpu::ShaderStages::COMPUTE,
        ty: wgpu::BindingType::Buffer { ty, has_dynamic_offset: false, min_binding_size: None },
        count: None,
    }
}

struct GpuBench {
    device: wgpu::Device,
    queue: wgpu::Queue,
    pipeline_simple: wgpu::ComputePipeline,
    bgl_simple: wgpu::BindGroupLayout,
    pipeline_batch: wgpu::ComputePipeline,
    bgl_batch: wgpu::BindGroupLayout,
}

impl GpuBench {
    fn new() -> Self {
        let instance = wgpu::Instance::default();
        let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            ..Default::default()
        })).expect("No GPU adapter");

        eprintln!("GPU: {}", adapter.get_info().name);
        eprintln!("Backend: {:?}", adapter.get_info().backend);

        let (device, queue) = pollster::block_on(adapter.request_device(
            &wgpu::DeviceDescriptor {
                label: Some("pixelmatch"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::default(),
                ..Default::default()
            },
        )).expect("Failed to create device");

        let make_pipeline = |src: &str, label: &str| -> (wgpu::ComputePipeline, wgpu::BindGroupLayout) {
            let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
                label: Some(label), source: wgpu::ShaderSource::Wgsl(src.into()),
            });
            let bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                label: None,
                entries: &[
                    bgl_entry(0, wgpu::BufferBindingType::Uniform),
                    bgl_entry(1, wgpu::BufferBindingType::Storage { read_only: true }),
                    bgl_entry(2, wgpu::BufferBindingType::Storage { read_only: true }),
                    bgl_entry(3, wgpu::BufferBindingType::Storage { read_only: false }),
                ],
            });
            let pl = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: None, bind_group_layouts: &[&bgl], push_constant_ranges: &[],
            });
            let pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
                label: Some(label), layout: Some(&pl), module: &shader,
                entry_point: Some("main"), compilation_options: Default::default(), cache: None,
            });
            (pipeline, bgl)
        };

        let (pipeline_simple, bgl_simple) = make_pipeline(include_str!("pixelmatch_simple.wgsl"), "simple");
        let (pipeline_batch, bgl_batch) = make_pipeline(include_str!("pixelmatch_batch.wgsl"), "batch");

        Self { device, queue, pipeline_simple, bgl_simple, pipeline_batch, bgl_batch }
    }

    fn run_simple(&self, img1: &[u32], img2: &[u32], width: u32, height: u32, threshold: f32) -> u32 {
        let total = (width * height) as usize;
        let max_delta = 35215.0f32 * threshold.powi(4);
        let params = Params { width, height, max_delta, _pad: 0 };

        let param_buf = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::bytes_of(&params), usage: wgpu::BufferUsages::UNIFORM,
        });
        let img1_buf = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::cast_slice(img1), usage: wgpu::BufferUsages::STORAGE,
        });
        let img2_buf = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::cast_slice(img2), usage: wgpu::BufferUsages::STORAGE,
        });
        let counter_buf = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::bytes_of(&0u32),
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
        });

        let bg = self.device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: None, layout: &self.bgl_simple,
            entries: &[
                wgpu::BindGroupEntry { binding: 0, resource: param_buf.as_entire_binding() },
                wgpu::BindGroupEntry { binding: 1, resource: img1_buf.as_entire_binding() },
                wgpu::BindGroupEntry { binding: 2, resource: img2_buf.as_entire_binding() },
                wgpu::BindGroupEntry { binding: 3, resource: counter_buf.as_entire_binding() },
            ],
        });

        let workgroups = (total as u32 + 255) / 256;
        let mut enc = self.device.create_command_encoder(&Default::default());
        { let mut p = enc.begin_compute_pass(&Default::default()); p.set_pipeline(&self.pipeline_simple); p.set_bind_group(0, &bg, &[]); p.dispatch_workgroups(workgroups, 1, 1); }
        enc.copy_buffer_to_buffer(&counter_buf, 0, &self.device.create_buffer(&wgpu::BufferDescriptor {
            label: None, size: 4,
            usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        }), 0, 4);
        self.queue.submit(Some(enc.finish()));

        // Simpler: just do full readback
        let rb = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: None, size: 4,
            usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let mut enc2 = self.device.create_command_encoder(&Default::default());
        enc2.copy_buffer_to_buffer(&counter_buf, 0, &rb, 0, 4);
        self.queue.submit(Some(enc2.finish()));
        let slice = rb.slice(..);
        let (tx, rx) = std::sync::mpsc::channel();
        slice.map_async(wgpu::MapMode::Read, move |r| { tx.send(r).unwrap(); });
        let _ = self.device.poll(wgpu::PollType::Wait);
        rx.recv().unwrap().unwrap();
        let data = slice.get_mapped_range();
        bytemuck::cast_slice::<u8, u32>(&data)[0]
    }

    fn run_batch(&self, pairs: &[(Vec<u32>, Vec<u32>)], width: u32, height: u32, threshold: f32) -> Vec<u32> {
        let n = pairs.len();
        let total = (width * height) as usize;
        let max_delta = 35215.0f32 * threshold.powi(4);
        let workgroups = (total as u32 + 255) / 256;

        let counters_zeros: Vec<u32> = vec![0u32; n];
        let counters_buf = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::cast_slice(&counters_zeros),
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
        });

        let mut bind_groups: Vec<(wgpu::BindGroup, wgpu::Buffer, wgpu::Buffer, wgpu::Buffer)> = Vec::with_capacity(n);
        for (i, (img1, img2)) in pairs.iter().enumerate() {
            let params = BatchParams { width, height, max_delta, pair_index: i as u32 };
            let pb = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: None, contents: bytemuck::bytes_of(&params), usage: wgpu::BufferUsages::UNIFORM,
            });
            let b1 = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: None, contents: bytemuck::cast_slice(img1), usage: wgpu::BufferUsages::STORAGE,
            });
            let b2 = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: None, contents: bytemuck::cast_slice(img2), usage: wgpu::BufferUsages::STORAGE,
            });
            let bg = self.device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: None, layout: &self.bgl_batch,
                entries: &[
                    wgpu::BindGroupEntry { binding: 0, resource: pb.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 1, resource: b1.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 2, resource: b2.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 3, resource: counters_buf.as_entire_binding() },
                ],
            });
            bind_groups.push((bg, pb, b1, b2));
        }

        let mut enc = self.device.create_command_encoder(&Default::default());
        {
            let mut pass = enc.begin_compute_pass(&Default::default());
            pass.set_pipeline(&self.pipeline_batch);
            for (bg, _, _, _) in &bind_groups {
                pass.set_bind_group(0, bg, &[]);
                pass.dispatch_workgroups(workgroups, 1, 1);
            }
        }
        let rb_size = (n * 4) as u64;
        let rb = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: None, size: rb_size,
            usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        enc.copy_buffer_to_buffer(&counters_buf, 0, &rb, 0, rb_size);
        self.queue.submit(Some(enc.finish()));

        let slice = rb.slice(..);
        let (tx, rx) = std::sync::mpsc::channel();
        slice.map_async(wgpu::MapMode::Read, move |r| { tx.send(r).unwrap(); });
        let _ = self.device.poll(wgpu::PollType::Wait);
        rx.recv().unwrap().unwrap();
        let data = slice.get_mapped_range();
        bytemuck::cast_slice::<u8, u32>(&data).to_vec()
    }
}

// ============================================================================
// Test data generation
// ============================================================================

fn generate_test_images(width: usize, height: usize, diff_ratio: f32) -> (Vec<u32>, Vec<u32>) {
    let total = width * height;
    let mut rng = rand::rng();
    let mut img1 = Vec::with_capacity(total);
    let mut img2 = Vec::with_capacity(total);
    for _ in 0..total {
        let r: u8 = rng.random();
        let g: u8 = rng.random();
        let b: u8 = rng.random();
        let pixel = 0xFF000000u32 | (b as u32) << 16 | (g as u32) << 8 | r as u32;
        img1.push(pixel);
        if rng.random::<f32>() < diff_ratio {
            let r2: u8 = rng.random();
            let g2: u8 = rng.random();
            let b2: u8 = rng.random();
            img2.push(0xFF000000u32 | (b2 as u32) << 16 | (g2 as u32) << 8 | r2 as u32);
        } else {
            img2.push(pixel);
        }
    }
    (img1, img2)
}

// ============================================================================
// Benchmark harness
// ============================================================================

struct BenchResult {
    label: String,
    us_per_iter: f64,
    diff: u32,
}

fn measure<F: FnMut() -> u32>(label: &str, iters: u32, mut f: F) -> BenchResult {
    // warmup
    let _ = f();
    let t = Instant::now();
    let mut diff = 0;
    for _ in 0..iters { diff = f(); }
    let us = t.elapsed().as_micros() as f64 / iters as f64;
    BenchResult { label: label.to_string(), us_per_iter: us, diff }
}

fn print_results(title: &str, results: &[BenchResult]) {
    println!("  {title}");
    let baseline = results[0].us_per_iter;
    for r in results {
        let speedup = baseline / r.us_per_iter;
        println!("    {:<25} {:>10.0}µs  (diff={:<8}) {:.2}x", r.label, r.us_per_iter, r.diff, speedup);
    }
    println!();
}

// ============================================================================
// Single-image benchmark
// ============================================================================

fn bench_single(gpu: &GpuBench, width: usize, height: usize, diff_ratio: f32, iters: u32) {
    let (img1, img2) = generate_test_images(width, height, diff_ratio);
    let total = width * height;
    let threshold = 0.1f32;
    let w = width as u32;
    let h = height as u32;

    let results = vec![
        measure("cpu_simple", iters, || pixelmatch_cpu(&img1, &img2, total, threshold)),
        measure("cpu_prefilter", iters, || pixelmatch_cpu_prefilter(&img1, &img2, width, height, threshold)),
        measure("rayon", iters, || pixelmatch_rayon(&img1, &img2, total, threshold)),
        measure("rayon_prefilter", iters, || pixelmatch_rayon_prefilter(&img1, &img2, width, height, threshold)),
        measure("gpu_simple", iters, || gpu.run_simple(&img1, &img2, w, h, threshold)),
    ];

    print_results(
        &format!("{}x{} ({:.0}% diff, {} iters)", width, height, diff_ratio * 100.0, iters),
        &results,
    );
}

// ============================================================================
// Batch benchmark
// ============================================================================

fn bench_batch(gpu: &GpuBench, n: usize, width: usize, height: usize, diff_ratio: f32) {
    let pairs: Vec<(Vec<u32>, Vec<u32>)> = (0..n)
        .map(|_| generate_test_images(width, height, diff_ratio))
        .collect();
    let total = width * height;
    let threshold = 0.1f32;
    let w = width as u32;
    let h = height as u32;

    // CPU sequential
    let t = Instant::now();
    let cpu_results: Vec<u32> = pairs.iter().map(|(a, b)| pixelmatch_cpu(a, b, total, threshold)).collect();
    let cpu_us = t.elapsed().as_micros() as f64;

    // CPU rayon+prefilter sequential over pairs
    let t = Instant::now();
    let _: Vec<u32> = pairs.iter().map(|(a, b)| pixelmatch_rayon_prefilter(a, b, width, height, threshold)).collect();
    let rayon_us = t.elapsed().as_micros() as f64;

    // GPU batch (single submit)
    let _ = gpu.run_batch(&pairs, w, h, threshold); // warmup
    let t = Instant::now();
    let gpu_results = gpu.run_batch(&pairs, w, h, threshold);
    let gpu_us = t.elapsed().as_micros() as f64;

    // Verify correctness
    let correct = cpu_results == gpu_results;

    println!("  Batch {n}x {width}x{height} ({:.0}% diff)", diff_ratio * 100.0);
    println!("    {:<25} {:>10.0}µs  ({:.0}µs/pair)", "cpu_simple", cpu_us, cpu_us / n as f64);
    println!("    {:<25} {:>10.0}µs  ({:.0}µs/pair)  {:.2}x", "rayon_prefilter", rayon_us, rayon_us / n as f64, cpu_us / rayon_us);
    println!("    {:<25} {:>10.0}µs  ({:.0}µs/pair)  {:.2}x  correct={correct}", "gpu_batch", gpu_us, gpu_us / n as f64, cpu_us / gpu_us);
    println!();
}

// ============================================================================
// Main
// ============================================================================

fn bench_gpu_crossover(gpu: &GpuBench, diff_pct: u32) {
    let diff_ratio = diff_pct as f32 / 100.0;
    let threshold = 0.1f32;
    // Test square images from 256 to 8192
    let sizes: &[(usize, usize, u32)] = &[
        (256, 256, 200),
        (512, 512, 100),
        (1024, 1024, 50),
        (1920, 1080, 30),
        (2048, 2048, 20),
        (3840, 2160, 10),
        (4000, 4000, 5),   // just under dispatch limit
    ];

    println!("  {:>12} {:>10} {:>10} {:>10} {:>10}  {:>8}",
             "size", "pixels", "rayon_pf", "gpu_xfer", "gpu_only", "gpu_win?");
    println!("  {:->12} {:->10} {:->10} {:->10} {:->10}  {:->8}", "", "", "", "", "", "");

    for &(w, h, iters) in sizes {
        let total = w * h;
        let (img1, img2) = generate_test_images(w, h, diff_ratio);

        // Rayon + prefilter
        let _ = pixelmatch_rayon_prefilter(&img1, &img2, w, h, threshold);
        let t = Instant::now();
        for _ in 0..iters {
            let _ = pixelmatch_rayon_prefilter(&img1, &img2, w, h, threshold);
        }
        let rayon_us = t.elapsed().as_micros() as f64 / iters as f64;

        // GPU with transfer
        let _ = gpu.run_simple(&img1, &img2, w as u32, h as u32, threshold);
        let t = Instant::now();
        for _ in 0..iters {
            let _ = gpu.run_simple(&img1, &img2, w as u32, h as u32, threshold);
        }
        let gpu_xfer_us = t.elapsed().as_micros() as f64 / iters as f64;

        // GPU dispatch only (prealloc buffers)
        let max_delta = 35215.0f32 * threshold.powi(4);
        let params = Params { width: w as u32, height: h as u32, max_delta, _pad: 0 };
        let param_buf = gpu.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::bytes_of(&params), usage: wgpu::BufferUsages::UNIFORM,
        });
        let img1_buf = gpu.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::cast_slice(&img1), usage: wgpu::BufferUsages::STORAGE,
        });
        let img2_buf = gpu.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None, contents: bytemuck::cast_slice(&img2), usage: wgpu::BufferUsages::STORAGE,
        });
        // Warmup prealloc
        {
            let counter_buf = gpu.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: None, contents: bytemuck::bytes_of(&0u32),
                usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
            });
            let rb = gpu.device.create_buffer(&wgpu::BufferDescriptor {
                label: None, size: 4,
                usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
                mapped_at_creation: false,
            });
            let bg = gpu.device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: None, layout: &gpu.bgl_simple,
                entries: &[
                    wgpu::BindGroupEntry { binding: 0, resource: param_buf.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 1, resource: img1_buf.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 2, resource: img2_buf.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 3, resource: counter_buf.as_entire_binding() },
                ],
            });
            let wg = (total as u32 + 255) / 256;
            let mut enc = gpu.device.create_command_encoder(&Default::default());
            { let mut p = enc.begin_compute_pass(&Default::default()); p.set_pipeline(&gpu.pipeline_simple); p.set_bind_group(0, &bg, &[]); p.dispatch_workgroups(wg, 1, 1); }
            enc.copy_buffer_to_buffer(&counter_buf, 0, &rb, 0, 4);
            gpu.queue.submit(Some(enc.finish()));
            let slice = rb.slice(..);
            let (tx, rx) = std::sync::mpsc::channel();
            slice.map_async(wgpu::MapMode::Read, move |r| { tx.send(r).unwrap(); });
            let _ = gpu.device.poll(wgpu::PollType::Wait);
            rx.recv().unwrap().unwrap();
        }
        // Measure dispatch only
        let t = Instant::now();
        for _ in 0..iters {
            let counter_buf = gpu.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: None, contents: bytemuck::bytes_of(&0u32),
                usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
            });
            let rb = gpu.device.create_buffer(&wgpu::BufferDescriptor {
                label: None, size: 4,
                usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
                mapped_at_creation: false,
            });
            let bg = gpu.device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: None, layout: &gpu.bgl_simple,
                entries: &[
                    wgpu::BindGroupEntry { binding: 0, resource: param_buf.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 1, resource: img1_buf.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 2, resource: img2_buf.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 3, resource: counter_buf.as_entire_binding() },
                ],
            });
            let wg = (total as u32 + 255) / 256;
            let mut enc = gpu.device.create_command_encoder(&Default::default());
            { let mut p = enc.begin_compute_pass(&Default::default()); p.set_pipeline(&gpu.pipeline_simple); p.set_bind_group(0, &bg, &[]); p.dispatch_workgroups(wg, 1, 1); }
            enc.copy_buffer_to_buffer(&counter_buf, 0, &rb, 0, 4);
            gpu.queue.submit(Some(enc.finish()));
            let slice = rb.slice(..);
            let (tx, rx) = std::sync::mpsc::channel();
            slice.map_async(wgpu::MapMode::Read, move |r| { tx.send(r).unwrap(); });
            let _ = gpu.device.poll(wgpu::PollType::Wait);
            rx.recv().unwrap().unwrap();
        }
        let gpu_only_us = t.elapsed().as_micros() as f64 / iters as f64;

        let label = format!("{}x{}", w, h);
        let mpix = total as f64 / 1_000_000.0;
        let win = if gpu_only_us < rayon_us { "<< GPU" } else { "" };
        println!("  {:>12} {:>8.2}MP {:>8.0}µs {:>8.0}µs {:>8.0}µs  {}",
                 label, mpix, rayon_us, gpu_xfer_us, gpu_only_us, win);
    }
    println!();
}

fn main() {
    println!("=== pixelmatch benchmark (CPU / Rayon / GPU) ===");
    eprintln!("Rayon threads: {}", rayon::current_num_threads());

    let gpu = GpuBench::new();
    println!();

    println!("--- GPU vs Rayon crossover (5% diff) ---\n");
    bench_gpu_crossover(&gpu, 5);
    println!("--- GPU vs Rayon crossover (0% diff / identical) ---\n");
    bench_gpu_crossover(&gpu, 0);
    println!("--- GPU vs Rayon crossover (100% diff / all different) ---\n");
    bench_gpu_crossover(&gpu, 100);
}
