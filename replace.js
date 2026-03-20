const fs = require('fs');
const file = 'C:/Users/Dragon/Native-Projects/GlassNotes/app/editor.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetRegex = /\{images\.length > 0 && \([\s\S]*?<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{styles\.imageGallery\}>[\s\S]*?<\/ScrollView>[\s\S]*?\)\}/;

const replacement = {images.length > 0 && (
            <View style={styles.verticalImageContainer}>
              {images.map((img, i) => (
                <View key={i} style={styles.largeImageWrapper}>
                  <Image source={{ uri: img }} style={styles.largeImage} resizeMode="contain" />
                  <Pressable onPress={() => handleRemoveImage(i)} style={styles.removeLargeImageBtn}>
                    <MaterialIcons name="close" size={24} color="#FFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          )};

code = code.replace(targetRegex, replacement);

fs.writeFileSync(file, code);
console.log('Done!');
