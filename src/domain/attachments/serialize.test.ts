import { describe, expect, it } from 'vitest'
import { blobToDataUrl, dataUrlToBlob, deserializeAttachment, serializeAttachment } from './serialize'
import type { Attachment } from './types'

describe('attachment serialization', () => {
  it('round-trips a blob through a data URL without losing bytes', async () => {
    const original = new Blob(['hello faktura'], { type: 'text/plain' })
    const dataUrl = await blobToDataUrl(original)

    expect(dataUrl.startsWith('data:text/plain;base64,')).toBe(true)

    const restored = dataUrlToBlob(dataUrl, 'text/plain')
    expect(await restored.text()).toBe('hello faktura')
    expect(restored.type).toBe('text/plain')
  })

  it('round-trips a full Attachment through serialize/deserialize', async () => {
    const attachment: Attachment = {
      fileName: 'faktura-2026-05.jpg',
      mimeType: 'image/jpeg',
      blob: new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' }),
    }

    const serialized = await serializeAttachment(attachment)
    expect(serialized.fileName).toBe('faktura-2026-05.jpg')
    expect(serialized.mimeType).toBe('image/jpeg')

    const restored = deserializeAttachment(serialized)
    expect(restored.fileName).toBe(attachment.fileName)
    expect(restored.mimeType).toBe(attachment.mimeType)
    expect(await restored.blob.text()).toBe('fake-jpeg-bytes')
  })

  it('preserves binary content that is not valid UTF-8 text', async () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255])
    const original = new Blob([bytes], { type: 'application/octet-stream' })
    const dataUrl = await blobToDataUrl(original)
    const restored = dataUrlToBlob(dataUrl, 'application/octet-stream')

    const restoredBytes = new Uint8Array(await restored.arrayBuffer())
    expect([...restoredBytes]).toEqual([...bytes])
  })
})
