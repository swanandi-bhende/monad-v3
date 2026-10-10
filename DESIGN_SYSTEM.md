# Gig-a-Chad Design System

Source of truth for the visual language. Tokens live in `src/app/globals.css` (`@theme`). Components live in `src/components/ui`. Change tokens there, not in individual pages.

## Brand

- **Product name:** Gig-a-Chad. Always written with capital G and C, hyphenated.
- **Personality:** confident, editorial, calm. Serious about money and proof, not loud about it.
- **Visual direction:** an editorial product, not a crypto dashboard. Mint paper, plum ink, serif headlines, plum primary actions, and a faint halftone dot texture for depth.
- **Wordmark:** "Gig-a-Chad" set in Instrument Serif, 24px in the header, 40px in the footer. No logo mark yet.

## Colors

Brand palette (only these four hues, plus white for elevated cards). Values are the exact tokens in `globals.css`.

| Hex       | Role                   | Used for                                                                   |
| --------- | ---------------------- | -------------------------------------------------------------------------- |
| `#542344` | Plum (ink and primary) | Headings, body text, primary buttons, active tabs, dark banners and panels |
| `#BFD1E5` | Light blue             | Borders, raised surfaces, the open-status pill                             |
| `#EBF5EE` | Mint                   | Page background                                                            |
| `#808080` | Grey                   | Muted text, labels, hints, expired and refunded states                     |
| `#FFFFFF` | White                  | Cards and inputs (the only neutral added to the palette)                   |

Token map:

| Role                    | Token                       | Value                               |
| ----------------------- | --------------------------- | ----------------------------------- |
| Background (page)       | `canvas`                    | `#EBF5EE`                           |
| Surface (cards, inputs) | `surface`                   | `#FFFFFF`                           |
| Raised surface          | `surface-raised`            | `#BFD1E5`                           |
| Border                  | `line`                      | `#BFD1E5` (at 80% opacity on cards) |
| Text primary            | `ink`                       | `#542344`                           |
| Text muted              | `muted`                     | `#808080`                           |
| Primary action          | `accent`                    | `#542344` (hover: 90% opacity)      |
| Text on primary         | `accent-ink`                | `#EBF5EE`                           |
| Open                    | `status-open`               | `#542344` on `#BFD1E5`              |
| Under review            | `status-review`             | `#542344` on `#EBF5EE`              |
| Completed               | `status-completed`          | `#EBF5EE` on `#542344`              |
| Expired                 | `status-expired`            | `#808080` on `#FFFFFF`              |
| Refunded                | `status-refunded`           | `#FFFFFF` on `#808080`              |
| Error / warning / info  | `danger`, `warning`, `info` | `#542344` (see note)                |

Notes:

- The palette has no red. Errors use plum with bold text and a clear title, so they are still distinct from normal copy. If a red is ever added, set `danger` and nothing else.
- Muted grey text on mint is about 3.5:1 contrast. Use it for labels and hints only. Put anything a user must read on ink.
- Plum is the only action colour. Do not use the blue for buttons; it is for surfaces and borders.

## Typography

- **Display:** Instrument Serif 400 (`font-display`). Italic only for one emphasized word in a hero.
- **Body and UI:** Geist, weights 400 and 500 (`font-sans`).
- **Numbers and addresses:** Geist Mono (`font-mono`).

| Token           | Size / line height                    | Use                                |
| --------------- | ------------------------------------- | ---------------------------------- |
| Hero            | `clamp(2.75rem, 6vw, 4.75rem)` / 1.02 | Board hero headline                |
| `text-display`  | 3.5rem / 1.05                         | Page titles                        |
| `text-title`    | 1.5rem / 2rem                         | Section titles, card titles        |
| Section heading | `sm:text-4xl` in serif                | Live bounties, Recent activity     |
| `text-body`     | 1rem / 1.625rem                       | Default text                       |
| `text-caption`  | 0.8125rem / 1.25rem                   | Labels, meta, hints                |
| Stat value      | 3rem (`text-5xl`), serif, line 1      | Stat cards                         |
| Eyebrow         | caption, uppercase, `tracking-wider`  | Hero kicker, footer section labels |

Weights: headings are `font-normal` (the serif carries the hierarchy). Buttons and labels are `font-medium`. Letter spacing: `tracking-tight` on headings, `tracking-wider` on uppercase eyebrows.

## Spacing

Tailwind's 4px scale.

- Page horizontal padding: `px-6`. Page top padding: `py-12`.
- Between major sections: `space-y-20` (80px). Between a heading and its content: `space-y-8`.
- Card padding: `p-6` (24px). Hero padding: `px-14 py-20` on desktop, `px-6 py-16` on mobile.
- Grid gaps: `gap-6` for cards, `gap-4` for stat rows, `gap-3` for inline controls.

## Radii

- `rounded-pill` (999px): buttons, chips, badges, select, status pills.
- `rounded-xl` (1.5rem): cards, panels, the connect prompt.
- `rounded-lg` (1rem): inputs and textareas.
- `rounded-[2rem]`: the board hero panel only.

## Components

- **Button:** pill shape, `px-5 py-2.5`, `text-body font-medium`. Variants: `primary` (plum, ink text), `secondary` (surface with 15% ink border), `ghost` (text only), `danger` (red, for reclaim), `dark` (ink, for the network banner). Pressed state scales to 98%. Disabled is 45% opacity.
- **Card:** `rounded-xl border border-line/80 bg-surface p-6`. The `interactive` variant lifts 2px on hover, with a stronger border and a soft shadow (`0 18px 40px -24px rgb(31 32 24 / 0.35)`).
- **Stat:** a card with a caption label and a large serif value.
- **Input / textarea:** `rounded-lg border border-line bg-surface px-4 py-3`. Focus: ink border and a 4px `accent/40` ring. Hint text is caption, muted.
- **Select:** pill shape, same focus ring as inputs.
- **Tabs / filter chips:** pill shape. Active: `bg-ink text-canvas`. Inactive: muted text with a hover tint.
- **Badge / status badge:** pill, caption text, status tone background and text (see Colors).
- **Navigation:** text links in `text-body`. Active link is ink, inactive is muted. Below `md`, the links become a horizontally scrolling row under the wordmark and wallet button.
- **Wallet button:** a pill. Disconnected: plum "Connect wallet →". Connected: a secondary pill with the shortened address in mono. A connection error appears under the button in danger text.
- **Connect prompt:** an ink panel (`rounded-xl bg-ink text-canvas`) with a serif heading and a plum button.
- **Modals:** none in the app. Do not add one without a clear reason. Use a card or inline panel instead.
- **Bounty card:** caption meta line (`#id · category`), serif title, muted two-line description, status badge top right. Divider, then a 2x2 grid of reward, deadline, creator, and submissions. Interactive.
- **Submission card:** caption header (number, submitter, time), body text, evidence link in ink with a plum underline, then a divider and the credibility row.
- **Profile sections:** a serif section title, then a stat grid, then a bordered list. Verifiable items link to the explorer.
- **Activity item:** a row inside one bordered card, separated by hairlines. Lime dot, description, timestamp, and a `tx ↗` link in mono.
- **Transaction status:** a surface panel with a small colored dot. Dot colors: plum and pulsing while waiting, green when confirmed, red when failed. Text states are: Waiting for wallet confirmation, Pending on Monad Testnet, Confirmed on Monad Testnet, or a specific failure title with its reason. Always links the hash to Monadscan.
- **Empty state:** dashed border, serif title, muted explanation, optional action.
- **Loading state:** two skeleton cards with a shimmer. Include a caption label so the user knows what is loading.
- **Error state:** a red-tinted panel with a serif title, the error message, and a "Try again" button.

## Layout

- **Max content width:** `max-w-6xl` (1152px), centered.
- **Breakpoints (Tailwind defaults):** below 640px is mobile, `sm` 640px, `md` 768px, `lg` 1024px.
- **Board hero:** a single rounded panel with the halftone texture. Two columns from `md` (headline left, stats right). Stacks on mobile with the panel bleeding to the screen edge.
- **Bounty grid:** one column on mobile, two columns from `md`.
- **Post form:** two columns from `lg` (form left, escrow summary right, sticky on desktop).
- **Detail page:** two columns from `lg` (content left, sticky facts panel right). Stacks on mobile.
- **Footer:** three columns from `md`. Full-width divider, then the copyright row in a constrained inner container.

## Motion

- **Buttons:** colour transition 200ms. Press scale 0.98.
- **Cards:** hover transition 300ms with a 2px lift.
- **Entrance:** `fade-in`, 380ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`, 6px upward slide.
- **Loading:** shimmer on skeletons, 1.4s ease-in-out, looping.
- **Pulse:** transaction dot pulses while waiting.
- **Reduced motion:** all entrance and shimmer animations are disabled under `prefers-reduced-motion: reduce`.

Keep motion small. Nothing should slow a user down or move content they are about to click.

## Design principles

1. **Serif for voice, sans for work.** Headlines and numbers are editorial. Forms, labels, and data stay in clean sans.
2. **One accent, used for action.** Lime means "do this next". Never decorate with it.
3. **Paper, not glass.** Surfaces are warm and flat, separated by hairline borders and whitespace, not heavy shadows.
4. **Show proof.** Every outcome (payout, refund, credibility mark) links to the chain. Trust comes from being able to check.
5. **Never imply success early.** A transaction is pending until the chain confirms it. A payout shows only after the contract reports it completed.
6. **Density where it helps, air everywhere else.** Data tables and activity are compact. Hero and section headings get generous space.
7. **States are part of the design.** Loading, empty, error, and wrong-network states use the same components and tone as the happy path.
8. **Mobile is a first-class layout.** Every page is checked at 390px. Navigation becomes a scrolling row, not a hidden menu.
9. **Consistency beats novelty.** Reuse the components in `src/components/ui` before writing new styles. If a new pattern is needed, add it here first.
