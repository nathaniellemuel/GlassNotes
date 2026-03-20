const fs = require('fs');

let code = fs.readFileSync('app/editor.tsx', 'utf8');

const imageBlockRegex = /\{\s*images\.length > 0 && \([\s\S]*?<View style=\{styles\.verticalImageContainer\}>[\s\S]*?\{\s*images\.map[\s\S]*?<\/View>\s*\)\s*\}/;

const textInputRegex = /(<View style=\{styles\.divider\} \/>\s*<TextInput\s*ref=\{contentRef\}[\s\S]*?<\/TextInput>)/;

const imgMatch = code.match(imageBlockRegex);
const txtMatch = code.match(textInputRegex);

if (imgMatch && txtMatch) {
    code = code.replace(imageBlockRegex, '');
    code = code.replace(textInputRegex, imgMatch[0] + '\n\n' + txtMatch[0]);
    console.log("Moved image container!");
} else {
    console.error("Could not find regex matches for moving the image block upstream.");
    console.log("img:", !!imgMatch, "txt:", !!txtMatch);
}

// Add Crop Button and handleCropImage
code = code.replace(/const handleRemoveImage = \(index: number\) => \{[\s\S]*?showToast\('Image Removed', 'The photo has been removed\.'\);\s*\};/, `const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
    showToast('Image Removed', 'The photo has been removed.');
  };

  const handleCropImage = async (index: number) => {
    setActiveImageOptionIndex(null);
    try {
      const uri = images[index];
      import('react-native').then(({ Image }) => {
        Image.getSize(uri, async (width, height) => {
          try {
            const newW = width * 0.8;
            const newH = height * 0.8;
            const originX = width * 0.1;
            const originY = height * 0.1;

            const manipResult = await ImageManipulator.manipulateAsync(
              uri,
              [{ crop: { originX, originY, width: newW, height: newH } }],
              { base64: true }
            );

            if (manipResult.base64) {
              const newImages = [...images];
              newImages[index] = 'data:image/jpeg;base64,' + manipResult.base64;
              setImages(newImages);
              setHasUnsavedChanges(true);
              showToast('Image Cropped', 'Zoomed center successfully.');
            }
          } catch(e) {
            console.error(e);
            showToast('Error', 'Crop error.', 'error');
          }
        }, (error) => {
           console.error('get size error', error);
           showToast('Error', 'Cannot crop this image', 'error');
        });
      });
    } catch(err) {
      console.error(err);
      showToast('Error', 'Failed to crop image.', 'error');
    }
  };`);

code = code.replace(/<Text style=\{styles\.imageOptionText\}>Mirror<\/Text>(\s*)<\/Pressable>/, `<Text style={styles.imageOptionText}>Mirror</Text>$1</Pressable>$1<Pressable style={styles.imageOptionItem} onPress={() => handleCropImage(i)}>$1  <MaterialIcons name="crop" size={20} color={GlassTheme.textPrimary} />$1  <Text style={styles.imageOptionText}>Crop (Zoom)</Text>$1</Pressable>`);

fs.writeFileSync('app/editor.tsx', code);
console.log('Done padding layout!');