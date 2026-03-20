const fs = require('fs');

let code = fs.readFileSync('app/editor.tsx', 'utf8');

// Fix TypeScript typings for handleMoveImage
code = code.replace(/direction: 'up' \| 'down'/g, "direction: 'up' | 'down' | 'left' | 'right'");

code = code.replace(/=== 'up'/g, "=== 'left'");
code = code.replace(/=== 'down'/g, "=== 'right'");

fs.writeFileSync('app/editor.tsx', code);
console.log('Fixed typings for handleMoveImage');