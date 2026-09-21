import JSZip from "jszip";
import { ImageItem } from "@/types/image";

export async function createZipArchive(
  items: ImageItem[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  let count = 0;

  for (const item of items) {
    if (item.status === "success" && item.result) {
      const fileName = item.result.outputName || `image_${count + 1}.jpg`;
      zip.file(fileName, item.result.blob);
      count++;
    }
  }

  if (count === 0) {
    throw new Error("No processed images available to generate ZIP.");
  }

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      mimeType: "application/zip",
      compression: "DEFLATE",
      compressionOptions: {
        level: 1, // Fast compression level to minimize CPU/RAM overhead
      },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}
