/**
 * scrapes stefansoc.myportfolio.com/artfeed for image URLs, downloads each
 * srcset variant locally to public/art/, and writes src/data/art.json with
 * local relative paths.
 *
 * adobe portfolio server-renders the gallery HTML with srcsets, so a single
 * fetch is enough. each art item has up to 3 variants (600w / 1200w / 1920w).
 *
 * usage: pnpm seed:art
 */

import { writeFileSync, mkdirSync, existsSync, statSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { imageSize } from 'image-size'

const FEED_URL = 'https://stefansoc.myportfolio.com/artfeed'
const ART_DIR = join(process.cwd(), 'public/art')
const OUT_PATH = join(process.cwd(), 'src/data/art.json')
const PUBLIC_PREFIX = '/art'

type ArtItem = {
  readonly id: string
  readonly src: string
  readonly srcset: string
  readonly width?: number
  readonly height?: number
}

type ScrapedItem = ArtItem & {
  readonly remoteSrc: string
  readonly remoteSrcset: ReadonlyArray<{ readonly url: string; readonly descriptor: string }>
}

/** parse the html for `<img src=... srcset=...>` and dedupe by content id */
const extractItems = (html: string): readonly ScrapedItem[] => {
  const seen = new Map<string, ScrapedItem>()
  const imgPattern = /<img\b[^>]*?src=["']([^"']+)["'][^>]*?srcset=["']([^"']+)["'][^>]*?>/gi
  const srcsetPattern = /<img\b[^>]*?srcset=["']([^"']+)["'][^>]*?src=["']([^"']+)["'][^>]*?>/gi

  const parseSrcset = (raw: string): ReadonlyArray<{ readonly url: string; readonly descriptor: string }> =>
    raw
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [url, descriptor = ''] = part.split(/\s+/)
        return { url, descriptor }
      })

  const collect = (match: RegExpExecArray, srcFirst: boolean) => {
    const src = srcFirst ? match[1] : match[2]
    const srcset = srcFirst ? match[2] : match[1]
    if (!src.includes('cdn.myportfolio.com')) return
    if (src.includes('_carw_')) return // skip cover thumbnails

    const idMatch = src.match(/cdn\.myportfolio\.com\/[a-f0-9]+\/([a-f0-9-]+)/i)
    if (!idMatch) return
    const id = idMatch[1]
    if (seen.has(id)) return

    const widthMatch = match[0].match(/width=["']?(\d+)/)
    const heightMatch = match[0].match(/height=["']?(\d+)/)

    seen.set(id, {
      id,
      src: '',
      srcset: '',
      remoteSrc: src,
      remoteSrcset: parseSrcset(srcset),
      ...(widthMatch ? { width: parseInt(widthMatch[1], 10) } : {}),
      ...(heightMatch ? { height: parseInt(heightMatch[1], 10) } : {}),
    })
  }

  let match: RegExpExecArray | null
  while ((match = imgPattern.exec(html)) !== null) collect(match, true)
  while ((match = srcsetPattern.exec(html)) !== null) collect(match, false)

  // many gallery items only appear as <div class="js-lightbox" data-src="..."> with the
  // original full-resolution URL (no _rw_ size suffix). pick those up too. for these we
  // synthesize a srcset by deriving the standard rw_600 / rw_1200 / rw_1920 variants.
  const lightboxPattern = /<[^>]*\bdata-src=["'](https?:\/\/cdn\.myportfolio\.com\/[a-f0-9]+\/[a-f0-9-]+\.[a-z0-9]+(?:\?[^"']*)?)["'][^>]*>/gi
  while ((match = lightboxPattern.exec(html)) !== null) {
    const src = match[1]
    if (src.includes('_carw_')) continue

    const idMatch = src.match(/cdn\.myportfolio\.com\/[a-f0-9]+\/([a-f0-9-]+)/i)
    if (!idMatch) continue
    const id = idMatch[1]
    if (seen.has(id)) continue

    // strip the query string and extension to build the resized URL templates
    const noQuery = src.split('?')[0]
    const dot = noQuery.lastIndexOf('.')
    const base = noQuery.slice(0, dot)
    const ext = noQuery.slice(dot)
    const synthSrcset: ReadonlyArray<{ readonly url: string; readonly descriptor: string }> = [
      { url: `${base}_rw_600${ext}`, descriptor: '600w' },
      { url: `${base}_rw_1200${ext}`, descriptor: '1200w' },
      { url: `${base}_rw_1920${ext}`, descriptor: '1920w' },
    ]

    seen.set(id, {
      id,
      src: '',
      srcset: '',
      remoteSrc: src,
      remoteSrcset: synthSrcset,
    })
  }

  return Array.from(seen.values())
}

/** strip query, infer extension, build a clean local filename like `<id>_1920.jpg` */
const localFilenameFor = (url: string): string => {
  const noQuery = url.split('?')[0]
  const ext = extname(noQuery).toLowerCase() || '.jpg'
  const idMatch = noQuery.match(/\/([a-f0-9-]+)(_rw_(\d+))?\.(jpg|jpeg|png|gif|webp)$/i)
  if (!idMatch) return noQuery.split('/').pop() || `unknown${ext}`
  const id = idMatch[1]
  const size = idMatch[3] ?? 'orig'
  return `${id}_${size}${ext}`
}

const downloadIfMissing = async (url: string, destPath: string): Promise<number> => {
  if (existsSync(destPath)) return statSync(destPath).size
  const response = await fetch(url)
  if (!response.ok) throw new Error(`download failed: ${response.status} ${url}`)
  const buf = Buffer.from(await response.arrayBuffer())
  await writeFile(destPath, buf)
  return buf.length
}

const main = async () => {
  mkdirSync(ART_DIR, { recursive: true })

  console.log(`fetching ${FEED_URL}...`)
  const response = await fetch(FEED_URL)
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`)

  const html = await response.text()
  console.log(`got ${html.length} bytes of html`)

  const items = extractItems(html)
  console.log(`extracted ${items.length} unique items, downloading variants...\n`)

  const finalItems: ArtItem[] = []
  let totalBytes = 0

  for (const [index, item] of items.entries()) {
    const localSrcsetParts: string[] = []
    let localSrc = ''

    for (const variant of item.remoteSrcset) {
      const localName = localFilenameFor(variant.url)
      const destPath = join(ART_DIR, localName)
      try {
        const size = await downloadIfMissing(variant.url, destPath)
        totalBytes += size
        const publicPath = `${PUBLIC_PREFIX}/${localName}`
        localSrcsetParts.push(`${publicPath} ${variant.descriptor}`.trim())
      } catch (error) {
        console.warn(`  skipping ${localName}: ${(error as Error).message}`)
      }
    }

    // pick the largest local variant (last entry in srcset) as the primary src
    const srcLocalName = localFilenameFor(item.remoteSrc)
    const srcDestPath = join(ART_DIR, srcLocalName)
    try {
      const size = await downloadIfMissing(item.remoteSrc, srcDestPath)
      totalBytes += size
      localSrc = `${PUBLIC_PREFIX}/${srcLocalName}`
    } catch (error) {
      console.warn(`  skipping primary ${srcLocalName}: ${(error as Error).message}`)
      // fall back to the largest variant from srcset
      if (localSrcsetParts.length > 0) {
        localSrc = localSrcsetParts[localSrcsetParts.length - 1].split(' ')[0]
      }
    }

    // measure the downloaded primary image to get natural dimensions
    let measuredWidth = item.width
    let measuredHeight = item.height
    if (existsSync(srcDestPath) && (!measuredWidth || !measuredHeight)) {
      try {
        const dims = imageSize(readFileSync(srcDestPath))
        if (dims.width && dims.height) {
          measuredWidth = dims.width
          measuredHeight = dims.height
        }
      } catch (error) {
        console.warn(`  could not read dimensions for ${srcLocalName}`)
      }
    }

    finalItems.push({
      id: item.id,
      src: localSrc,
      srcset: localSrcsetParts.join(', '),
      ...(measuredWidth ? { width: measuredWidth } : {}),
      ...(measuredHeight ? { height: measuredHeight } : {}),
    })

    console.log(`  [${index + 1}/${items.length}] ${item.id.slice(0, 8)} ✓`)
  }

  writeFileSync(OUT_PATH, JSON.stringify(finalItems, null, 2))

  console.log(`\nwrote ${finalItems.length} items to ${OUT_PATH}`)
  console.log(`downloaded ${(totalBytes / 1024 / 1024).toFixed(1)} MB to ${ART_DIR}`)
}

main().catch(error => {
  console.error('seed-art failed:', error)
  process.exit(1)
})
