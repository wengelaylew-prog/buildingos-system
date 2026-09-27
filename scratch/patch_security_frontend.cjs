const fs = require('fs');

// 1. Patch vite.config.ts
let viteCode = fs.readFileSync('vite.config.ts', 'utf8');
const viteTarget = `    server: {`;
const viteReplace = `    build: {
      sourcemap: false, // Ensures no source map files are generated
      minify: 'esbuild', // Minify and mangle the code
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'; // Obfuscates library structure
            }
          }
        }
      }
    },
    esbuild: {
      drop: ['console', 'debugger'], // Removes console.log and debugger statements from production
    },
    server: {`;
if (!viteCode.includes('drop: [\'console\'')) {
  viteCode = viteCode.replace(viteTarget, viteReplace);
  fs.writeFileSync('vite.config.ts', viteCode);
  console.log('Patched vite.config.ts for security');
}

// 2. Patch index.html
let htmlCode = fs.readFileSync('index.html', 'utf8');
const htmlTarget = `<title>Building &amp; Tenant Management System</title>`;
const htmlReplace = `<title>Building &amp; Tenant Management System</title>
    <script>
      // Disable React DevTools in production to prevent component inspection
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
          supportsFiber: true,
          inject: function() {},
          onCommitFiberRoot: function() {},
          onCommitFiberUnmount: function() {},
        };
      }
      // Disable right-click (context menu) to discourage simple inspection
      document.addEventListener('contextmenu', event => {
        if (window.location.hostname !== 'localhost') event.preventDefault();
      });
      // Disable F12 and Ctrl+Shift+I shortcuts
      document.addEventListener('keydown', function(e) {
        if (window.location.hostname !== 'localhost') {
          if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
          }
        }
      });
    </script>`;
if (!htmlCode.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
  htmlCode = htmlCode.replace(htmlTarget, htmlReplace);
  fs.writeFileSync('index.html', htmlCode);
  console.log('Patched index.html for security');
}

