const fs = require('fs');
let code = fs.readFileSync('app/editor.tsx', 'utf8');

// Fix the incorrect tags
code = code.replace(/<Text style=\{styles\.imageOptionText\}>Crop \(Zoom\)<\/Text>\s*<\/Pressable>\s*<\/ScrollView>/, `<Text style={styles.imageOptionText}>Crop (Zoom)</Text>
                        </Pressable>
                      </View>`);

code = code.replace(/<\/View>\s*\)\}\s*<View style=\{styles\.divider\} \/>/, `</ScrollView>
          )}

<View style={styles.divider} />`);

fs.writeFileSync('app/editor.tsx', code);
console.log('Fixed tags correctly!');