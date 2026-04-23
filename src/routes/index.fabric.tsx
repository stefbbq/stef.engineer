import type { AboutData, SoftSkillsData, SkillItem } from '../types'
import { getData } from '../data/kv'
import { renderMarkdown } from '../render/markdown'
import { renderSocialLinks } from '../render/layout'
import { icons } from '../render/icons'

type RouteContext = { request: Request; params: Record<string, string>; query: URLSearchParams; env: unknown }

const SKILL_ICON_MAP: Record<string, string> = {
  FaSmile: icons.leadership,
  SiElasticstack: icons.architecture,
  FaNetworkWired: icons.systems,
  FaCode: icons.engineering,
}

const loadHomeData = async () => {
  const [about, softSkills, skills] = await Promise.all([
    getData<AboutData>(null, 'general:about'),
    getData<SoftSkillsData>(null, 'general:softSkills'),
    getData<SkillItem[]>(null, 'skills'),
  ])
  return { about, softSkills, skills }
}

export const GET = async (_context: RouteContext) => {
  const { about, softSkills, skills } = await loadHomeData()

  const aboutParagraphs = about?.text
    ? renderMarkdown(
        about.text
          .split(/\s{2,}|\n\n/)
          .filter(Boolean)
          .map(p => p.trim())
          .join('\n\n')
      )
    : ''

  const softSkillsHtml = softSkills ? renderMarkdown(softSkills.text) : ''

  const highlightsHtml = (skills ?? []).map(item => {
    const iconSvg = SKILL_ICON_MAP[item.icon] ?? icons.engineering
    return `<div class="highlight-card">
      <span class="icon-badge">${iconSvg}</span>
      <h3>${item.title}</h3>
      <div class="markdown-content"><p>${renderMarkdownInline(item.description)}</p></div>
    </div>`
  }).join('')

  const html = `
    <div class="container">
      <section class="hero">
        <h1><span class="grad-text">Stefan Šoć-McLeod</span></h1>
        <p class="tagline">Engineering Leader · Chief Software Engineer · ex-Director of Technology</p>
        ${renderSocialLinks()}
      </section>
      <section>
        <h2>About</h2>
        <div class="section-text markdown-content">${aboutParagraphs}</div>
      </section>
      ${highlightsHtml ? `<section><h2>How I Operate</h2><div class="highlights">${highlightsHtml}</div></section>` : ''}
      ${softSkillsHtml ? `<section><h2>How I Lead</h2><div class="markdown-content section-text">${softSkillsHtml}</div></section>` : ''}
    </div>
  `

  return { html }
}

/** inline-only markdown (bold/italic/links/code) without paragraph wrapping */
const renderMarkdownInline = (text: string): string =>
  text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
