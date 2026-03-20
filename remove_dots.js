const fs = require('fs');
let code = fs.readFileSync('app/editor.tsx', 'utf8');

// The pattern to match everything from Action Menu Trigger up to the closing View of the Dropdown Action Sheet
const regex = /\{\/\*\s*Action Menu Trigger \(Options\)\s*\*\/\}[\s\S]*?\{\/\*\s*Dropdown Action Sheet\s*\*\/\}[\s\S]*?<\/View>\s*\)\}/;

// We replace it all with just the simple Remove Button (and we'll move it to top right `top: 8`)
const replacement = `{/* Remove Button */}
                    <Pressable onPress={() => handleRemoveImage(i)} style={[styles.imageActionBtn, { right: 8, top: 8 }]}>
                      <MaterialIcons name="close" size={24} color="#FFF" />     
                    </Pressable>`;

code = code.replace(regex, replacement);

fs.writeFileSync('app/editor.tsx', code);
console.log('Removed 3-dot menu and simplified to X button');