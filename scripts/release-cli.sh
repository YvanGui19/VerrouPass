#!/usr/bin/env bash
# Release CLI VerrouPass : reconstruit le ZIP, calcule son SHA-256, et met
# a jour la constante CLI_SHA256 dans server/src/routes/cli.js.
#
# Usage (sur le VPS prod ou en local) :
#   bash scripts/release-cli.sh
#
# Le ZIP est ecrit dans /var/www/verroupass/downloads/verroupass-cli.zip
# (= chemin que nginx sert via la location /downloads/). En local, on ecrit
# dans ./downloads/ pour pouvoir tester.
#
# Le ZIP est genere en mode "deflate" (pas "stored") pour que l explorateur
# Windows accepte de l ouvrir (issue #16 du chantier securite : le mode
# "stored" provoquait une erreur d extraction sur l explorateur Windows).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$REPO_ROOT/cli"
CLI_JS="$REPO_ROOT/server/src/routes/cli.js"

# Detection prod vs local : si /var/www/verroupass/ existe, on ecrit la-bas.
if [ -d "/var/www/verroupass/downloads" ]; then
  OUT_DIR="/var/www/verroupass/downloads"
else
  OUT_DIR="$REPO_ROOT/downloads"
  mkdir -p "$OUT_DIR"
  echo "[info] /var/www/verroupass/downloads/ absent, ecriture locale dans $OUT_DIR"
fi

ZIP_PATH="$OUT_DIR/verroupass-cli.zip"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Copier le contenu du CLI (sans node_modules ni .git ni fichiers locaux)
echo "[1/4] Copie du CLI dans $TMP_DIR"
rsync -a \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '*.log' \
  "$CLI_DIR/" "$TMP_DIR/verroupass-cli/"

# Build le ZIP en mode deflate (compatibilite Windows Explorer)
echo "[2/4] Construction du ZIP (deflate)"
rm -f "$ZIP_PATH"
( cd "$TMP_DIR" && zip -rq "$ZIP_PATH" verroupass-cli )

# SHA-256
SHA256="$(sha256sum "$ZIP_PATH" | awk '{print $1}')"
SIZE="$(stat -c%s "$ZIP_PATH" 2>/dev/null || stat -f%z "$ZIP_PATH")"
echo "[3/4] SHA-256: $SHA256"
echo "       Taille: $SIZE bytes"

# Mettre a jour CLI_SHA256 dans cli.js
echo "[4/4] Mise a jour de $CLI_JS"
# Compatible GNU sed et BSD sed (macOS) via -i.bak puis suppression du backup.
sed -i.bak -E "s/^const CLI_SHA256 = '[a-f0-9]+';/const CLI_SHA256 = '$SHA256';/" "$CLI_JS"
rm -f "$CLI_JS.bak"

echo
echo "OK. ZIP regenere et CLI_SHA256 mis a jour."
echo "Pense a :"
echo "  - git diff $CLI_JS"
echo "  - git add server/src/routes/cli.js && git commit"
echo "  - pm2 restart verroupass (pour que /api/cli/version serve le nouveau hash)"
