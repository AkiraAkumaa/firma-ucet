import type { Attachment } from './types'

/** Podoba přílohy v JSON záloze — Blob nelze serializovat, takže jde jako data URL. */
export interface SerializedAttachment {
  fileName: string
  mimeType: string
  dataUrl: string
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export async function serializeAttachment(attachment: Attachment): Promise<SerializedAttachment> {
  return {
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    dataUrl: await blobToDataUrl(attachment.blob),
  }
}

export function deserializeAttachment(serialized: SerializedAttachment): Attachment {
  return {
    fileName: serialized.fileName,
    mimeType: serialized.mimeType,
    blob: dataUrlToBlob(serialized.dataUrl, serialized.mimeType),
  }
}
