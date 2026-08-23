# Galaxy Store Submission Checklist — Tasa del Día

## Pre-submission (before requesting review)

- [ ] Privacy Policy published at a public URL (GitHub Pages recommended)
- [ ] Package name `com.tasadeldia.app` registered in Samsung Seller Office
- [ ] App icon: 512x512px PNG (no transparency)
- [ ] Feature graphic: 1024x500px PNG
- [ ] Screenshots: minimum 2, resolution 1080x2340px (FHD+)
- [ ] App description (mínimo 40 caracteres, máximo 4000)
- [ ] Short description (mínimo 80 caracteres, máximo 800)
- [ ] What's new text for first version

## Build

- [ ] Build with: `eas build --platform android --profile galaxy-store --local`
- [ ] APK signed with EAS keystore (SHA-256: `299073e3…`)
- [ ] `REQUEST_INSTALL_PACKAGES` permission NOT present in APK manifest
- [ ] Auto-update check disabled (Galaxy Store manages updates)

## Samsung Seller Office

- [ ] Create new app listing
- [ ] Upload APK
- [ ] Complete Content Rating (IARC) questionnaire
- [ ] Complete Data Safety form:
  - [ ] "Does this app collect or share any user data?" → No
  - [ ] "Does this app collect location data?" → No
  - [ ] "Is this app designed for children?" → No
- [ ] Set Privacy Policy URL
- [ ] Set category: Finance / Tools
- [ ] Set price: Free
- [ ] Add screenshots and descriptions

## Post-submission

- [ ] Review typically takes 3-5 business days
- [ ] Common rejection reasons to avoid:
  - Missing privacy policy
  - Misleading app description
  - Broken functionality on Samsung devices
  - Missing content rating

## Version Management

- Galaxy Store version: build with `DISTRIBUTION=galaxy-store` env var
- GitHub version: build with default (no env var)
- Both share the same `versionCode` scheme (major*10000 + minor*100 + patch)
- Galaxy Store APK will NOT have auto-update — users update through Galaxy Store
- GitHub APK will continue to auto-update from GitHub Releases
