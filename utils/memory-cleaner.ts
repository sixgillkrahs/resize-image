import { ImageItem } from "@/types/image";

/**
 * Revoke object URL safely
 */
export function revokeUrl(url?: string): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

/**
 * Revoke preview URLs for a list of image items
 */
export function cleanupImageItemUrls(items: ImageItem[]): void {
  for (const item of items) {
    revokeUrl(item.previewUrl);
    if (item.result?.blob) {
      // If result blob has a preview url attached
    }
  }
}
