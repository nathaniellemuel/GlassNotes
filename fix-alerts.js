const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/Alert\.alert\(\s*'Permission Required'[\s\S]*?\]\s*\);/g, "showToast('Permission Required', 'Permissions are needed. Please enable them in settings.', 'error');");
code = code.replace(/Alert\.alert\('Error',\s*Failed to open photo gallery: \$\{errorMessage\}\);/g, "showToast('Gallery Error', Failed to open photo gallery: , 'error');");
code = code.replace(/Alert\.alert\('Error',\s*Failed to open camera: \$\{errorMessage\}\);/g, "showToast('Camera Error', Failed to open camera: , 'error');");

fs.writeFileSync(file, code);
