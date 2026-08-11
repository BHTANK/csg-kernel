#!/usr/bin/env node
/**
 * csg-kernel CLI — npx entry for customers
 *
 *   npx csg-kernel              help
 *   npx csg-kernel init [dir]   scaffold a browser demo project
 *   npx csg-kernel demo         serve built-in demos (union + wall/door)
 *   npx csg-kernel version
 */

import { createServer } from 'node:http';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '..');
const PKG = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'));

const args = process.argv.slice(2);
const cmd = (args[0] || 'help').toLowerCase();

function help() {
  console.log(`
csg-kernel v${PKG.version} — proper BSP CSG for three.js

Install (customers):
  npm install csg-kernel three
  # or from GitHub before npm publish lands:
  npm install github:BHTANK/csg-kernel three

In your code:
  import { CSG, wallWithDoor, Brush, Evaluator, SUBTRACTION } from 'csg-kernel';

CLI:
  npx csg-kernel init [dir]   Scaffold a ready-to-open demo project
  npx csg-kernel demo         Serve union + wall/door demos (http://localhost:5177)
  npx csg-kernel version      Print package version
  npx csg-kernel help         This message

Docs: https://github.com/BHTANK/csg-kernel
`.trim());
}

function version() {
  console.log(PKG.version);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.d.ts': 'text/plain; charset=utf-8'
};

function serveDemo(port = 5177) {
  const root = PKG_ROOT;
  const server = createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = resolve(root, '.' + urlPath);
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        res.writeHead(404);
        res.end('Not found: ' + urlPath);
        return;
      }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(readFileSync(filePath));
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });

  // Ensure index for demo hub
  const indexPath = join(root, 'index.html');
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, DEMO_INDEX_HTML);
  }

  server.listen(port, () => {
    console.log(`
csg-kernel demos → http://localhost:${port}

  /                 hub
  /demo.html        union / subtract / intersect
  /wall-prefab.html wall + door + windows (gap-free)

Ctrl+C to stop.
`.trim());
  });
}

const DEMO_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>csg-kernel demos</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, sans-serif; background: #0a0c10; color: #d8e2ee; }
    main { max-width: 420px; padding: 2rem; border: 1px solid #1e2a3a; border-radius: 12px;
      background: rgba(12,16,24,.9); }
    h1 { margin: 0 0 .5rem; color: #3dffa8; font-size: 1.25rem; }
    p { color: #7a8a9e; font-size: .9rem; line-height: 1.45; }
    a { display: block; margin: .5rem 0; padding: .75rem 1rem; border-radius: 8px;
      background: #121822; border: 1px solid #243044; color: #6eb6ff; text-decoration: none; }
    a:hover { border-color: #3dffa8; color: #3dffa8; }
    code { color: #3dffa8; font-size: .8rem; }
  </style>
</head>
<body>
  <main>
    <h1>csg-kernel</h1>
    <p>Proper BSP boolean kernel for three.js. Pick a demo:</p>
    <a href="./demo.html">Boolean playground — union / subtract / intersect</a>
    <a href="./wall-prefab.html">Wall / door / window prefab (no gaps)</a>
    <p style="margin-top:1.25rem">In your app:<br/>
      <code>npm install csg-kernel three</code><br/>
      <code>import { CSG } from 'csg-kernel'</code>
    </p>
  </main>
</body>
</html>
`;

function scaffold(dirArg) {
  const target = resolve(process.cwd(), dirArg || 'csg-kernel-demo');
  if (existsSync(target) && existsSync(join(target, 'package.json'))) {
    console.error(`Refusing to overwrite existing project: ${target}`);
    process.exit(1);
  }
  mkdirSync(target, { recursive: true });

  const pkg = {
    name: 'csg-kernel-demo',
    private: true,
    type: 'module',
    scripts: {
      start: 'npx --yes serve . -p 5178',
      demo: 'npx csg-kernel demo'
    },
    dependencies: {
      'csg-kernel': `^${PKG.version}`,
      three: '^0.160.0'
    }
  };
  writeFileSync(join(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  // importmap demo — works after npm install via bare serve of node_modules
  const html = readFileSync(join(PKG_ROOT, 'templates', 'scaffold.html'), 'utf8');
  writeFileSync(join(target, 'index.html'), html);

  writeFileSync(
    join(target, 'README.md'),
    `# csg-kernel demo

Scaffolded by \`npx csg-kernel init\`.

\`\`\`bash
cd ${dirArg || 'csg-kernel-demo'}
npm install
npm start
# open http://localhost:5178
\`\`\`

Edit \`index.html\` — boolean ops use:

\`\`\`js
import { CSG, wallWithDoor, SUBTRACTION } from 'csg-kernel';
\`\`\`
`
  );

  console.log(`
Created ${target}

Next:
  cd ${dirArg || 'csg-kernel-demo'}
  npm install
  npm start

Then open http://localhost:5178
`.trim());
}

function main() {
  switch (cmd) {
    case 'help':
    case '-h':
    case '--help':
      help();
      break;
    case 'version':
    case '-v':
    case '--version':
      version();
      break;
    case 'demo':
    case 'serve': {
      const port = Number(args[1]) || 5177;
      serveDemo(port);
      break;
    }
    case 'init':
    case 'create':
      scaffold(args[1]);
      break;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      help();
      process.exit(1);
  }
}

main();
