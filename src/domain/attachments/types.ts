/** Naskenovaná/vyfocená faktura připojená k záznamu — uložená přímo v IndexedDB. */
export interface Attachment {
  fileName: string
  mimeType: string
  blob: Blob
}
