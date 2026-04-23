import aboutData from './general_about.json'
import softSkillsData from './general_softSkills.json'
import skillsData from './skills.json'
import experienceData from './experience.json'
import technologiesData from './technologies.json'
import menuData from './menu.json'
import artData from './art.json'

const dataMap: Record<string, unknown> = {
  'general:about': aboutData,
  'general:softSkills': softSkillsData,
  'skills': skillsData,
  'experience': experienceData,
  'technologies': technologiesData,
  'menu': menuData,
  'art': artData,
}

/** typed data accessor - reads from bundled JSON.
 *  the legacy first arg is unused (kept for shape compatibility with previous KV-based callers). */
export const getData = async <T>(_kv: unknown, key: string): Promise<T | null> => {
  const data = dataMap[key]
  return (data as T) ?? null
}
