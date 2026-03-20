const fs = require('fs');

let code = fs.readFileSync('app/editor.tsx', 'utf8');
code = code.replace(/GlassTheme\.borderRadius\.md/g, 'GlassTheme.radius.md');
fs.writeFileSync('app/editor.tsx', code);
console.log('Fixed typo in theme property!');