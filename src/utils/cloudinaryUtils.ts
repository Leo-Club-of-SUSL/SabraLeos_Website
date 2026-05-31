/**
 * Returns true if the given string is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}

/**
 * Extracts the Cloudinary public_id from a full Cloudinary URL.
 * Handles URLs with and without version numbers, as well as transformations.
 * Example input:  "https://res.cloudinary.com/demo/image/upload/v1234567890/sabraleos/gallery/abc123.jpg"
 * Example output: "sabraleos/gallery/abc123"
 *
 * Also handles URLs without version:
 * "https://res.cloudinary.com/demo/image/upload/sabraleos/gallery/abc123.jpg"
 * → "sabraleos/gallery/abc123"
 *
 * Handles transformations:
 * "https://res.cloudinary.com/demo/image/upload/w_800,h_600/v1234567890/sabraleos/gallery/abc123.jpg"
 * → "sabraleos/gallery/abc123"
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  const uploadToken = '/image/upload/';
  const uploadIndex = url.indexOf(uploadToken);
  if (uploadIndex === -1) return null;

  let remainingPath = url.substring(uploadIndex + uploadToken.length);
  // Remove query parameters or hash if any
  remainingPath = remainingPath.split('?')[0].split('#')[0];

  const segments = remainingPath.split('/');
  
  // Supported standard Cloudinary transformations list to distinguish folders from transformations
  const knownTransformationKeys = [
    'w', 'h', 'c', 'q', 'f', 'e', 'r', 'b', 'bo', 'co', 'bg', 'a', 'o', 'x', 'y', 'z', 'dpr', 'fl', 'l', 'u', 'pg', 'dl', 'p', 'g'
  ];

  let startIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    
    // Check if it's a version segment (e.g., v1234567890)
    if (/^v\d+$/.test(seg)) {
      startIndex = i + 1;
      break;
    }
    
    // Check if it's a transformation segment (e.g. w_800,h_600)
    // Transformation segments consist of comma-separated parts like key_value
    const isTrans = seg.split(',').every(part => {
      const underscoreIndex = part.indexOf('_');
      if (underscoreIndex === -1 || underscoreIndex > 3) return false;
      const key = part.substring(0, underscoreIndex);
      return knownTransformationKeys.includes(key);
    });

    if (isTrans) {
      startIndex = i + 1;
    }
  }

  const publicIdSegments = segments.slice(startIndex);
  if (publicIdSegments.length === 0) return null;

  // Strip file extension from the last segment
  const lastSegment = publicIdSegments[publicIdSegments.length - 1];
  const dotIndex = lastSegment.lastIndexOf('.');
  if (dotIndex !== -1) {
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.substring(0, dotIndex);
  }

  return publicIdSegments.join('/');
}
