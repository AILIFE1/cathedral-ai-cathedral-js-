// Renames CJS output files to .cjs and moves them to dist/
import { readdirSync, renameSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const cjsDir = "dist/cjs";
const distDir = "dist";

for (const file of readdirSync(cjsDir)) {
  if (file.endsWith(".js")) {
    const src = join(cjsDir, file);
    const dest = join(distDir, file.replace(/\.js$/, ".cjs"));
    let content = readFileSync(src, "utf8");
    // Fix require() calls to use .cjs extension
    content = content.replace(/require\("\.\/([^"]+)\.js"\)/g, 'require("./$1.cjs")');
    writeFileSync(dest, content);
  }
}

// Clean up temp cjs dir
import { rmSync } from "fs";
rmSync(cjsDir, { recursive: true, force: true });

console.log("CJS files written to dist/*.cjs");
