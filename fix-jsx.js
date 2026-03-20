const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = '          )}\r\n              setSelection(e.nativeEvent.selection);\r\n            }}\r\n            selectionColor={GlassTheme.accentPrimary}';

const replacement = \          )}

          <TextInput
            ref={contentRef}
            style={styles.contentInput}
            placeholder="Start writing..."
            placeholderTextColor={GlassTheme.textPlaceholder}
            onChangeText={setContent}
            onSelectionChange={(e) => {
              selectionRef.current = e.nativeEvent.selection;
              setSelection(e.nativeEvent.selection);
            }}
            selectionColor={GlassTheme.accentPrimary}\;

code = code.replace(target, replacement);

// try unix newline if windows fails
if(code === fs.readFileSync(file, 'utf8')) {
    const target2 = '          )}\n              setSelection(e.nativeEvent.selection);\n            }}\n            selectionColor={GlassTheme.accentPrimary}';
    code = code.replace(target2, replacement);
}

fs.writeFileSync(file, code);
