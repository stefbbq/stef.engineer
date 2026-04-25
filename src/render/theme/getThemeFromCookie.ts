/** parse the `theme` cookie from a raw cookie header, falling back to `dark`
 * when the cookie is missing or malformed. */
export const getThemeFromCookie = (cookie: string | null): 'dark' | 'light' => {
  const match = (cookie ?? '').match(/theme=(dark|light)/)
  return match ? (match[1] as 'dark' | 'light') : 'dark'
}
