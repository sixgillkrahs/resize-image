/**
 * Format bytes to human readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Sanitize filename to prevent path traversal and invalid character issues
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\s?%*:|"<>]/g, "_")
    .replace(/\.\./g, "_")
    .replace(/_+/g, "_")
    .trim();
}

/**
 * Get file extension based on format or MIME type
 */
export function getImageExtension(formatOrType: string): string {
  if (!formatOrType) return "jpg";
  const clean = formatOrType.toLowerCase().replace("image/", "").trim();
  switch (clean) {
    case "jpeg":
    case "jpg":
      return "jpg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    default:
      return clean || "jpg";
  }
}

/**
 * Generate output filename based on pattern template
 * e.g., pattern="{name}_resized", name="photo.png" => "photo_resized.webp"
 */
export function generateOutputFilename(
  originalFilename: string,
  pattern: string,
  targetFormat: string
): string {
  const lastDotIndex = originalFilename.lastIndexOf(".");
  const baseName =
    lastDotIndex > 0
      ? originalFilename.substring(0, lastDotIndex)
      : originalFilename;
  const originalExt =
    lastDotIndex > 0 ? originalFilename.substring(lastDotIndex + 1) : "jpg";

  let finalExt = "jpg";
  if (targetFormat === "original") {
    finalExt = getImageExtension(originalExt) || "jpg";
  } else {
    finalExt =
      getImageExtension(targetFormat) || getImageExtension(originalExt) || "jpg";
  }

  const formattedName = pattern
    ? pattern.replace("{name}", baseName).replace("{ext}", originalExt)
    : `${baseName}_resized`;

  const sanitizedBase = sanitizeFilename(formattedName).replace(/\.+$/, "");

  return `${sanitizedBase}.${finalExt}`;
}
