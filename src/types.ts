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
  /**
   * base64-encoded tiny (~24px) JPEG used as an instant LQIP placeholder. when
   * present, the client `image-progressive` extension paints it as a blurred
   * backdrop until the real thumb decodes.
   */
  readonly placeholder?: string
}
