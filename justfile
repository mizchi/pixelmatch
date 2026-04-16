# MoonBit Project Commands

# Default target (js for browser compatibility)
target := "js"

# Default task: check and test
default: check test

# Format code
fmt:
    moon fmt

# Type check
check:
    moon check --deny-warn --target {{target}}

# Run tests
test:
    moon test --target {{target}}

# Update snapshot tests
test-update:
    moon test --update --target {{target}}

# Run main
run:
    moon run src/main --target {{target}}

# Generate type definition files
info:
    moon info

# Clean build artifacts
clean:
    moon clean

# MoonBit benchmarks
bench:
    moon bench --target {{target}}

# Rust benchmarks (CPU / Rayon / GPU)
bench-rs:
    cd bench_rs && cargo run --release

# Build Rust bench
build-rs:
    cd bench_rs && cargo build --release

# Pre-release check
release-check: fmt info check test

# Build npm package (@mizchi/pixelmatch)
build-npm:
    cd npm && moon build --target js --release && node scripts/bundle.js

# Test npm package
test-npm: build-npm
    cd npm && node test/test.js
