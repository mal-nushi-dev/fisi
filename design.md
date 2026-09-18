---
name: Editorial & Refined
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#4e4443'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#807472'
  outline-variant: '#d2c3c1'
  surface-tint: '#6b5b58'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#251917'
  on-primary-container: '#92807d'
  inverse-primary: '#d7c2be'
  secondary: '#645d55'
  on-secondary: '#ffffff'
  secondary-container: '#ebe1d6'
  on-secondary-container: '#6a635b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c1700'
  on-tertiary-container: '#a07d59'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f4ddda'
  primary-fixed-dim: '#d7c2be'
  on-primary-fixed: '#251917'
  on-primary-fixed-variant: '#524341'
  secondary-fixed: '#ebe1d6'
  secondary-fixed-dim: '#cfc5bb'
  on-secondary-fixed: '#201b15'
  on-secondary-fixed-variant: '#4c463e'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#e8bf96'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#5d4122'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  headline-lg:
    fontFamily: Cormorant Garamond
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
  headline-md:
    fontFamily: Cormorant Garamond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-sm:
    fontFamily: Cormorant Garamond
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
---

# Design System: Editorial & Refined

## Brand & Style

The design system adopts a sophisticated, literary-inspired aesthetic characterized by high-end editorial qualities and architectural discipline. It blends timeless typographic hierarchy with a restrained, earthy color palette, creating a calm, deliberate, and authoritative atmosphere. The system relies on quiet confidence, favoring deep contrast, rectilinear geometry, and intentional spatial lift over decorative flourishes.

## Colors

The color palette is grounded in warm, organic tones reminiscent of fine paper and archival ink.

- **Primary (`#010000`)**: Deep obsidian/charcoal-black used for primary text, high-emphasis interactive states, and strong structural anchors.
- **Secondary (`#645d55`)**: Muted taupe-brown for secondary text, metadata, and supporting UI chrome.
- **Tertiary (`#2c1700`)**: Deep umber used sparingly for focused accents and editorial highlights.
- **Neutral & Canvas (`#fbf9f6`)**: An off-white, warm parchment background that reduces eye strain and provides a soft, paper-like canvas.
- **Elevated White (`#FFFFFF`)**: Pure white (`surface-container-lowest`) reserved for elevated, floating components such as the search bar and modals.

## Typography

Typography bridges classic editorial layouts with modern digital legibility.

- **Headlines** utilize **Cormorant Garamond**, a graceful serif typeface that brings literary authority and distinctive character to titles and major headings.
- **Body and Labels** use **Plus Jakarta Sans**, a highly legible contemporary sans-serif ensuring crisp readability across dense UI components, search inputs, and running text.

## Layout & Spacing

The layout philosophy follows a balanced, editorial grid structure with generous whitespace that emphasizes content clarity. Spacing is anchored to a standard 4px/8px multiplier scale, providing consistent rhythm across padding, margins, and component gaps. Content containers use max-width constraints to maintain optimal reading lengths for editorial layouts.

## Elevation & Depth

Elevation pairs deliberate tonal layering with purposeful, soft-diffuse drop shadows that provide spatial lift for focal interactive components without visual clutter.

- **Soft Editorial Lift (Search Bar, Floating Panels):**
  - **CSS:** `box-shadow: 0 2px 24px -4px rgba(27, 28, 26, 0.08);`
  - **Specifications:** `x: 0`, `y: 2px`, `blur: 24px`, `spread: -4px`.
  - **Color Tuning:** The shadow is tinted with the system's warm charcoal tone (`rgba(27, 28, 26, 0.08)` from `#1B1C1A`). This tint integrates seamlessly with the `#FBF9F6` parchment background, avoiding muddy gray halos and mimicking natural paper elevation under gallery lighting.
  - *(Neutral fallback: `rgba(0, 0, 0, 0.08)`)*
- **Higher Elevation (Modals, Dropdowns):**
  - **CSS:** `box-shadow: 0 4px 32px -4px rgba(27, 28, 26, 0.12);`
- **Structural Separation:** Non-elevated containers rely on subtle tonal shifts (`surface-container-low`, `surface-container`) or delicate hairline outlines (`#D0C4BD`).

## Shapes & Geometry

The shape language is strictly **rectilinear with zero border-radius (`0px`)**. All components—including navigation bars, search inputs, containers, buttons, cards, and chips—eschew rounded corners entirely.

- **Radius Scale:** All tokens (`sm`, `md`, `lg`, `xl`, `full`) resolve to `0px`.
- **Architectural Edge:** Rectangular geometry evokes classic print broadsheets, archival index cards, and Swiss modernist design. Lines are deliberate, crisp, and authoritative.

## Components

### Search Bar

- **Geometry:** Completely squared-out rectangle with zero border radius (`border-radius: 0px`).
- **Border:** **None** (`border: none`). Eliminates harsh outlines to create a modern, floating bar that integrates smoothly with the layout.
- **Background:** Crisp pure white (`#FFFFFF` / `surface-container-lowest`) to separate it cleanly from the warm canvas (`#FBF9F6`).
- **Elevation / Shadow:**

  ```css
  box-shadow: 0 2px 24px -4px rgba(27, 28, 26, 0.08);
  ```
