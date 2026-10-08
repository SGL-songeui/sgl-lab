#!/usr/bin/env python3
"""Find Hae-Ock Lee publications that are not yet in data/publications.json.

PubMed (full-name search) is the primary source; OpenAlex and Crossref (both by
the PI's ORCID) catch new papers a few days to weeks before PubMed indexes them.
Also reports entries whose missing PMID has since appeared in PubMed.

Writes a Markdown report (with draft JSON entries) to the given path, or to
stdout. The report is empty when there is nothing to do. Standard library only.

    python scripts/check_publications.py [report.md]
"""
import datetime
import hashlib
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBS = ROOT / "data" / "publications.json"
SITE_JS = ROOT / "site.js"
IGNORE = ROOT / ".github" / "publication-ignore.txt"

PI_ORCID = "0000-0001-5123-0322"
PI_TOKEN = "Lee, H. O."
PUBMED_TERM = "Lee Hae-Ock[Author]"
LOOKBACK_DAYS = 730  # OpenAlex/Crossref window; PubMed is searched in full
UA = "sgl-lab-publication-check (+https://github.com/SGL-songeui/sgl-lab)"
EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"

# same tokeniser as site.js AUTHOR_RE, so member indices match what the site bolds
AUTHOR_RE = re.compile(r"[A-Z][a-zÀ-ž]*(?:\s[A-Z][a-zÀ-ž]*)*, [A-Z]\.(?:\s[A-Z]\.)*")
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()


def get_json(url, params):
    url = url + "?" + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(3 * (attempt + 1))


def norm_doi(doi):
    doi = (doi or "").strip().lower()
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", doi)


def norm_title(title):
    return re.sub(r"[^a-z0-9]", "", html.unescape(title or "").lower())


def clean_title(title):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html.unescape(title or ""))).strip().rstrip(".")


def initials(given):
    parts = [p for p in re.split(r"[\s\-.]+", given or "") if p]
    return " ".join(p[0].upper() + "." for p in parts)


def fmt_date(parts):
    parts = (parts or [[None]])[0]
    if not parts or parts[0] is None:
        return ""
    if len(parts) >= 3:
        return f"{parts[2]} {MONTHS[parts[1] - 1]} {parts[0]}"
    if len(parts) == 2:
        return f"{MONTHS[parts[1] - 1]} {parts[0]}"
    return str(parts[0])


def site_members():
    """{normalised full name: member id} for current members listed in site.js."""
    src = SITE_JS.read_text(encoding="utf-8")
    pairs = re.findall(r'mid:\s*"([^"]+)"[^}]*?nameEn:\s*"([^"]+)"', src)
    return {re.sub(r"[^a-z]", "", name.lower()): mid for mid, name in pairs}


# ---------- sources ----------

def pubmed():
    ids = get_json(EUTILS + "esearch.fcgi", {"db": "pubmed", "term": PUBMED_TERM,
                                             "retmax": 1000, "retmode": "json"})["esearchresult"]["idlist"]
    out = []
    for i in range(0, len(ids), 200):
        time.sleep(0.4)
        res = get_json(EUTILS + "esummary.fcgi", {"db": "pubmed", "id": ",".join(ids[i:i + 200]),
                                                  "retmode": "json"})["result"]
        for pmid in res.get("uids", []):
            s = res[pmid]
            types = s.get("pubtype", [])
            if "Preprint" in types:
                continue
            doi = next((a["value"] for a in s.get("articleids", []) if a["idtype"] == "doi"), "")
            out.append({
                "source": "PubMed", "pmid": pmid, "doi": norm_doi(doi), "doi_orig": doi,
                "title": clean_title(s.get("title")), "journal": s.get("fulljournalname", ""),
                "year": int((s.get("pubdate") or "0")[:4] or 0), "date": s.get("pubdate", ""),
                "authors": [pubmed_author(a["name"]) for a in s.get("authors", []) if a.get("authtype") == "Author"],
                "fullnames": [], "types": types,
            })
    return out


def pubmed_author(name):
    """'Lee HO' -> 'Lee, H. O.'"""
    last, _, ini = name.rpartition(" ")
    if not last or not ini.isupper():
        return name
    return f"{last}, " + " ".join(c + "." for c in ini)


def pmid_for_doi(doi):
    time.sleep(0.4)
    ids = get_json(EUTILS + "esearch.fcgi", {"db": "pubmed", "term": f"{doi}[doi]",
                                             "retmode": "json"})["esearchresult"]["idlist"]
    return ids[0] if len(ids) == 1 else None


def openalex(since):
    res = get_json("https://api.openalex.org/works", {
        "filter": f"author.orcid:{PI_ORCID},from_publication_date:{since}",
        "per-page": 200, "sort": "publication_date:desc"})
    out = []
    for w in res["results"]:
        loc = w.get("primary_location") or {}
        if (w.get("type") not in ("article", "review", "letter") or w.get("is_paratext")
                or (loc.get("source") or {}).get("type") != "journal" or not w.get("doi")):
            continue
        out.append({
            "source": "OpenAlex", "pmid": ((w.get("ids") or {}).get("pmid") or "").rsplit("/", 1)[-1],
            "doi": norm_doi(w["doi"]), "doi_orig": norm_doi(w["doi"]), "title": clean_title(w.get("title")),
            "journal": (loc.get("source") or {}).get("display_name", ""),
            "year": w.get("publication_year") or 0, "date": w.get("publication_date", ""),
            "authors": [], "fullnames": [a["author"]["display_name"] for a in w.get("authorships", [])],
            "types": [w["type"]],
        })
    return out


def crossref_item(m, source="Crossref"):
    authors = [a for a in m.get("author", []) if a.get("family")]
    return {
        "source": source, "pmid": "", "doi": norm_doi(m.get("DOI")), "doi_orig": m.get("DOI"),
        "title": clean_title((m.get("title") or [""])[0]),
        "journal": (m.get("container-title") or [""])[0],
        "year": ((m.get("published") or {}).get("date-parts") or [[0]])[0][0] or 0,
        "date": fmt_date((m.get("published") or {}).get("date-parts")),
        "authors": [f"{a['family']}, {initials(a.get('given'))}".rstrip(", ") for a in authors],
        "fullnames": [f"{a.get('given', '')} {a['family']}" for a in authors],
        "types": [m.get("type", "")],
    }


def crossref(since):
    res = get_json("https://api.crossref.org/works", {
        "filter": f"orcid:{PI_ORCID},from-pub-date:{since},type:journal-article", "rows": 200})
    return [crossref_item(m) for m in res["message"]["items"]]


def crossref_doi(doi):
    try:
        return crossref_item(get_json("https://api.crossref.org/works/" + urllib.parse.quote(doi), {})["message"])
    except Exception:
        return None


# ---------- draft entries ----------

def site_type(types):
    t = " ".join(types).lower()
    if "erratum" in t:
        return "Comment/debate"
    if "review" in t:
        return "Review article"
    if "letter" in t:
        return "Letter"
    if "editorial" in t:
        return "Editorial"
    return "Article"


def draft_entry(rec, members):
    authors = ", ".join(rec["authors"])
    tokens = [m for m in AUTHOR_RE.finditer(authors)]
    starts = {m.start(): i for i, m in enumerate(tokens)}
    found, pos = {}, 0
    for k, name in enumerate(rec["authors"]):
        idx = starts.get(pos)
        if idx is not None:
            if name == PI_TOKEN:
                found["lee-ho"] = idx
            elif k < len(rec["fullnames"]):
                mid = members.get(re.sub(r"[^a-z]", "", rec["fullnames"][k].lower()))
                if mid:
                    found[mid] = idx
        pos += len(name) + 2
    return {
        "title": rec["title"], "authors": authors, "journal": rec["journal"],
        "year": rec["year"], "doi": rec["doi_orig"] or rec["doi"] or None, "pmid": rec["pmid"] or None,
        "type": site_type(rec["types"]), "date": rec["date"],
        "members": dict(sorted(found.items(), key=lambda kv: kv[0] != "lee-ho")),
    }


# ---------- main ----------

def main():
    pubs = json.loads(PUBS.read_text(encoding="utf-8"))
    known_doi = {norm_doi(p.get("doi")) for p in pubs if p.get("doi")}
    known_pmid = {str(p["pmid"]) for p in pubs if p.get("pmid")}
    known_title = {norm_title(p["title"]) for p in pubs}
    ignore = set()
    if IGNORE.exists():
        for line in IGNORE.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                ignore.add(norm_doi(line))

    since = (datetime.date.today() - datetime.timedelta(days=LOOKBACK_DAYS)).isoformat()
    records, errors = [], []
    for name, fetch in (("PubMed", pubmed), ("OpenAlex", lambda: openalex(since)),
                        ("Crossref", lambda: crossref(since))):
        try:
            records += fetch()
        except Exception as e:
            errors.append(f"{name}: {e}")

    # merge by DOI (or title when there is no DOI), skipping anything already listed
    cands = {}
    for r in records:
        if (r["doi"] in known_doi or r["pmid"] in known_pmid or norm_title(r["title"]) in known_title
                or r["doi"] in ignore or r["pmid"] in ignore):
            continue
        key = r["doi"] or norm_title(r["title"])
        c = cands.setdefault(key, {"sources": [], "recs": {}})
        c["sources"].append(r["source"])
        c["recs"][r["source"]] = r

    members = site_members()
    items = []
    for key, c in sorted(cands.items()):
        recs = c["recs"]
        pm = recs.get("PubMed")
        base = recs.get("Crossref") or (crossref_doi(key) if "/" in key else None) or pm or recs["OpenAlex"]
        base = dict(base)
        if pm:
            base["pmid"], base["types"] = pm["pmid"], pm["types"]
        elif not base["pmid"]:
            base["pmid"] = (recs.get("OpenAlex") or {}).get("pmid", "")
        if not base["fullnames"] and "OpenAlex" in recs:
            base["fullnames"] = recs["OpenAlex"]["fullnames"]
        entry = draft_entry(base, members)
        notes = []
        if "lee-ho" not in entry["members"]:
            notes.append(f'"{PI_TOKEN}" not found in the author list: check it is the PI')
        if not entry["pmid"]:
            notes.append("not in PubMed yet (pmid left null)")
        if "erratum" in " ".join(base["types"]).lower():
            notes.append("erratum")
        items.append((key, sorted(set(c["sources"])), entry, notes))

    backfill = []
    for p in pubs:
        if not p.get("pmid") and p.get("doi"):
            try:
                pmid = pmid_for_doi(p["doi"])
            except Exception:
                pmid = None
            if pmid and pmid not in known_pmid:
                backfill.append((p, pmid))

    report = render(items, backfill)
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(report, encoding="utf-8")
    else:
        sys.stdout.write(report)
    # a failed source could hide a paper: fail the run rather than report "nothing new"
    if errors:
        sys.exit("source errors:\n" + "\n".join(errors))


def render(items, backfill):
    if not items and not backfill:
        return ""
    digest = hashlib.sha1(json.dumps([[k for k, *_ in items], [[p["doi"], m] for p, m in backfill]])
                          .encode()).hexdigest()[:12]
    out = [f"<!-- digest: {digest} -->",
           "Weekly check of PubMed, OpenAlex and Crossref against `data/publications.json`.", ""]
    if items:
        out += [f"## Possibly missing publications ({len(items)})", "",
                "Review each draft (authors, `type`, `date`, member indices) and add it to the top of "
                "`data/publications.json`, then update the hard-coded publication count. "
                "If an item is not a lab paper, add its DOI to `.github/publication-ignore.txt`.", ""]
        for key, sources, e, notes in items:
            links = [f"[doi]({'https://doi.org/' + e['doi']})"] if e["doi"] else []
            if e["pmid"]:
                links.append(f"[PubMed](https://pubmed.ncbi.nlm.nih.gov/{e['pmid']}/)")
            out += [f"### {e['title']}",
                    f"*{e['journal']}*, {e['date'] or e['year']} · {' · '.join(links)} · found in: {', '.join(sources)}"]
            out += [f"- ⚠️ {n}" for n in notes]
            out += ["", "```json", json.dumps(e, indent=1, ensure_ascii=False) + ",", "```", ""]
    if backfill:
        out += [f"## PMIDs now available ({len(backfill)})", ""]
        out += [f"- {p['title']} ({p['doi']}): `\"pmid\": \"{m}\"`" for p, m in backfill]
        out.append("")
    return "\n".join(out)


if __name__ == "__main__":
    main()
