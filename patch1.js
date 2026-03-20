const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

// Imports
if (!code.includes('expo-image-manipulator')) {
    code = code.replace("import * as ImagePicker from 'expo-image-picker';", "import * as ImagePicker from 'expo-image-picker';\nimport * as ImageManipulator from 'expo-image-manipulator';");
}
fs.writeFileSync(file, code);
