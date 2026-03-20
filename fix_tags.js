const fs = require('fs');
let code = fs.readFileSync('app/editor.tsx', 'utf8');

code = code.replace(/<\/ScrollView>(\s*)\)}[\s\S]*?<\/View>(\s*)\)}/m, (match) => {
    // We expect the first to be restored to </View> and the second changed to </ScrollView>
    return match.replace('</ScrollView>', '</View>').replace(/<\/View>(\s*)\)}/, '</ScrollView>$1)}');
});

fs.writeFileSync('app/editor.tsx', code);
console.log('Fixed tags!');