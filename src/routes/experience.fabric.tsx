import type { ExperienceItem } from '../types'
import { getData } from '../data/kv'
import { renderMarkdown } from '../render/markdown'

type RouteContext = { request: Request; params: Record<string, string>; query: URLSearchParams; env: unknown }

const loadExperience = async () => getData<ExperienceItem[]>(null, 'experience')

export const GET = async (_context: RouteContext) => {
  const experience = await loadExperience()

  if (!experience || experience.length === 0) {
    return { html: '<div class="container"><p class="section-text">No experience data yet.</p></div>' }
  }

  const sorted = [...experience].sort((a, b) => b.id - a.id)

  const cards = sorted.map(item => {
    const descriptionHtml = renderMarkdown(item.description.replace(/  /g, '\n'))
    const tagsHtml = (item.skills ?? []).map(s => `<span class="tag">${s}</span>`).join('')

    return `<div class="experience-card">
      <div class="experience-header">
        <h3>${item.role}</h3>
        <span class="experience-org">${item.organization}</span>
      </div>
      <span class="experience-date">${item.dateRange}</span>
      <div class="section-text markdown-content">${descriptionHtml}</div>
      <div class="tags">${tagsHtml}</div>
    </div>`
  }).join('')

  const intro = `<p class="section-text" style="margin-bottom:2rem">A selection of the work and the teams behind it — from agency creative technology to enterprise platform engineering and, most recently, building product from the ground up.</p>`

  return {
    html: `<div class="container"><section><h2>Selected Engagements</h2>${intro}${cards}</section></div>`,
  }
}
