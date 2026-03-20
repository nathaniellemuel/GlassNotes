const fs = require('fs');
let code = fs.readFileSync('app/editor.tsx', 'utf8');

const targetBlock = `<View style={styles.divider} />

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
            selectionColor={GlassTheme.accentPrimary}
            selection={selection}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          >
            {renderColoredContent(content)}
          </TextInput>

          <ChecklistEditor items={checklist} onChange={setChecklist} />`;

code = code.replace(/<View style=\{styles\.divider\} \/>\s*<TextInput[\s\S]*?ChecklistEditor items=\{checklist\} onChange=\{setChecklist\} \/>/g, '');

code = code.replace('          )}\r\n        </Animated.View>', '          )}\r\n\r\n          ' + targetBlock.trim() + '\r\n        </Animated.View>');
code = code.replace('          )}\n        </Animated.View>', '          )}\n\n          ' + targetBlock.trim() + '\n        </Animated.View>');

fs.writeFileSync('app/editor.tsx', code);
console.log('Cleaned aggressively!');