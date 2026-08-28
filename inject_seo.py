#!/usr/bin/env python3
"""
inject_seo.py - Inject SEO/GEO infrastructure tags into HTML files in public/
and sync modified files to www/.
"""

import os
import sys
import json
import shutil
from pathlib import Path

BASE_URL = "https://be-hui.com"

# Subpages mapping: filename -> (de_path, en_path)
SUBPAGES_MAP = {
    "menschen.html": ("/menschen", "/en/people"),
    "talente.html": ("/talente", "/en/talents"),
    "ideen.html": ("/ideen", "/en/ideas"),
    "projekte.html": ("/projekte", "/en/projects"),
    "werke.html": ("/werke", "/en/works"),
    "erlebnisse.html": ("/erlebnisse", "/en/experiences"),
    "unternehmen.html": ("/unternehmen", "/en/organisations"),
    "gemeinschaft.html": ("/gemeinschaft", "/en/community"),
    "was-ist-hui.html": ("/was-ist-hui", "/en/what-is-hui"),
    "die-idee-dahinter.html": ("/die-idee-dahinter", "/en/the-idea-behind-it"),
    "warum-hui.html": ("/warum-hui", "/en/why-hui"),
    "mitmachen-idee.html": ("/mitmachen/idee", "/en/get-involved/idea"),
    "mitmachen-talent.html": ("/mitmachen/talent", "/en/get-involved/talent"),
    "mitmachen-projekt.html": ("/mitmachen/projekt", "/en/get-involved/project"),
    "mitmachen-unterstuetzen.html": ("/mitmachen/unterstuetzen", "/en/get-involved/support"),
    "mitmachen-informiert.html": ("/mitmachen/informiert", "/en/get-involved/informed"),
    "inspiration-menschen.html": ("/inspiration/menschen", "/en/inspiration/people"),
    "inspiration-ideen.html": ("/inspiration/ideen", "/en/inspiration/ideas"),
    "inspiration-geschichten.html": ("/inspiration/geschichten", "/en/inspiration/stories"),
    "inspiration-impulse.html": ("/inspiration/impulse", "/en/inspiration/impulses"),
    "launch.html": ("/launch", "/en/launch"),
    "updates.html": ("/updates", "/en/updates"),
    "von-anfang-an-dabei.html": ("/von-anfang-an-dabei", "/en/be-there-from-the-start"),
}

# Legal pages DE: filename -> (de_path, en_path)
LEGAL_DE_MAP = {
    "impressum.html": ("/impressum", "/en/imprint"),
    "datenschutz.html": ("/datenschutz", "/en/privacy"),
    "cookie-einstellungen.html": ("/cookie-einstellungen", "/en/cookie-settings"),
    "nutzungsbedingungen.html": ("/nutzungsbedingungen", "/en/terms"),
    "barrierefreiheit.html": ("/barrierefreiheit", "/en/accessibility"),
    "kontakt.html": ("/kontakt", "/en/contact"),
}

# Legal pages EN: relative path under public/ -> (de_path, en_path)
LEGAL_EN_MAP = {
    "en/imprint.html": ("/impressum", "/en/imprint"),
    "en/privacy.html": ("/datenschutz", "/en/privacy"),
    "en/cookie-settings.html": ("/cookie-einstellungen", "/en/cookie-settings"),
    "en/terms.html": ("/nutzungsbedingungen", "/en/terms"),
    "en/accessibility.html": ("/barrierefreiheit", "/en/accessibility"),
    "en/contact.html": ("/kontakt", "/en/contact"),
}

LANDING_JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "name": "HUI Human United Intelligence",
            "url": BASE_URL,
            "logo": f"{BASE_URL}/hui_logo.webp",
            "description": "HUI verbindet Menschen, Talente, Projekte, Werke und Erlebnisse.",
            "slogan": "Einer für Alle, alle Fair(ein)t",
            "founder": [
                {
                    "@type": "Organization",
                    "name": "4VisionGlobal"
                },
                {
                    "@type": "Organization",
                    "name": "Liga der Kreativen"
                }
            ]
        },
        {
            "@type": "WebSite",
            "name": "HUI",
            "url": BASE_URL,
            "inLanguage": ["de", "en"]
        }
    ]
}


def generate_seo_tags(canonical_url, de_url, en_url, og_url, og_locale, og_alt_locale, json_ld=None):
    tags = [
        '<!-- SEO / GEO Meta Tags -->',
        f'<link rel="canonical" href="{canonical_url}"/>',
        f'<link rel="alternate" hreflang="de" href="{de_url}"/>',
        f'<link rel="alternate" hreflang="en" href="{en_url}"/>',
        f'<link rel="alternate" hreflang="x-default" href="{de_url}"/>',
        f'<meta property="og:url" content="{og_url}"/>',
        f'<meta property="og:image" content="{BASE_URL}/hero.webp"/>',
        f'<meta property="og:locale" content="{og_locale}"/>',
        f'<meta property="og:locale:alternate" content="{og_alt_locale}"/>',
    ]
    if json_ld:
        json_ld_str = json.dumps(json_ld, indent=2, ensure_ascii=False)
        tags.append(f'<script type="application/ld+json">\n{json_ld_str}\n</script>')
    return '\n'.join(tags)


def process_html_files():
    script_dir = Path(__file__).resolve().parent
    public_dir = script_dir / "public"
    www_dir = script_dir / "www"

    if not public_dir.exists():
        print(f"Error: {public_dir} does not exist!")
        sys.exit(1)

    html_files = sorted(public_dir.glob("**/*.html"))
    print(f"Found {len(html_files)} HTML files in {public_dir}")

    modified_count = 0
    skipped_count = 0

    for html_file in html_files:
        rel_path = str(html_file.relative_to(public_dir))
        filename = html_file.name

        with open(html_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Idempotency check: skip if canonical already exists
        if 'rel="canonical"' in content.lower() or "rel='canonical'" in content.lower():
            print(f"[SKIP] {rel_path} - Canonical link already present.")
            skipped_count += 1
            continue

        seo_tags = None

        if filename == "landing.html":
            de_url = f"{BASE_URL}/"
            en_url = f"{BASE_URL}/?lang=en"
            canonical_url = de_url
            og_url = de_url
            og_locale = "de_DE"
            og_alt_locale = "en_US"
            seo_tags = generate_seo_tags(
                canonical_url, de_url, en_url, og_url, og_locale, og_alt_locale, json_ld=LANDING_JSON_LD
            )

        elif filename in SUBPAGES_MAP:
            de_path, en_path = SUBPAGES_MAP[filename]
            de_url = f"{BASE_URL}{de_path}"
            en_url = f"{BASE_URL}{en_path}"
            canonical_url = de_url
            og_url = de_url
            og_locale = "de_DE"
            og_alt_locale = "en_US"
            seo_tags = generate_seo_tags(
                canonical_url, de_url, en_url, og_url, og_locale, og_alt_locale
            )

        elif filename in LEGAL_DE_MAP and rel_path == filename:
            de_path, en_path = LEGAL_DE_MAP[filename]
            de_url = f"{BASE_URL}{de_path}"
            en_url = f"{BASE_URL}{en_path}"
            canonical_url = de_url
            og_url = de_url
            og_locale = "de_DE"
            og_alt_locale = "en_US"
            seo_tags = generate_seo_tags(
                canonical_url, de_url, en_url, og_url, og_locale, og_alt_locale
            )

        elif rel_path in LEGAL_EN_MAP:
            de_path, en_path = LEGAL_EN_MAP[rel_path]
            de_url = f"{BASE_URL}{de_path}"
            en_url = f"{BASE_URL}{en_path}"
            canonical_url = en_url
            og_url = en_url
            og_locale = "en_US"
            og_alt_locale = "de_DE"
            seo_tags = generate_seo_tags(
                canonical_url, de_url, en_url, og_url, og_locale, og_alt_locale
            )

        else:
            print(f"[WARN] {rel_path} is not in page mappings, skipping injection.")
            skipped_count += 1
            continue

        if seo_tags:
            # Inject tags before </head>
            if "</head>" in content:
                new_content = content.replace("</head>", f"{seo_tags}\n</head>", 1)
            elif "</HEAD>" in content:
                new_content = content.replace("</HEAD>", f"{seo_tags}\n</HEAD>", 1)
            else:
                print(f"[ERR] No </head> tag found in {rel_path}")
                continue

            with open(html_file, "w", encoding="utf-8") as f:
                f.write(new_content)

            print(f"[INJECTED] {rel_path}")
            modified_count += 1

            # Sync to www/
            if www_dir.exists():
                www_target = www_dir / rel_path
                www_target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(html_file, www_target)
                print(f"  └─ Copied to www/{rel_path}")

    # Copy robots.txt and sitemap.xml to www/ as well if present
    if www_dir.exists():
        for static_file in ["robots.txt", "sitemap.xml"]:
            src = public_dir / static_file
            if src.exists():
                dst = www_dir / static_file
                shutil.copy2(src, dst)
                print(f"[SYNC] Copied {static_file} to www/{static_file}")

    print(f"\nDone! Modified: {modified_count}, Skipped: {skipped_count}")


if __name__ == "__main__":
    process_html_files()
