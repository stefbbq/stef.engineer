import type { TechnologyGroup } from '../types'
import { getData } from '../data/kv'

type RouteContext = { request: Request; params: Record<string, string>; query: URLSearchParams; env: unknown }

const SECTION_TITLES = ['Core Technology', 'How I Build', 'Currently Exploring'] as const

const loadTechnologies = async () => getData<TechnologyGroup[]>(null, 'technologies')

export const GET = async (_context: RouteContext) => {
  const technologies = await loadTechnologies()

  if (!technologies || technologies.length === 0) {
    return { html: '<div class="container"><p class="section-text">No capabilities data yet.</p></div>' }
  }

  const intro = `<section>
    <h2>Capabilities</h2>
    <p class="section-text">The short version of what I bring to an engineering problem. Below: the tools I reach for, the practices that shape how I ship, and the edges I'm currently pushing against &mdash; grouped so you can see what I lean on day-to-day, how I work, and what's pulling my attention next.</p>
  </section>`

  const sectionIndices = [0, 1, 3]
  const sections = sectionIndices.map((dataIndex, sectionIndex) => {
    const group = technologies[dataIndex]
    if (!group?.tags) return ''
    const tagsHtml = group.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
    return `<section><h2>${SECTION_TITLES[sectionIndex]}</h2><div class="tags">${tagsHtml}</div></section>`
  }).join('')

  return {
    html: `<div class="container">${intro}${sections}</div>`,
  }
}
