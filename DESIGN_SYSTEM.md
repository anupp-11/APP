# ChimeTracker Design System

## Color Palettes

### Palette 1: "Midnight Ops" (Recommended - Dark Mode Primary)

Best for long operator sessions, reduces eye strain.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F1117` | Main background |
| `--bg-secondary` | `#1A1D26` | Cards, panels |
| `--bg-tertiary` | `#252A36` | Hover states, elevated surfaces |
| `--border-default` | `#2E3442` | Default borders |
| `--border-focus` | `#4F5A6E` | Focus rings |
| `--text-primary` | `#F4F4F5` | Primary text |
| `--text-secondary` | `#9CA3AF` | Secondary text |
| `--text-muted` | `#6B7280` | Muted/disabled text |
| `--deposit-green` | `#22C55E` | Deposits, positive amounts |
| `--deposit-green-bg` | `#22C55E1A` | Green background tint |
| `--withdraw-red` | `#EF4444` | Withdrawals, negative amounts |
| `--withdraw-red-bg` | `#EF44441A` | Red background tint |
| `--warning-amber` | `#F59E0B` | Near-limit warnings |
| `--warning-amber-bg` | `#F59E0B1A` | Amber background tint |
| `--holding-blue` | `#3B82F6` | Holding account badge |
| `--holding-blue-bg` | `#3B82F61A` | Blue background tint |
| `--paying-purple` | `#A855F7` | Paying account badge |
| `--paying-purple-bg` | `#A855F71A` | Purple background tint |
| `--platform-teal` | `#14B8A6` | Platform cards |
| `--inactive-gray` | `#4B5563` | Disabled/inactive states |

### Palette 2: "Clean Light" (Light Mode Alternative)

For bright environments or user preference.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FFFFFF` | Main background |
| `--bg-secondary` | `#F9FAFB` | Cards, panels |
| `--bg-tertiary` | `#F3F4F6` | Hover states |
| `--border-default` | `#E5E7EB` | Default borders |
| `--border-focus` | `#9CA3AF` | Focus rings |
| `--text-primary` | `#111827` | Primary text |
| `--text-secondary` | `#4B5563` | Secondary text |
| `--text-muted` | `#9CA3AF` | Muted/disabled text |
| `--deposit-green` | `#16A34A` | Deposits (darker for contrast) |
| `--withdraw-red` | `#DC2626` | Withdrawals |
| `--warning-amber` | `#D97706` | Near-limit warnings |
| `--holding-blue` | `#2563EB` | Holding account badge |
| `--paying-purple` | `#9333EA` | Paying account badge |
| `--platform-teal` | `#0D9488` | Platform cards |
| `--inactive-gray` | `#9CA3AF` | Disabled/inactive states |

### Palette 3: "High Contrast" (Accessibility)

Maximum readability for critical operations.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#000000` | Main background |
| `--bg-secondary` | `#121212` | Cards, panels |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--deposit-green` | `#4ADE80` | Bright green |
| `--withdraw-red` | `#F87171` | Bright red |
| `--warning-amber` | `#FBBF24` | Bright amber |
| `--holding-blue` | `#60A5FA` | Bright blue |
| `--paying-purple` | `#C084FC` | Bright purple |

---

## Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page Title | Inter | 24px (1.5rem) | 700 | 1.2 |
| Section Header | Inter | 18px (1.125rem) | 600 | 1.3 |
| Card Title | Inter | 14px (0.875rem) | 600 | 1.4 |
| Body Text | Inter | 14px (0.875rem) | 400 | 1.5 |
| Small Text | Inter | 12px (0.75rem) | 400 | 1.4 |
| Badge Text | Inter | 11px (0.6875rem) | 600 | 1 |
| Amount Display | Inter | 20px (1.25rem) | 700 | 1 |
| Quick Button | Inter | 16px (1rem) | 600 | 1 |

---

## Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, inline spacing |
| `space-2` | 8px | Component internal padding |
| `space-3` | 12px | Small gaps between elements |
| `space-4` | 16px | Default gap, card padding |
| `space-5` | 20px | Medium sections |
| `space-6` | 24px | Large sections, page margins |
| `space-8` | 32px | Section separators |
| `space-10` | 40px | Major layout gaps |

---

## Component Specifications

### 1. Transaction Type Toggle

Large, prominent segmented control for Deposit/Withdraw selection.

```
┌─────────────────────────────────────┐
│  [  DEPOSIT  ]  │   WITHDRAW        │  ← Active has filled bg
└─────────────────────────────────────┘
```

- **Dimensions**: Full width, height 56px (touch-friendly)
- **Border Radius**: 12px outer, 8px inner segments
- **Active Deposit**: bg `#22C55E`, text white
- **Active Withdraw**: bg `#EF4444`, text white
- **Inactive**: bg transparent, text `--text-secondary`
- **Transition**: 150ms ease-out

### 2. Quick Amount Buttons

Grid of preset amount buttons for rapid entry.

```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  $5  │ │ $10  │ │ $15  │ │ $20  │
└──────┘ └──────┘ └──────┘ └──────┘
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ $25  │ │ $30  │ │ $50  │ │ $100 │
└──────┘ └──────┘ └──────┘ └──────┘
```

- **Dimensions**: Min 64px × 44px
- **Grid**: 4 columns, gap 8px
- **Border Radius**: 8px
- **Default**: bg `--bg-tertiary`, border `--border-default`
- **Hover**: border `--border-focus`
- **Selected**: border 2px `--holding-blue`, bg `--holding-blue-bg`
- **Font**: 16px, weight 600

### 3. Source Card (Chime Account / Platform)

Selectable card showing account status and limits.

```
┌─────────────────────────────────────────┐
│ ⚡ John's Chime          [HOLDING]      │
│                                         │
│ IN   $1,250 / $2,000  ████████░░ 62%   │
│ OUT  $1,800 / $2,000  █████████░ 90% ⚠ │
│                                         │
│ ○ Active    ATM: ✓                     │
└─────────────────────────────────────────┘
```

- **Dimensions**: Min 280px width, auto height
- **Padding**: 16px
- **Border Radius**: 12px
- **Default**: bg `--bg-secondary`, border `--border-default`
- **Hover**: bg `--bg-tertiary`, border `--border-focus`
- **Selected**: border 2px `--holding-blue`
- **Near-limit (>80%)**: Left border 3px `--warning-amber`
- **Inactive**: Opacity 0.5, bg `--inactive-gray` tint

### 4. Badges

Small status indicators.

| Type | Background | Text | Border |
|------|------------|------|--------|
| Holding | `--holding-blue-bg` | `--holding-blue` | none |
| Paying | `--paying-purple-bg` | `--paying-purple` | none |
| Platform | `--platform-teal` + 10% | `--platform-teal` | none |
| Active | `#22C55E1A` | `--deposit-green` | none |
| Inactive | `--bg-tertiary` | `--text-muted` | none |
| Warning | `--warning-amber-bg` | `--warning-amber` | none |

- **Padding**: 4px 8px
- **Border Radius**: 4px
- **Font**: 11px, weight 600, uppercase

### 5. Form Inputs

- **Height**: 48px (touch-friendly)
- **Padding**: 12px 16px
- **Border Radius**: 8px
- **Background**: `--bg-tertiary`
- **Border**: 1px `--border-default`
- **Focus**: border `--holding-blue`, ring 2px `--holding-blue` at 20% opacity
- **Error**: border `--withdraw-red`
- **Placeholder**: `--text-muted`

### 6. Primary Button (Submit)

- **Height**: 56px
- **Padding**: 16px 32px
- **Border Radius**: 12px
- **Deposit Mode**: bg `--deposit-green`, hover darken 10%
- **Withdraw Mode**: bg `--withdraw-red`, hover darken 10%
- **Disabled**: bg `--inactive-gray`, cursor not-allowed
- **Font**: 16px, weight 600, uppercase tracking wide

### 7. Progress Bars (Limit Usage)

- **Height**: 6px
- **Border Radius**: 3px
- **Background**: `--bg-tertiary`
- **Fill (normal)**: `--holding-blue`
- **Fill (warning >80%)**: `--warning-amber`
- **Fill (critical >95%)**: `--withdraw-red`

---

## Quick Transaction Page Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back   QUICK TRANSACTION                              [User] [⚙]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────┐  ┌────────────────────────────────┐ │
│  │                              │  │   SELECT SOURCE                │ │
│  │  ┌─────────────┬───────────┐ │  │                                │ │
│  │  │  DEPOSIT    │ WITHDRAW  │ │  │  ┌────────────┐ ┌────────────┐ │ │
│  │  └─────────────┴───────────┘ │  │  │ Chime #1   │ │ Chime #2   │ │ │
│  │                              │  │  │ HOLDING    │ │ PAYING     │ │ │
│  │  Game *                      │  │  │ IN: ████   │ │ IN: ██████ │ │ │
│  │  ┌──────────────────────────┐│  │  │ OUT: ██    │ │ OUT: ████  │ │ │
│  │  │ Select game...        ▼ ││  │  │ ● Active   │ │ ● Active   │ │ │
│  │  └──────────────────────────┘│  │  └────────────┘ └────────────┘ │ │
│  │                              │  │                                │ │
│  │  Amount *                    │  │  ┌────────────┐ ┌────────────┐ │ │
│  │  ┌──────────────────────────┐│  │  │ Chime #3   │ │ Platform   │ │ │
│  │  │ $0.00                    ││  │  │ HOLDING ⚠  │ │ Today      │ │ │
│  │  └──────────────────────────┘│  │  │ IN: ██████ │ │            │ │ │
│  │                              │  │  │ OUT: █████ │ │ TEAL CARD  │ │ │
│  │  ┌────┐┌────┐┌────┐┌────┐   │  │  │ ● Active   │ │ ● Active   │ │ │
│  │  │ $5 ││$10 ││$15 ││$20 │   │  │  └────────────┘ └────────────┘ │ │
│  │  └────┘└────┘└────┘└────┘   │  │                                │ │
│  │  ┌────┐┌────┐┌────┐┌─────┐  │  │  ┌────────────┐                │ │
│  │  │$25 ││$30 ││$50 ││$100 │  │  │  │ Solar Pay  │                │ │
│  │  └────┘└────┘└────┘└─────┘  │  │  │ PLATFORM   │                │ │
│  │                              │  │  │            │                │ │
│  │  ▶ Add Notes (optional)      │  │  │ TEAL CARD  │                │ │
│  │                              │  │  │ ● Active   │                │ │
│  │  ┌──────────────────────────┐│  │  └────────────┘                │ │
│  │  │                          ││  │                                │ │
│  │  │   SUBMIT DEPOSIT         ││  │                                │ │
│  │  │                          ││  │                                │ │
│  │  └──────────────────────────┘│  │                                │ │
│  │                              │  │                                │ │
│  └──────────────────────────────┘  └────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Layout Specs:
- **Container**: Max-width 1400px, centered
- **Columns**: Left 45%, Right 55%, gap 32px
- **Breakpoint**: Stack vertically below 1024px
- **Left Column**: Sticky top on desktop

### Interaction Flow:
1. Toggle Deposit/Withdraw (defaults to Deposit)
2. Select or search for Game
3. Enter amount (type or click quick button)
4. Optionally expand notes
5. Click source card on right (keyboard: Tab + Enter)
6. Submit (Enter key or click)

### Validation:
- Game: Required, inline error below field
- Amount: Required, must be > 0
- Source: Required, show border highlight on right section if missing

---

## File Structure

```
app/
├── (dashboard)/
│   ├── layout.tsx              # Dashboard shell with nav
│   ├── quick-transaction/
│   │   └── page.tsx            # Main quick transaction page
│   ├── accounts/
│   │   └── page.tsx            # Account management
│   └── history/
│       └── page.tsx            # Transaction history
├── globals.css                 # Tailwind + CSS variables
└── layout.tsx                  # Root layout

components/
├── ui/                         # Base shadcn components
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── badge.tsx
├── transaction/
│   ├── TransactionTypeToggle.tsx
│   ├── AmountQuickButtons.tsx
│   ├── SourceCard.tsx
│   ├── SourceGrid.tsx
│   └── TransactionForm.tsx
├── layout/
│   ├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
└── shared/
    ├── ProgressBar.tsx
    └── StatusBadge.tsx

lib/
├── types.ts                    # TypeScript interfaces
├── mock-data.ts               # Mock data for development
└── utils.ts                   # Utility functions

```
