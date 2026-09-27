/**
 * Browser-side image preparation. Phone photos are often 4000px+ and several
 * MB; vision models don't benefit from that, so we downscale before upload.
 * Everything happens in memory — nothing is cached or stored.
 */

const MAX_EDGE = 1568;
const SMALL_ENOUGH_BYTES = 1.5 * 1024 * 1024;

export async function prepareImageForUpload(file: File): Promise<Blob> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SMALL_ENOUGH_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // JPEG has no alpha; give transparent PNGs a white backdrop.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );
    return blob ?? file;
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
