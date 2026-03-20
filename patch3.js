const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetState = "const [toastMessage, setToastMessage] = useState<{title: string; message: string; type?: 'success' | 'error'} | null>(null);";

if (!code.includes('activeImageOptionIndex')) {
  code = code.replace(targetState, targetState + "\n  const [activeImageOptionIndex, setActiveImageOptionIndex] = useState<number | null>(null);");
}

const handlerCode = 
  const handleRotateImage = useCallback(async (index: number) => {
    setActiveImageOptionIndex(null);
    try {
      const imgTarget = images[index];
      const manipResult = await ImageManipulator.manipulateAsync(
        imgTarget,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const newBase64 = await imageUriToBase64(manipResult.uri);
      setImages(prev => {
        const newImgs = [...prev];
        newImgs[index] = newBase64;
        return newImgs;
      });
      showToast('Image Rotated', 'Image updated successfully.', 'success');
    } catch (e) {
      showToast('Edit Error', 'Failed to rotate image.', 'error');
    }
  }, [images, showToast]);

  const handleMoveImage = useCallback((index: number, direction: 'up' | 'down') => {
    setActiveImageOptionIndex(null);
    setImages(prev => {
      const newImgs = [...prev];
      if (direction === 'up' && index > 0) {
        [newImgs[index - 1], newImgs[index]] = [newImgs[index], newImgs[index - 1]];
      } else if (direction === 'down' && index < newImgs.length - 1) {
        [newImgs[index + 1], newImgs[index]] = [newImgs[index], newImgs[index + 1]];
      }
      return newImgs;
    });
  }, []);
;

if (!code.includes('handleRotateImage')) {
    code = code.replace("const handleRemoveImage = useCallback((index: number) => {\n    setImages(prev => prev.filter((_, i) => i !== index));\n  }, []);", "const handleRemoveImage = useCallback((index: number) => {\n    setImages(prev => prev.filter((_, i) => i !== index));\n    setActiveImageOptionIndex(null);\n  }, []);\n" + handlerCode);
}

// Allows editing
code = code.replace(/allowsEditing: false/g, "allowsEditing: true");

// Also replace the entire image renderer with the cover + options layout
const targetImageBlockRegex = /\{images\.length > 0 && \([\s\S]*?verticalImageContainer[\s\S]*?<\/View>\s*\)\}/;

const newImageBlock = {images.length > 0 && (
            <View style={styles.verticalImageContainer}>
              {images.map((img, i) => (
                <View key={i} style={styles.largeImageWrapper}>
                  <Pressable onPress={() => setPreviewImage(img)} style={{ flex: 1 }}>
                    <Image
                      source={{ uri: img }}
                      style={styles.largeImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error(\Error loading image \:\, error);
                        showToast('Image Load Error', 'Failed to load image. It may be corrupted.', 'error');
                      }}
                    />
                  </Pressable>
                  
                  {/* Action Menu Trigger */}
                  <Pressable onPress={() => setActiveImageOptionIndex(activeImageOptionIndex === i ? null : i)} style={[styles.imageActionBtn, { right: 54 }]}>
                    <MaterialIcons name="more-vert" size={24} color="#FFF" />
                  </Pressable>

                  <Pressable onPress={() => handleRemoveImage(i)} style={[styles.imageActionBtn, { right: 12 }]}>
                    <MaterialIcons name="close" size={24} color="#FFF" />
                  </Pressable>

                  {/* Dropdown Options */}
                  {activeImageOptionIndex === i && (
                    <View style={styles.imageActionSheet}>
                      {i > 0 && (
                        <Pressable style={styles.imageOptionItem} onPress={() => handleMoveImage(i, 'up')}>
                          <MaterialIcons name="arrow-upward" size={20} color={GlassTheme.textPrimary} />
                          <Text style={styles.imageOptionText}>Move Up</Text>
                        </Pressable>
                      )}
                      {i < images.length - 1 && (
                        <Pressable style={styles.imageOptionItem} onPress={() => handleMoveImage(i, 'down')}>
                          <MaterialIcons name="arrow-downward" size={20} color={GlassTheme.textPrimary} />
                          <Text style={styles.imageOptionText}>Move Down</Text>
                        </Pressable>
                      )}
                      <Pressable style={styles.imageOptionItem} onPress={() => handleRotateImage(i)}>
                        <MaterialIcons name="rotate-right" size={20} color={GlassTheme.textPrimary} />
                        <Text style={styles.imageOptionText}>Rotate</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )};

code = code.replace(targetImageBlockRegex, newImageBlock);
fs.writeFileSync(file, code);

// Now patch the styles
let stylesCode = fs.readFileSync(file, 'utf8');
const oldStylesRegex = /removeLargeImageBtn: \{[\s\S]*?\},/;
const newStylesStr = imageActionBtn: {
    position: 'absolute',
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  imageActionSheet: {
    position: 'absolute',
    top: 56,
    right: 54,
    backgroundColor: GlassTheme.backgroundElevated,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    padding: GlassTheme.spacing.xs,
    width: 140,
    zIndex: 10,
    ...GlassTheme.shadowPrimary,
  },
  imageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: GlassTheme.spacing.sm,
    gap: GlassTheme.spacing.sm,
  },
  imageOptionText: {
    color: GlassTheme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },;

if(!stylesCode.includes('imageActionSheet')) {
    stylesCode = stylesCode.replace(oldStylesRegex, newStylesStr);
    stylesCode = stylesCode.replace('aspectRatio: 1, // Will make the image square but contained', 'aspectRatio: 16/9,');
    fs.writeFileSync(file, stylesCode);
}
console.log('Success!');
