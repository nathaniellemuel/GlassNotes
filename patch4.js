const fs = require('fs');

let code = fs.readFileSync('app/editor.tsx', 'utf8');

// Replace "verticalImageContainer" with "horizontalImageContainer" 
code = code.replace(/<View style=\{styles\.verticalImageContainer\}>/, '<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalImageContainer}>');
code = code.replace(/<\/View>(\s*)\)}/, '</ScrollView>$1)}');

// Replace Move Up/Down with Move Left/Right
code = code.replace(/handleMoveImage\(i, 'up'\)/g, "handleMoveImage(i, 'left')");
code = code.replace(/handleMoveImage\(i, 'down'\)/g, "handleMoveImage(i, 'right')");

code = code.replace(/>Move Up</g, ">Left<");
code = code.replace(/>Move Down</g, ">Right<");

// Change Styles
code = code.replace(/verticalImageContainer: \{[\s\S]*?\},/g, `horizontalImageContainer: {
    flexDirection: 'row',
    paddingVertical: GlassTheme.spacing.md,
    gap: GlassTheme.spacing.sm,
  },`);

code = code.replace(/imageItemContainer: \{[\s\S]*?\},/g, `imageItemContainer: {
    width: 140,
    position: 'relative',
    marginRight: 10,
  },`);

code = code.replace(/largeImageWrapper: \{[\s\S]*?\},/g, `largeImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: GlassTheme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },`);

code = code.replace(/largeImage: \{[\s\S]*?\},/g, `largeImage: {
    width: '100%',
    height: '100%',
  },`);

code = code.replace(/imageReorderRow: \{[\s\S]*?\},/g, `imageReorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },`);


// Refactor: Edit image options UI position slightly for smaller box
code = code.replace(/\{ right: 60 \}/g, "{ right: 8, top: 8 }");
code = code.replace(/\{ right: 12 \}/g, "{ right: 8, top: 40 }");

// And let's fix handleInsertPhoto to NOT allow editing.
code = code.replace(/allowsEditing: true/g, "allowsEditing: false");

fs.writeFileSync('app/editor.tsx', code);
console.log('Done transforming to horizontal squares!');
