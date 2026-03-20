const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetRegex = /showToast\('Image Error', \Failed to add image: \$\{errorMessage\}\, 'error'\);\s*\}\s*\}, \[images\.length, showToast\]\);\s*try \{/m;

const replacement = showToast('Image Error', \Failed to add image: \$\{errorMessage\}\, 'error');
    }
  }, [images.length, showToast]);

  const handleLaunchGallery = useCallback(async () => {
    setShowPhotoSourceSheet(false);
    try {;

code = code.replace(targetRegex, replacement);

fs.writeFileSync(file, code);
console.log('Fixed!');
