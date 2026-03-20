import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Convert image URI to base64 string for reliable Android APK storage
 * Handles both file:// and content:// URIs
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  try {
    console.log('[imageUriToBase64] Processing URI:', uri);

    // Already a data URI or base64
    if (uri.startsWith('data:')) {
      console.log('[imageUriToBase64] URI is already base64');
      return uri;
    }

    // Determine MIME type from URI
    let mimeType = 'image/jpeg';
    if (uri.toLowerCase().includes('.png')) {
      mimeType = 'image/png';
    } else if (uri.toLowerCase().includes('.jpg') || uri.toLowerCase().includes('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (uri.toLowerCase().includes('.gif')) {
      mimeType = 'image/gif';
    } else if (uri.toLowerCase().includes('.webp')) {
      mimeType = 'image/webp';
    }

    // Handle content:// URIs from Android MediaStore (most common for Android)
    if (uri.startsWith('content://')) {
      console.log('[imageUriToBase64] Reading content:// URI');
      
      // Android content URIs require proper permissions
      const fileInfo = await FileSystemLegacy.getInfoAsync(uri);
      console.log('[imageUriToBase64] File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Image file not found or access denied');
      }

      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });
      
      console.log('[imageUriToBase64] Successfully converted to base64, length:', base64.length);
      return `data:${mimeType};base64,${base64}`;
    }

    // Handle file:// URIs
    if (uri.startsWith('file://')) {
      console.log('[imageUriToBase64] Reading file:// URI');
      
      const fileInfo = await FileSystemLegacy.getInfoAsync(uri);
      console.log('[imageUriToBase64] File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Image file not found');
      }

      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });
      
      console.log('[imageUriToBase64] Successfully converted to base64, length:', base64.length);
      return `data:${mimeType};base64,${base64}`;
    }

    // Try as a regular path (fallback for Android local paths)
    console.log('[imageUriToBase64] Attempting to read as regular path');
    const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });
    
    console.log('[imageUriToBase64] Successfully converted to base64, length:', base64.length);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('[imageUriToBase64] Error converting image to base64:', error);
    console.error('[imageUriToBase64] Original URI:', uri);
    
    // Provide detailed error message
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to convert image (${Platform.OS}): ${errorMsg}. This may be a permissions issue.`);
  }
}

/**
 * Compress and convert image to base64
 * Stores a smaller version for better performance
 */
export async function compressAndConvertImage(uri: string): Promise<string> {
  try {
    // Expo ImagePicker already returns quality: 0.9, so we just need base64 conversion
    return await imageUriToBase64(uri);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Check if a URI is already a data/base64 URI
 */
export function isBase64Uri(uri: string): boolean {
  return uri.startsWith('data:');
}

/**
 * Get MIME type from base64 data URI
 */
export function getMimeTypeFromDataUri(uri: string): string {
  if (!uri.startsWith('data:')) return 'image/jpeg';
  const match = uri.match(/^data:([^;]+);/);
  return match?.[1] || 'image/jpeg';
}
