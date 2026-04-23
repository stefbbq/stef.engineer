import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const src = 'dist/client/extensions.js'
const out = 'src/render/_extensionsBundle.ts'

mkdirSync(dirname(out), { recursive: true })
const content = readFileSync(src, 'utf8')
writeFileSync(
  out,
  `/** auto-generated from ${src} - do not edit */\nexport default ${JSON.stringify(content)} as string\n`,
)
console.log(`embedded ${content.length} bytes -> ${out}`)
