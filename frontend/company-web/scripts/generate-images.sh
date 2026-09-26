#!/usr/bin/env bash
# Renders the website's social share image and app icons as PNG files (docs/marketing/seo/technical.md).
# The site is a static export on S3, so these are real files, generated once and committed; run again
# only when the logo or the design changes:
#   bash frontend/company-web/scripts/generate-images.sh
# Uses the approved logo from @oxinov/design-system unchanged (never redrawn) and Orbitron Bold, both
# rendered by librsvg in a pinned Alpine container. Needs Docker.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/.." && pwd)"
BRAND="$(cd "$WEB/../../packages/design-system/assets/brand" && pwd)"
ALPINE=alpine:3.22@sha256:5291449c3df73caf6ed85e649dec1b9e818b39a5d8c871e97afc13e9cd5e8fa8
# Orbitron Bold, SIL Open Font License, from The League of Moveable Type, pinned by commit and SHA-256.
ORBITRON_URL=https://raw.githubusercontent.com/theleagueof/orbitron/13e6a5222aa6818d81c9acd27edd701a2d744152/Orbitron%20Bold.ttf
ORBITRON_SHA256=ed4acd72c6ef9ff4d1a2558ba72f2b85b411830a8aa2eb59f1c20b3a1127990c

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

# Places a whole logo file inside another SVG at the given position and size.
embed() {
  local file=$1 x=$2 y=$3 size=$4
  sed -e '/<?xml/d' -e "s|<svg xmlns=\"http://www.w3.org/2000/svg\"|<svg x=\"$x\" y=\"$y\" width=\"$size\" height=\"$size\"|" "$file"
}

# --- Social share image, 1200 x 630 (Open Graph and X) ---------------------------------------------
{
  cat <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="#14142A" stroke-width="1"/>
    </pattern>
    <linearGradient id="signature" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#00F0FF"/>
      <stop offset="0.5" stop-color="#C040FF"/>
      <stop offset="1" stop-color="#FF3EEC"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#07070D"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
EOF
  # The transparent symbol: the glow variant carries its own black square, which would show on the grid.
  embed "$BRAND/oxinov-symbol.svg" 96 165 300
  cat <<'EOF'
  <text x="440" y="300" font-family="Orbitron" font-weight="700" font-size="104" letter-spacing="10" fill="#E6F1FF">OXINOV</text>
  <text x="444" y="372" font-family="Orbitron" font-weight="700" font-size="24" letter-spacing="3" fill="#8B9BB4">SOFTWARE / SERVICES / RESEARCH</text>
  <text x="444" y="432" font-family="Orbitron" font-weight="700" font-size="26" letter-spacing="3" fill="#00F0FF">OXINOV.COM</text>
  <rect y="614" width="1200" height="16" fill="url(#signature)"/>
</svg>
EOF
} > "$STAGE/og.svg"

# --- Maskable icon: the app icon inside the 80% safe zone on the brand background -------------------
{
  echo '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">'
  echo '  <rect width="512" height="512" fill="#07070D"/>'
  embed "$BRAND/oxinov-app-icon.svg" 51 51 410
  echo '</svg>'
} > "$STAGE/maskable.svg"
cp "$BRAND/oxinov-app-icon.svg" "$STAGE/icon.svg"

mkdir -p "$WEB/public/og" "$WEB/public/icons"
# Git Bash on Windows needs a Windows path for the Docker mount; elsewhere the path is used as is.
MOUNT=$(cygpath -w "$STAGE" 2>/dev/null || echo "$STAGE")
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$MOUNT:/work" -w /work \
  -e ORBITRON_URL="$ORBITRON_URL" -e ORBITRON_SHA256="$ORBITRON_SHA256" \
  "$ALPINE" sh -euc '
    apk add --no-cache -q rsvg-convert fontconfig curl >/dev/null
    mkdir -p /usr/share/fonts/orbitron
    curl -fsSL -o /usr/share/fonts/orbitron/Orbitron-Bold.ttf "$ORBITRON_URL"
    echo "$ORBITRON_SHA256  /usr/share/fonts/orbitron/Orbitron-Bold.ttf" | sha256sum -c -s
    fc-cache -f >/dev/null
    rsvg-convert -w 1200 -h 630 og.svg -o og.png
    rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
    rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
    rsvg-convert -w 180 -h 180 icon.svg -o apple-touch-icon.png
    rsvg-convert -w 512 -h 512 maskable.svg -o maskable-512.png
  '

cp "$STAGE/og.png" "$WEB/public/og/oxinov.png"
cp "$STAGE"/{icon-512.png,icon-192.png,apple-touch-icon.png,maskable-512.png} "$WEB/public/icons/"
echo "wrote public/og/oxinov.png and public/icons/{icon-192,icon-512,maskable-512,apple-touch-icon}.png"
