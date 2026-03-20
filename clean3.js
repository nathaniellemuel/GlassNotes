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

code = code.replace(/ {10}\)}\s*<\/Animated\.View>/, '          )}\n\n' + targetBlock + '\n        </Animated.View>');

fs.writeFileSync('app/editor.tsx', code);
console.log('Inserted properly!');