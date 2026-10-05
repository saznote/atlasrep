#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PYTHON="${PYTHON:-python3}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Python 3 est requis pour compiler Interface Atlas." >&2
  exit 1
fi

if [[ ! -x ".venv-build/bin/python" ]]; then
  "$PYTHON" -m venv .venv-build
fi
source .venv-build/bin/activate
if ! python -c "import tkinter, _tkinter" >/dev/null 2>&1; then
  echo "Ce Python n'inclut pas Tkinter, requis pour compiler l'interface." >&2
  echo "Ubuntu/Debian : installez python3-tk et relancez avec le Python système." >&2
  exit 1
fi
python -m pip install --upgrade pip
python -m pip install -r requirements-build.txt

python -m PyInstaller --noconfirm --clean --windowed --onedir \
  --name InterfaceAtlas --collect-all mss --collect-all PIL interface_atlas.py

mkdir -p dist
archive_name="InterfaceAtlas-linux-$(uname -m).tar.gz"
tar -C dist -czf "$PWD/dist/$archive_name" InterfaceAtlas
echo "Application portable créée dans dist/InterfaceAtlas/"
echo "Archive portable créée : dist/$archive_name"

if command -v dpkg-deb >/dev/null 2>&1; then
  arch="$(dpkg --print-architecture)"
  package_root="build/deb/interface-atlas"
  rm -rf "$package_root"
  mkdir -p "$package_root/DEBIAN" "$package_root/usr/bin" "$package_root/usr/share/applications"
  install -m 0755 dist/InterfaceAtlas/InterfaceAtlas "$package_root/usr/bin/interface-atlas"
  cat > "$package_root/DEBIAN/control" <<EOF
Package: interface-atlas
Version: 0.1.0
Section: utils
Priority: optional
Architecture: ${arch}
Depends: libx11-6
Maintainer: Interface Atlas
Description: Cartographie locale d'interfaces d'applications
 Capture des écrans, prise de notes et génération d'un prompt de reconstruction.
EOF
  cat > "$package_root/usr/share/applications/interface-atlas.desktop" <<'EOF'
[Desktop Entry]
Name=Interface Atlas
Comment=Cartographier les écrans d'une application
Exec=interface-atlas
Terminal=false
Type=Application
Categories=Utility;
EOF
  dpkg-deb --root-owner-group --build "$package_root" "dist/interface-atlas_0.1.0_${arch}.deb"
  echo "Paquet Debian créé : dist/interface-atlas_0.1.0_${arch}.deb"
else
  echo "dpkg-deb absent : le .deb n'a pas été généré. L'archive portable reste disponible."
fi
