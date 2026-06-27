import fs from "node:fs";
import path from "node:path";

const targets = [
  {
    file: "node_modules/@granite-js/plugin-micro-frontend/dist/index.js",
    from: "path.resolve(modulePath)",
    to: "path.resolve(modulePath).replaceAll('\\\\', '/')",
  },
  {
    file: "node_modules/@granite-js/plugin-micro-frontend/dist/index.cjs",
    from: "path.default.resolve(modulePath)",
    to: "path.default.resolve(modulePath).replaceAll('\\\\', '/')",
  },
  {
    file: "node_modules/@apps-in-toss/plugin-compat/dist/index.js",
    from: 'const reactUsePolyfillPath = __require.resolve("react18-use");',
    to: 'const reactUsePolyfillPath = __require.resolve("react18-use").replaceAll("\\\\", "/");',
  },
  {
    file: "node_modules/@apps-in-toss/plugin-compat/dist/index.js",
    from: 'const reactEffectEventPolyfillPath = __require.resolve("use-effect-event");',
    to: 'const reactEffectEventPolyfillPath = __require.resolve("use-effect-event").replaceAll("\\\\", "/");',
  },
  {
    file: "node_modules/@apps-in-toss/plugin-compat/dist/index.cjs",
    from: 'const reactUsePolyfillPath = require.resolve("react18-use");',
    to: 'const reactUsePolyfillPath = require.resolve("react18-use").replaceAll("\\\\", "/");',
  },
  {
    file: "node_modules/@apps-in-toss/plugin-compat/dist/index.cjs",
    from: 'const reactEffectEventPolyfillPath = require.resolve("use-effect-event");',
    to: 'const reactEffectEventPolyfillPath = require.resolve("use-effect-event").replaceAll("\\\\", "/");',
  },
];

let patchedCount = 0;

for (const target of targets) {
  const targetFile = path.resolve(process.cwd(), target.file);

  if (!fs.existsSync(targetFile)) {
    console.warn(`[fix-windows-path] target not found: ${target.file}`);
    continue;
  }

  const original = fs.readFileSync(targetFile, "utf8");

  if (original.includes(target.to)) {
    console.log(`[fix-windows-path] already patched: ${target.file}`);
    continue;
  }

  if (!original.includes(target.from)) {
    console.warn(`[fix-windows-path] expected snippet not found: ${target.file}`);
    continue;
  }

  const patched = original.replace(target.from, target.to);
  fs.writeFileSync(targetFile, patched, "utf8");
  patchedCount += 1;
  console.log(`[fix-windows-path] patch applied: ${target.file}`);
}

if (patchedCount === 0) {
  console.log("[fix-windows-path] no changes");
}