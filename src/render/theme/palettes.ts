/** canonical list of supported accent palettes. must match the palette files
 * under `src/styles/themes/palettes/`. consumed by the cookie parser, the
 * boot-time theme script, and the in-page palette cycle button. */
export const PALETTES = [
  'midnight',
  'neon',
  'sunset',
  'forest',
  'vapor',
] as const

export type Palette = (typeof PALETTES)[number]
