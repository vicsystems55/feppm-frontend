export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TICKET_PHOTOS = 5;
const UPLOAD_TIMEOUT_MS = 60_000;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

export const photoUploadConfig = Object.freeze({
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim(),
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim(),
  folder: import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER?.trim() || 'feppm/photos',
  ticketFolder: import.meta.env.VITE_CLOUDINARY_TICKET_FOLDER?.trim() || 'feppm/tickets',
});

function validateConfiguration() {
  if (!photoUploadConfig.cloudName || !photoUploadConfig.uploadPreset) {
    throw new Error('Photo uploads are not configured. Add the Cloudinary settings to the Vue environment and redeploy.');
  }
}

export function validatePhotoFile(file) {
  if (!(file instanceof File)) throw new Error('Select an image to upload.');
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(file.type) && !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('Use a JPG, PNG, WebP, HEIC, or HEIF image.');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Each photo must be 10 MB or smaller.');
  }
}

function uploadErrorMessage(payload, response) {
  const cloudinaryMessage = payload?.error?.message || response.headers.get('X-Cld-Error');
  if (cloudinaryMessage?.toLowerCase().includes('upload preset not found')) {
    return `The Cloudinary upload preset “${photoUploadConfig.uploadPreset}” does not exist. Create it as an unsigned preset and redeploy.`;
  }
  if (cloudinaryMessage?.toLowerCase().includes('unsigned')) {
    return `The Cloudinary preset “${photoUploadConfig.uploadPreset}” must allow unsigned uploads.`;
  }
  return cloudinaryMessage || 'The photo could not be uploaded. Please try again.';
}

async function uploadPhoto(file, { folder, tags }) {
  validateConfiguration();
  validatePhotoFile(file);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', photoUploadConfig.uploadPreset);
    data.append('folder', folder);
    data.append('tags', tags);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(photoUploadConfig.cloudName)}/image/upload`,
      { method: 'POST', body: data, signal: controller.signal },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(uploadErrorMessage(payload, response));
    if (!payload.secure_url) throw new Error('Cloudinary did not return a secure photo URL.');

    return {
      fileUrl: payload.secure_url,
      thumbnailUrl: payload.eager?.[0]?.secure_url || payload.secure_url,
      publicId: payload.public_id,
      width: payload.width,
      height: payload.height,
      bytes: payload.bytes,
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The photo upload timed out. Check your connection and try again.');
    if (error instanceof TypeError) throw new Error('Unable to reach the photo upload service. Check your connection and try again.');
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function uploadChecklistPhoto(file) {
  return uploadPhoto(file, {
    folder: photoUploadConfig.folder,
    tags: 'feppm,checklist-evidence',
  });
}

export async function uploadTicketPhoto(file) {
  const uploaded = await uploadPhoto(file, {
    folder: photoUploadConfig.ticketFolder,
    tags: 'feppm,ticket-attachment',
  });

  return {
    fileUrl: uploaded.fileUrl,
    thumbnailUrl: uploaded.thumbnailUrl,
    fileName: file.name,
    mimeType: file.type || mimeTypeFromExtension(file.name),
    fileSize: file.size,
  };
}

function mimeTypeFromExtension(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  }[extension] || 'application/octet-stream';
}

export async function uploadTicketPhotos(files, onProgress = () => {}) {
  const attachments = [];
  for (const [index, file] of files.entries()) {
    attachments.push(await uploadTicketPhoto(file));
    onProgress(index + 1, files.length);
  }
  return attachments;
}
