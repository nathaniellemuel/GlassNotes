const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/g, "behavior={Platform.OS === 'ios' ? 'padding' : undefined}");
fs.writeFileSync(file, code);
