"""Extract the reference source and selected media, without running its code."""
import hashlib
import json
import tarfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[3]
ARCHIVE = ROOT / "低空学院参考代码.tar.gz"
DEST = ROOT / "docs/内部资料/参考源码/低空学院"
PREFIXES = ("src/templates/", "src/data/", "src/content/", "src/css/", "src/js/", "boda-component-templates/")
FILES = {
    "scripts/build-site.js", "scripts/build-boda-site.js",
    "BODA_CMS_COMPONENT_TEMPLATES.md", "DEPLOYMENT.md", "EDITOR_GUIDE.md",
    "src/assets/henu-logo-clean.png", "src/assets/henu-logo.png",
    "src/assets/campus-gate-2026.jpg",
    "src/assets/faculty-hero-campus.png", "src/assets/contact-hero-cropped.png",
    "src/assets/kechuang-xilou.jpg",
}


def main():
    digest = hashlib.sha256()
    with ARCHIVE.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    if digest.hexdigest() != "5cc0a19d39b2b84e69a30dab8b92ae2f40bd5e323e58aa037a36a51a96d96e73":
        raise ValueError("Reference archive changed; inspect it before extracting")
    records = []
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        selected = []
        for member in archive.getmembers():
            relative = PurePosixPath(member.name)
            if relative.is_absolute() or ".." in relative.parts or "\\" in member.name or ":" in member.name:
                raise ValueError("Unsafe archive path")
            if not member.isfile():
                if not member.isdir():
                    raise ValueError("Links and special entries are not allowed")
                continue
            if member.name not in FILES and not member.name.startswith(PREFIXES):
                continue
            target = (DEST / member.name).resolve()
            if not target.is_relative_to(DEST.resolve()):
                raise ValueError("Path outside reference folder")
            selected.append((member, target))
        for member, target in selected:
            data = archive.extractfile(member).read()
            # Never silently overwrite a changed local reference file.
            if target.exists() and target.read_bytes() != data:
                raise ValueError(f"Local reference file changed: {member.name}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            records.append({"path": member.name, "size": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    manifest = {"archive_sha256": digest.hexdigest(), "scope": "Source/templates/components and selected school media; no portable editor or full media collection", "files": records}
    (DEST.parent / "低空源码解压清单.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"directory": str(DEST), "files": len(records), "bytes": sum(x["size"] for x in records)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
