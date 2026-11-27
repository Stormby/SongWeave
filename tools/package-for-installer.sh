#!/usr/bin/env bash
set -euo pipefail
scratch_dir=$(mktemp -d)
trap 'rm -rf "$scratch_dir"' EXIT
stage="$scratch_dir/payload"
mkdir -p "$stage" dist
bundle="$stage/Songweave.vst3"
ditto "build/Songweave_artefacts/Release/VST3/Songweave.vst3" "$bundle"
binary="$bundle/Contents/MacOS/Songweave"
lipo "$binary" -verify_arch arm64 x86_64
codesign --force --sign - "$bundle"
codesign --verify --strict "$bundle"
destination="/Library/Audio/Plug-Ins/VST3"
pkgbuild --analyze --root "$stage" "$scratch_dir/components.plist"
/usr/bin/python3 - "$scratch_dir/components.plist" <<'PY'
import plistlib,sys
from pathlib import Path
path=Path(sys.argv[1])
bundles=plistlib.loads(path.read_bytes())
for bundle in bundles:
    bundle["BundleIsRelocatable"]=False
path.write_bytes(plistlib.dumps(bundles))
PY
pkgbuild --root "$stage" --component-plist "$scratch_dir/components.plist" --install-location "$destination" --ownership recommended --identifier music.songweave.installer --version 0.2.0 dist/Songweave-Mac.pkg
# Smoke-install only on the disposable macOS runner.
if [[ "${GITHUB_ACTIONS:-}" == true ]]; then
    sudo installer -pkg dist/Songweave-Mac.pkg -target /
    installed="$destination/Songweave.vst3"
    codesign --verify --strict "$installed"
    cmp "$binary" "$installed/Contents/MacOS/Songweave"
fi
