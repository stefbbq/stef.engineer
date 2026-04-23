export type Env = {
  readonly SITE_DATA: KVNamespace
}

export type AboutData = {
  readonly text: string
}

export type SoftSkillsData = {
  readonly text: string
}

export type SkillItem = {
  readonly id: number
  readonly title: string
  readonly description: string
  readonly icon: string
  readonly color: string
  readonly backgroundColor: string
}

export type ExperienceItem = {
  readonly id: number
  readonly role: string
  readonly organization: string
  readonly dateRange: string
  readonly description: string
  readonly bg: string
  readonly skills?: readonly string[]
}

export type TechnologyGroup = {
  readonly id: number
  readonly tags: readonly string[]
}

export type MenuItem = {
  readonly id: number
  readonly name: string
  readonly routePath: string
  readonly icon: string
}

export type ArtItem = {
  readonly id: string
  readonly src: string
  readonly srcset: string
  readonly width?: number
  readonly height?: number
}
