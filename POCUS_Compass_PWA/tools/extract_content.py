import re, json, base64, os, io, sys
from PIL import Image
from bs4 import BeautifulSoup

# Rebuilds the app's content/ folder from the master guide (single source of truth).
# Usage:  python3 tools/extract_content.py [path/to/POCUS_Master_Guide.html]
_DEFAULT_GUIDE_LOCATIONS = [
    "~/Documents/CV Resources/CV Guides/POCUS_Master_Guide.html",
    "~/Desktop/CV Resources/CV Guides/POCUS_Master_Guide.html",
]
if len(sys.argv) > 1:
    SRC = sys.argv[1]
else:
    SRC = next((p for p in map(os.path.expanduser, _DEFAULT_GUIDE_LOCATIONS) if os.path.exists(p)),
               os.path.expanduser(_DEFAULT_GUIDE_LOCATIONS[0]))
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "content")
os.makedirs(os.path.join(OUT, "sections"), exist_ok=True)
os.makedirs(os.path.join(OUT, "images"), exist_ok=True)

with open(SRC, encoding='utf-8', errors='ignore') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html5lib')

# ---- 1. Extract global style block ----
style_tag = soup.find('style')
content_css = style_tag.string or ''
with open(os.path.join(OUT, 'guide.css'), 'w') as f:
    f.write(content_css)

# ---- 2. Extract nav tree from sidebar ----
sidebar = soup.find(id='sidebar')
manifest = {"title": "POCUS Master Guide", "subtitle": "EM · Critical Care · Anesthesia", "groups": []}
cur_group = None
cur_section = None
for child in sidebar.find_all(['div', 'a'], recursive=True):
    if child.name == 'div' and 'nav-group' in (child.get('class') or []):
        cur_group = {"label": child.get_text(strip=True), "sections": []}
        manifest["groups"].append(cur_group)
    elif child.name == 'a' and 'nav-item' in (child.get('class') or []):
        href = child.get('href', '').lstrip('#')
        label = child.get_text(strip=True)
        if 'nav-sub' in (child.get('class') or []):
            if cur_section is not None:
                cur_section["subsections"].append({"id": href, "label": label})
        else:
            num, _, title = label.partition('·')
            cur_section = {"id": href, "num": num.strip(), "title": title.strip() or label, "subsections": []}
            if cur_group is not None:
                cur_group["sections"].append(cur_section)

with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=2)

# ---- 3. Extract each section's content, decode base64 images ----
img_counter = 0
sections_meta = []
for sec in soup.select('section.section'):
    sid = sec.get('id')
    title_div = sec.find('div', class_='section-title')
    desc_div = sec.find('div', class_='section-desc')
    num = title_div.find('span', class_='num').get_text(strip=True) if title_div else ''
    title_text = title_div.get_text(strip=True)
    if num and title_text.startswith(num):
        title_text = title_text[len(num):].strip()

    body_children = [c for c in sec.children if c not in (title_div, desc_div)]

    for img in sec.find_all('img'):
        src = img.get('src', '')
        m = re.match(r'data:(image/(\w+));base64,(.*)', src, re.S)
        if not m:
            continue
        raw = base64.b64decode(m.group(3))
        img_counter += 1

        # The guide's data URIs sometimes declare a mimetype that doesn't match
        # the actual payload (e.g. AVIF bytes labelled image/png). Xcode's
        # pngcrush silently drops such files from the app bundle, so trust the
        # decoded bytes rather than the declared type, and re-encode anything
        # WebKit/Xcode won't reliably handle.
        detected = None
        try:
            detected = (Image.open(io.BytesIO(raw)).format or '').lower()
        except Exception:
            pass

        if detected in ('png', 'jpeg', 'webp'):
            ext = 'jpg' if detected == 'jpeg' else detected
            payload = raw
        elif detected:
            ext = 'png'
            buf = io.BytesIO()
            Image.open(io.BytesIO(raw)).convert('RGBA').save(buf, format='PNG')
            payload = buf.getvalue()
        else:
            ext = m.group(2)
            if ext == 'jpeg':
                ext = 'jpg'
            payload = raw

        fname = f"{sid}-{img_counter}.{ext}"
        with open(os.path.join(OUT, 'images', fname), 'wb') as imf:
            imf.write(payload)
        img['src'] = f"../images/{fname}"

    body_html = ''.join(str(c) for c in body_children)
    with open(os.path.join(OUT, 'sections', f'{sid}.html'), 'w') as f:
        f.write(body_html)

    sections_meta.append({
        "id": sid, "num": num, "title": title_text,
        "desc": desc_div.get_text(strip=True) if desc_div else "",
    })

with open(os.path.join(OUT, 'sections_meta.json'), 'w') as f:
    json.dump(sections_meta, f, indent=2)

print("sections extracted:", len(sections_meta))
print("images extracted:", img_counter)
print("manifest groups:", len(manifest['groups']))
total_subs = sum(len(s['subsections']) for g in manifest['groups'] for s in g['sections'])
print("total subsections in manifest:", total_subs)
