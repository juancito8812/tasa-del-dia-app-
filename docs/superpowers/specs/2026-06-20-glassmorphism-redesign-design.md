# Glassmorphism Redesign — Tasa del Día

## Goal
Modernize the app's visual identity with a glassmorphism aesthetic and swipe navigation while keeping all current functionality.

## Screens / Components

### 1. Tab Bar (Bottom)
- `BlurView` with `intensity={80}` covering the entire tab bar
- Translucent top border
- Active tab: icon glow + scale animation (spring)
- Inactive tabs: muted color
- Same icon + text layout as current
- Tab bar height: ~60px

### 2. Swipe Navigation
- `react-native-pager-view` wrapping RatesScreen, ConverterScreen, HistoryScreen
- Horizontal swipe to switch pages
- Tap on tab bar also switches page (bidirectional sync)
- PagerView `onPageSelected` → update tab index
- Works on devices with/without gesture navigation (native gesture handling)

### 3. Cards (RateCard)
- `BlurView` with `intensity={40}` as card background
- Card background: `rgba(255,255,255,0.06)` (dark) / `rgba(255,255,255,0.8)` (light)
- Colored glow shadow per rate type (BCV=green, Paralelo=blue, Euro=red, etc.)
- Keep existing layout: icon, title, rate value, subtitle
- Keep compact mode
- Keep shimmer loading state (update shimmer colors for glass)

### 4. Background
- Dark mode: radial gradient `#0a0a14` → `#1a1a3e` (subtle)
- Light mode: solid white with subtle gray
- No blur on background, only on foreground elements (cards, tab bar)

### 5. Header
- Keep solid background (no glass) for readability
- Same layout: title + theme toggle + last updated text

### 6. Converter & History Screens
- Same glass treatment: blurred containers, gradient background
- Keep all existing functionality

## Dependencies
- `expo-blur` (already installable, part of Expo SDK)
- `react-native-pager-view` (already installable, part of Expo SDK)

## Theme Updates
- Dark theme: add `glassCard`, `glassTabBar`, `glowColors` per rate type
- Light theme: white-based glass with shadows instead of blur (performance on low-end)

## No Changes
- All business logic, API services, hooks, context
- Settings, notifications, background tasks
- Navigation structure (same 3 screens)
- Error handling patterns

## Edge Cases
- Low-end Android: if `BlurView` causes jank, fall back to semi-transparent solid colors
- Light mode on Android: `BlurView` works but intensity reduced to 20
- Devices without gesture nav: PagerView uses direct touch handling, works regardless
- Shimmer: update placeholder colors to match glass aesthetic
