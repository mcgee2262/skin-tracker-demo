# Skin Tracker — Design

**Look:** blue and white, iPhone-native feel (iOS Human Interface Guidelines patterns). Mockups: Blaise's "Skin Tracker Screens" design canvas on claude.ai (5 screens: Today, Check In, Progress, Photos, Products).

## Tokens (`src/styles/tokens.css`)
```css
:root {
  --bg: #F2F2F7;          /* grouped background */
  --card: #FFFFFF;
  --text: #000000;
  --text-2: #6E6E73;      /* secondary labels */
  --text-3: #8E8E93;      /* inactive tab icons */
  --separator: #E5E5EA;
  --hairline: #C6C6C8;    /* tab bar top border, 0.5px */
  --blue: #0071E3;        /* primary accent, buttons, active tab */
  --blue-dark: #0A3D91;   /* "Running low", heat map max */
  --blue-tint: #EAF3FF;   /* soft pills, info notes */
  --blue-ink: #0058B0;    /* text on blue-tint */
  --radius-card: 20px;
  --radius-list: 14px;
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif;
}
```
Check In screen is the exception: black background (#000), #1C1C1E panels, white text — like the iPhone Camera app.

## Type
- Large title: 34px / 700 / letter-spacing -0.02em
- Section header (above grouped lists): 13px uppercase, `--text-2`, 16px left inset
- Body / list rows: 17px; subtitles 13px `--text-2`
- Score number: 40px / 700; quote: 26px / 700, white on `--blue`

## Components
- **Grouped inset list:** white, 14px radius, rows ≥ 44px, 1px `--separator` dividers inset to text start.
- **Cards:** white, 20–22px radius, subtle shadow `0 1px 3px rgba(0,0,0,.05)`.
- **Segmented control:** `#E3E3E8` track, 9px radius, selected segment white with `0 1px 3px rgba(0,0,0,.12)`.
- **Primary button:** full width, 56px tall, 16px radius, `--blue` bg, white 17px/600 text + icon.
- **Tab bar:** `rgba(249,249,249,.94)` with `backdrop-filter: blur(20px)`, 0.5px top hairline, 10px labels, active = `--blue` + filled icon, inactive = `--text-3` outline icon. Respect `env(safe-area-inset-bottom)`.
- **Check circles:** filled `--blue` with white check when done; 1.5px `#C7C7CC` ring when not.
- **Status pills (Products):** Not purchased `#E5E5EA`/`#1C1C1E` · Purchased `--blue-tint`/`--blue-ink` · Running low `--blue-dark`/white · Have it? `#F2F2F7`/`--text-2`.
- **Score ring:** 14px stroke, track `--separator`, progress `--blue`, round caps, starts at 12 o'clock.
- Icons: simple 2px-stroke line icons (inline SVG or `lucide-react`). No emoji.

## Motion
- Timelapse crossfade into camera: 300ms opacity.
- Score change on return to Today: number counts up over 600ms.
- Respect `prefers-reduced-motion`.
