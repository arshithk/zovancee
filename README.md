# Zovance Website

## Overview
A premium, agency‑level website for **Zovance**, a Zoho‑focused business solutions company. The site showcases a modern design system, sticky navigation, an interactive hero section with a Zoho ecosystem visualization, and a responsive layout.

## Folder Structure
```
Zovance website/
├─ assets/               # Supplied brand assets (logos, images)
├─ src/
│  ├─ css/
│  │   ├─ styles.css      # Global variables, resets, base typography
│  │   ├─ hero.css        # Hero section styles and background
│  ├─ components/
│  │   ├─ navigation.html # Navigation markup
│  │   ├─ navigation.css  # Navigation styles (desktop + mobile)
│  │   ├─ button.css      # Button component styles
│  │   ├─ card.css        # Card component styles
│  │   ├─ hero.html       # Hero markup
│  ├─ js/
│  │   └─ navigation.js   # Sticky nav + mobile toggle behavior
│  ├─ index.html          # Home page assembling navigation & hero
│  └─ assets/
│      └─ zoho-visualization.svg  # SVG ecosystem diagram
├─ package.json          # Vite dev server, build, lint scripts
├─ .eslintrc.json        # Basic ESLint config for JS
├─ .stylelintrc.json     # Basic Stylelint config for CSS
└─ README.md             # This file
```

## Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in a browser.
3. Build for production:
   ```bash
   npm run build
   ```

## Linting
- CSS lint: `npm run lint:css`
- JS lint: `npm run lint:js`

## Design System
- Global CSS variables for colors, spacing, typography are defined in `src/css/styles.css`.
- Components (buttons, cards, navigation) use these variables for consistency.
- The hero section uses a gradient background, subtle grid overlay, and an animated SVG.

## Responsiveness
- Mobile navigation collapses into a hamburger menu.
- Hero layout switches to a vertical stack on screens < 768 px.
- All components are built mobile‑first.

## License
© 2026 Zovance. All rights reserved.
