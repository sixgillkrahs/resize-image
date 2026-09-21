/**
 * Trigger browser download for a Blob with explicit MIME type and safe filename
 */
export function downloadBlob(blob: Blob, filename: string, mimeType?: string): void {
  let type = mimeType || blob.type;

  // Fallback MIME types based on extension if blob.type is missing or empty
  if (!type || type === "application/octet-stream" || type === "") {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "zip") type = "application/zip";
    else if (ext === "jpg" || ext === "jpeg") type = "image/jpeg";
    else if (ext === "png") type = "image/png";
    else if (ext === "webp") type = "image/webp";
    else if (ext === "avif") type = "image/avif";
    else type = "application/octet-stream";
  }

  const typedBlob = type && blob.type !== type ? new Blob([blob], { type }) : blob;
  const url = URL.createObjectURL(typedBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
