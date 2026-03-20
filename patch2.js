const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add Image Edit State
code = code.replace(/const \[toastMessage, setToastMessage\] = useState[\s\S]*?;\n/m, 
const [toastMessage, setToastMessage] = useState<{title: string; message: string; type?: 'success' | 'error'} | null>(null);
  const [activeImageOptionIndex, setActiveImageOptionIndex] = useState<number | null>(null);\n);

// Add manipulation handlers
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
    code = code.replace(/const handleRemoveImage = useCallback\(\(index: number\) => \{[\s\S]*?\}, \[\]\);/m, const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setActiveImageOptionIndex(null);
  }, []); + handlerCode);
}

fs.writeFileSync(file, code);
