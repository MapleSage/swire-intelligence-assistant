#!/usr/bin/env python3
"""
Build department KB seed documents from Swire public pages + known policy frameworks.
Outputs markdown files into ../enterprise-data/<department>/
"""

from __future__ import annotations

import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timezone
from urllib.parse import urlparse
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except Exception:
    BeautifulSoup = None

ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "enterprise-data"

DEPARTMENT_DIRS = {
    "blades": "blades",
    "pre-assembly-installation": "pre_assembly_installation",
    "service-maintenance": "service_maintenance",
    "hr": "hr",
    "about-swire-renewable": "about_swire_renewable",
    "general": "general",
}

KNOWN_POLICY_SOURCES = {
    "blades": [
        "Global Wind Organisation (GWO) Blade Repair training frameworks",
        "IEC 61400 family (wind turbine design and operation references)",
        "ISO 9001 quality management principles",
    ],
    "pre-assembly-installation": [
        "ISO 45001 occupational health and safety management",
        "Lifting Operations and Lifting Equipment Regulations (LOLER) concepts",
        "Permit-to-work and method-statement best practices in wind construction",
    ],
    "service-maintenance": [
        "Reliability-centered maintenance concepts",
        "ISO 55001 asset management framework",
        "OEM maintenance planning best practices",
    ],
    "hr": [
        "ISO 30414 human capital reporting principles",
        "Modern Slavery Act compliance themes",
        "Code of ethics and whistleblower governance practices",
    ],
    "about-swire-renewable": [
        "Company governance disclosure best practices",
        "Sustainability reporting principles (GRI / TCFD-style disclosures)",
    ],
    "general": [
        "Operational excellence and continuous improvement playbooks",
        "Incident reporting and corrective action frameworks",
        "Cross-functional risk and compliance governance controls",
    ],
}


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", "ignore")

    if BeautifulSoup is not None:
        soup = BeautifulSoup(html, "html.parser")
        for t in soup(["script", "style", "noscript"]):
            t.extract()
        text = " ".join(soup.get_text(separator=" ").split())
    else:
        # Remove embedded script/style blocks before stripping tags.
        html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.IGNORECASE | re.DOTALL)
        html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r"<[^>]+>", " ", html)
        text = " ".join(text.split())

    return text


def sitemap_urls() -> list[str]:
    xml = urllib.request.urlopen("https://swire-re.com/base-sitemap.xml", timeout=30).read()
    root = ET.fromstring(xml)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text for loc in root.findall(".//s:loc", ns) if loc.text]


def classify(url: str) -> str:
    u = url.lower()
    if "/services/blade" in u or "blade" in u:
        return "blades"
    if "/services/pre-assembly" in u or "installation" in u:
        return "pre-assembly-installation"
    if "/services/service-maintenance" in u or "/services/marine-services" in u or "/services/hv-and-electrical" in u:
        return "service-maintenance"
    if "/careers" in u or "/our-people" in u:
        return "hr"
    if "/about-us" in u or "/contact-us" in u:
        return "about-swire-renewable"
    return "general"


def summarize(text: str, max_sentences: int = 10) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    noise_patterns = [
        r"googletagmanager",
        r"dataLayer",
        r"function\s*\(",
        r"gtm\.js",
        r"window,document,'script'",
    ]
    nav_keywords = [
        "about us",
        "hseq",
        "services",
        "news",
        "careers",
        "contact us",
        "search:",
    ]
    filtered = []
    for s in sentences:
        ss = s.strip()
        if len(ss) <= 40:
            continue
        if any(re.search(p, ss, flags=re.IGNORECASE) for p in noise_patterns):
            continue
        # Drop menu/navigation boilerplate lines.
        lower = ss.lower()
        nav_hits = sum(1 for k in nav_keywords if k in lower)
        if nav_hits >= 3:
            continue
        if "|" in ss and nav_hits >= 2:
            continue
        filtered.append(ss)
    compact = [re.sub(r"\s+", " ", s).strip() for s in filtered[:max_sentences]]
    return "\n".join(f"- {s[:320]}" for s in compact)


def source_label(url: str) -> str:
    parsed = urlparse(url)
    slug = parsed.path.strip("/").split("/")[-1] if parsed.path.strip("/") else parsed.netloc
    slug = slug.replace("-", " ").replace("_", " ").strip()
    if not slug:
        slug = parsed.netloc
    return slug[:80].title()


def build_doc(dept_key: str, entries: list[dict], ts: str) -> str:
    title = {
        "blades": "Blades Policy & Operations Knowledge Pack",
        "pre-assembly-installation": "Pre-Assembly & Installation Policy Knowledge Pack",
        "service-maintenance": "Service & Maintenance Policy Knowledge Pack",
        "hr": "HR Policy Knowledge Pack",
        "about-swire-renewable": "About Swire Renewable Knowledge Pack",
        "general": "General Cross-Department Policy Knowledge Pack",
    }[dept_key]

    top = entries[:8]
    source_list = "\n".join(f"- [{source_label(e['url'])}]({e['url']})" for e in top)
    summaries = "\n\n".join(
        f"### Source: [{source_label(e['url'])}]({e['url']})\n{e['summary']}" for e in top
    )
    known_sources = "\n".join(f"- {s}" for s in KNOWN_POLICY_SOURCES[dept_key])

    policy_seed = {
        "blades": "Define blade inspection cadence, defect severity classes, and repair sign-off authority matrix.",
        "pre-assembly-installation": "Define installation readiness checklist, lift-risk controls, and stop-work authority escalation.",
        "service-maintenance": "Define maintenance SLA tiers, response windows, and root-cause closure timelines.",
        "hr": "Define onboarding/training compliance, role competency matrix, and employee conduct escalation path.",
        "about-swire-renewable": "Define corporate profile narrative, capability taxonomy, and governance accountability map.",
        "general": "Define document control, revision governance, and cross-functional policy approval workflow.",
    }[dept_key]

    return (
        f"# {title}\n\n"
        f"Generated: {ts}\n\n"
        "## Scope\n"
        "This document is a generated seed knowledge pack created from public web sources and known policy frameworks. "
        "It should be reviewed and approved internally before operational use.\n\n"
        "## Policy Draft Starter\n"
        f"{policy_seed}\n\n"
        "## Known Framework References\n"
        f"{known_sources}\n\n"
        "## Web Sources Used\n"
        f"{source_list}\n\n"
        "## Extracted Department Insights\n"
        f"{summaries}\n\n"
        "## Internal Review Checklist\n"
        "- Confirm legal and compliance alignment for each policy statement.\n"
        "- Add site-specific procedures for each operating region.\n"
        "- Assign document owner and review cadence.\n"
        "- Version and approve in central policy governance process.\n"
    )


def main() -> None:
    ts = datetime.now(timezone.utc).isoformat()
    urls = sitemap_urls()
    grouped: dict[str, list[dict]] = defaultdict(list)

    for url in urls:
        try:
            text = fetch_text(url)
        except Exception:
            continue

        if len(text) < 100:
            continue

        key = classify(url)
        grouped[key].append(
            {
                "url": url,
                "summary": summarize(text, max_sentences=8),
            }
        )

    OUT_ROOT.mkdir(exist_ok=True)

    manifest = {
        "generated_at": ts,
        "source": "https://swire-re.com/base-sitemap.xml",
        "departments": {},
    }

    for key, dirname in DEPARTMENT_DIRS.items():
        target_dir = OUT_ROOT / dirname
        target_dir.mkdir(parents=True, exist_ok=True)
        doc = build_doc(key, grouped.get(key, []), ts)

        out_file = target_dir / "policy_kb_seed.md"
        out_file.write_text(doc, encoding="utf-8")
        manifest["departments"][key] = {
            "file": str(out_file.relative_to(ROOT)),
            "source_count": len(grouped.get(key, [])),
        }

    (OUT_ROOT / "kb_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("Generated KB seed files:")
    for key in DEPARTMENT_DIRS:
        info = manifest["departments"][key]
        print(f"- {key}: {info['file']} (sources: {info['source_count']})")


if __name__ == "__main__":
    main()
