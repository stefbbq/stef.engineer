import { icons } from "./icons";

const socialLinks = [
  {
    href: "https://www.linkedin.com/in/stefansoc/",
    icon: icons.linkedin,
    label: "LinkedIn",
  },
  {
    href: "https://www.github.com/stefbbq/",
    icon: icons.github,
    label: "GitHub",
  },
  {
    href: "https://www.youtube.com/channel/UCFF82UBrok0wfzCqVkZFIEQ/",
    icon: icons.youtube,
    label: "YouTube",
  },
];

/** social icon row used on the home page */
export const renderSocialLinks = (): string => `
<div class="social-links">
  ${
  socialLinks.map((link) =>
    `<a href="${link.href}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${link.label}">${link.icon}</a>`
  ).join("")
}
</div>`;
