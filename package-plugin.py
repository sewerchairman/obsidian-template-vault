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
    for name in ['manifest.json', 'main.js', 'styles.css', 'LICENSE']:
        info = ZipInfo(f"{manifest['id']}/{name}", date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        bundle.writestr(info, (root / name).read_bytes())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'SHA256SUMS.txt').write_text(''.join(f'{hashlib.sha256(item.read_bytes()).hexdigest()}  {item.name}\n' for item in sorted(output.glob('*.zip'))), encoding='utf-8', newline='\n')
print(f'{archive.name}: {digest}')
