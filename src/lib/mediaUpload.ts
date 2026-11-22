import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Invalid image format.'));
    img.src = rawUrl;
  });

  const maxDim = 1080;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return rawUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = /data:(.*?);base64/.exec(header);
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export interface UploadResult {
  url: string;
  provider: 'firebase-storage' | 'server-uploads';
}

export async function uploadCampusItemImage(
  file: File,
  folder: 'reports' | 'listings' | 'avatars',
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPEG, PNG, or WebP image file.');
  }

  const compressedDataUrl = await compressImageToDataUrl(file);
  const blob = dataUrlToBlob(compressedDataUrl);
  const uid = auth.currentUser?.uid || 'anon';

  // Try Firebase Storage first when available & permitted
  try {
    const storagePath = `unilink/${folder}/${uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, storagePath);
    const snapshot = await Promise.race([
      uploadBytes(storageRef, blob, { contentType: 'image/jpeg' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 4500),
      ),
    ]);
    const url = await getDownloadURL(snapshot.ref);
    if (url.length <= 500) {
      return { url, provider: 'firebase-storage' };
    }
  } catch {
    // Firebase Storage bucket may not be enabled or rules may block uploads; fall back to Node.js /api/upload
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: compressedDataUrl, fileName: file.name }),
  });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Failed to upload image.');
  }
  return { url: payload.url, provider: 'server-uploads' };
}
