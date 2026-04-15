// Bundle MoonBit JS output into the dist directory
import { copyFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const buildDir = join(root, "_build/js/release/build/src");

// Copy the MoonBit-generated JS file
copyFileSync(join(buildDir, "src.js"), join(root, "dist/pixelmatch.gen.js"));
console.log("Copied pixelmatch.gen.js");

// Copy source map if available
try {
  copyFileSync(join(buildDir, "src.js.map"), join(root, "dist/pixelmatch.gen.js.map"));
  console.log("Copied pixelmatch.gen.js.map");
} catch {
  // Source map may not exist in release builds
}
