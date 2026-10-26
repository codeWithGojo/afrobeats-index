# Website design instructions

Apply Favour / Gojo's `gojo-web-design` skill automatically for website and web UI creation, styling, redesigns, polish, and reviews. The user does not need to invoke it again. Current user instructions and this project's requirements take precedence.

When the skill is unavailable, follow this method:

- Read the current source and requirements first. Preserve existing routes, data, authentication, permissions, integrations, brand assets, approved project lists, and removed features.
- Choose a direction suited to this project's audience and purpose. Give each project its own composition, palette, content density, and signature detail.
- Use a controlled type scale, upright readable headings, consistent spacing, responsive gutters, semantic colour roles, and visible keyboard focus.
- Use specific, natural headings and concrete copy. Avoid repetitive section templates, excessive italics, oversized styling, clutter, arbitrary gradients, and invented evidence.
- Compose mobile layouts deliberately. Keep scrolling native, touch controls comfortable, images useful, and navigation and back paths reliable.
- Use purposeful motion with reduced-motion support. Keep essential actions usable without animation, hovering, holding, microphone access, or autoplay.
- Run relevant build and existing checks. Inspect mobile and desktop rendering when a supported browser is available, and exercise changed controls. State verification limits honestly.

Apply only the relevant checks to targeted work. Preserve each project's identity; follow existing publishing instructions and the user's requested scope.

## UI UX Pro Max integration (complements gojo-web-design)

For UI redesign, brand-page work, frontend components, visual QA, or responsive/accessibility reviews, use the upstream open-source UI UX Pro Max skill alongside the existing gojo-web-design instructions: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill . Existing project instructions and the user request remain authoritative; do not blindly change the visual identity.

On a developer machine, install the official CLI: `npm install -g ui-ux-pro-max-cli`, then inside this repository run `uipro init --ai universal` (or `uipro init --ai codex`, `uipro init --ai copilot` for the actual agent). This is the repository setup instruction, not a claim the CLI is already installed on every developer's machine. Python 3 is required for the skill's search scripts. Pin/review the selected upstream release before adoption.

Recommended skill workflow: inspect the current routes/components/tokens first; use the skill's design-system search to recommend layout, accessible colors, typography, component states, and motion; reuse the existing semantic tokens rather than inventing a parallel theme; check WCAG contrast, keyboard focus, reduced motion, 375/768/1024/1440 responsive widths, and essential functionality; run the project's build/test suite before any deployment.

Project-specific direction: Afri Index: editorial music identity, accessible light/dark liquid-glass design, readable ranking/data visualizations and smooth but performant transitions.

Additional relevant skills in this environment (use only when applicable, not as dependencies): gojo-web-design (already instructed above), Supabase security/SQL practices for auth/data changes, and Vercel deployment/CI guidance for releases. Do not copy plugin secrets or credentials into repo files. Do not automatically deploy for design guidance changes.
