export interface DetectedType {
  ext: 'pdf' | 'jpg' | 'png';
  mime: 'application/pdf' | 'image/jpeg' | 'image/png';
}

/** Detects PDF / JPEG / PNG from the first bytes of a file. */
export function detectFileType(buf: Uint8Array): DetectedType | null {
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d) {
    return { ext: 'pdf', mime: 'application/pdf' }; // %PDF-
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length >= 8 && png.every((b, i) => buf[i] === b)) return { ext: 'png', mime: 'image/png' };
  return null;
}
