#!/usr/bin/env bash
set -euo pipefail
scratch_dir=$(mktemp -d)
trap 'rm -rf "$scratch_dir"' EXIT
stage="$scratch_dir/payload"
product="SongWave Frames"
built="build/Frames_artefacts/Release"
vst="Library/Audio/Plug-Ins/VST3/$product.vst3"
app="Applications/$product.app"
pkg="dist/SongWave-Frames-1.1-Mac.pkg"
mkdir -p "$stage/Library/Audio/Plug-Ins/VST3" "$stage/Applications" dist
ditto "$built/VST3/$product.vst3" "$stage/$vst"
ditto "$built/Standalone/$product.app" "$stage/$app"
for item in "$vst" "$app"; do
    lipo "$stage/$item/Contents/MacOS/$product" -verify_arch arm64 x86_64
    codesign --force --sign - "$stage/$item"
    codesign --verify --strict "$stage/$item"
done
pkgbuild --analyze --root "$stage" "$scratch_dir/components.plist"
/usr/bin/python3 - "$scratch_dir/components.plist" <<'PY'
import plistlib,sys
from pathlib import Path
path=Path(sys.argv[1]);bundles=plistlib.loads(path.read_bytes())
for bundle in bundles:
    bundle["BundleIsRelocatable"]=False
path.write_bytes(plistlib.dumps(bundles))
PY
pkgbuild --root "$stage" --component-plist "$scratch_dir/components.plist" --install-location / --ownership recommended --identifier music.songweave.frames.installer --version 1.1.0 "$pkg"
if [[ "${GITHUB_ACTIONS:-}" == true ]]; then
    sudo installer -pkg "$pkg" -target /
    for item in "$vst" "$app"; do
        codesign --verify --strict "/$item"
        cmp "$stage/$item/Contents/MacOS/$product" "/$item/Contents/MacOS/$product"
    done
fi
