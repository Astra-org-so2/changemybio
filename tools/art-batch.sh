#!/bin/sh
# Конвертирует все assets/raw/*.png → assets/characters/<id>.webp; raw удаляется только при успехе всех.
set -e
python3 -c "import PIL" 2>/dev/null || pip install --quiet --break-system-packages pillow
ok=1
for f in assets/raw/*.png; do id=$(basename "$f" .png); python3 tools/art.py "$f" "$id" || ok=0; done
[ "$ok" = 1 ] && rm -rf assets/raw && echo "batch done" || echo "batch had errors, raw kept"
