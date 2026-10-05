/**
 * Utility for capturing screens using modern Web Screen Capture API (getDisplayMedia),
 * reading image files, and handling clipboard paste.
 */

export async function captureScreenViaDisplayMedia(): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error(
      "L'API de capture d'écran du navigateur n'est pas supportée dans cet environnement. Utilisez l'import d'image."
    );
  }

  // Request display media
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: 'window',
    },
    audio: false,
  });

  const track = stream.getVideoTracks()[0];
  if (!track) {
    throw new Error('Aucun flux vidéo sélectionné.');
  }

  // Create temporary video element to grab frame
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.play().then(resolve).catch(reject);
    };
    video.onerror = () => reject(new Error('Erreur de chargement du flux vidéo'));
  });

  // Short delay to ensure frame is rendered
  await new Promise((resolve) => setTimeout(resolve, 300));

  const width = video.videoWidth || 1920;
  const height = video.videoHeight || 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    track.stop();
    throw new Error('Impossible d’initialiser le contexte canvas 2D');
  }

  ctx.drawImage(video, 0, 0, width, height);

  // Stop all media tracks immediately
  track.stop();
  stream.getTracks().forEach((t) => t.stop());

  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, width, height };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier doit être une image (PNG, JPG, WebP, etc.).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier image'));
    reader.readAsDataURL(file);
  });
}

export function extractImageFromClipboardEvent(e: React.ClipboardEvent | ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      return items[i].getAsFile();
    }
  }
  return null;
}
