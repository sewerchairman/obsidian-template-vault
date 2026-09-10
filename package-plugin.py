"""Build a deterministic installation ZIP without local settings or user notes."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
output = root / 'dist'
output.mkdir(exist_ok=True)
archive = output / f"{manifest['id']}-{manifest['version']}.zip"
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as bundle:
    for name in ['manifest.json', 'main.js', 'vault-ops.js', 'styles.css', 'LICENSE']:
        info = ZipInfo(f"{manifest['id']}/{name}", date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        bundle.writestr(info, (root / name).read_bytes())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
print(f'{archive.name}: {digest}')
