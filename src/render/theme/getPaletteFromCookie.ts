import { PALETTES, type Palette } from './palettes'

/** parse the `palette` cookie from a raw cookie header. unrecognized values
 * collapse to the first palette in the list (midnight by default). */
export const getPaletteFromCookie = (cookie: string | null): Palette => {
  const regex = new RegExp(`palette=(${PALETTES.join('|')})`)
  const match = (cookie ?? '').match(regex)
  return match ? (match[1] as Palette) : PALETTES[0]
}
