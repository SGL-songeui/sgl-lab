/* SGL site — shared header/footer injection + publications rendering */
(function () {
  "use strict";

  var NAV = [
    { href: "index.html", i18n: "nav.home", key: "home" },
    { href: "index.html#research", i18n: "nav.research", key: "research" },
    { href: "principal-investigator.html", i18n: "nav.pi", key: "pi" },
    { href: "people.html", i18n: "nav.people", key: "people" },
    { href: "publications.html", i18n: "nav.publications", key: "publications" },
    { href: "contact.html", i18n: "nav.contact", key: "contact" }
  ];

  /* ---------- i18n ---------- */
  function getLang() {
    try { return localStorage.getItem("sgl-lang") === "ko" ? "ko" : "en"; }
    catch (e) { return "en"; }
  }
  function t(key) {
    var entry = (window.SGL_I18N || {})[key];
    if (!entry) return null;
    var v = entry[getLang()] || entry.en;
    return v.replace(/\{n\}/g, window.__pubCount || 70);
  }
  function applyLang() {
    var lang = getLang();
    document.documentElement.lang = lang;
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v !== null) el.innerHTML = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-placeholder]"), function (el) {
      var v = t(el.getAttribute("data-i18n-placeholder"));
      if (v !== null) el.setAttribute("placeholder", v.replace(/&hellip;/g, "…"));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".lang-opt"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
    if (window.__sglRefreshPubCount) window.__sglRefreshPubCount();
  }
  function setLang(lang) {
    try { localStorage.setItem("sgl-lang", lang === "ko" ? "ko" : "en"); } catch (e) {}
    applyLang();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- header / footer ---------- */
  function buildHeader() {
    var page = document.body.getAttribute("data-page") || "";
    var links = NAV.map(function (n) {
      var cls = n.key === page ? ' class="active"' : "";
      return '<a href="' + n.href + '" data-key="' + n.key + '" data-i18n="' + n.i18n + '"' + cls + ">" + (t(n.i18n) || "") + "</a>";
    }).join("");
    var el = document.createElement("header");
    el.className = "site-header";
    el.innerHTML =
      '<div class="inner">' +
      '<a class="logo" href="index.html" aria-label="SGL home">' +
      '<svg class="logo-svg" viewBox="0 0 104 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SGL">' +
      '<text x="0" y="28" font-family="Inter, Segoe UI, system-ui, sans-serif" font-size="27" font-weight="800" letter-spacing="0.3" fill="currentColor">SGL</text>' +
      '<g transform="rotate(8 92.0 5.5)"><path d="M 97.88 5.50 C 98.06 6.53 97.69 8.16 96.98 8.97 C 96.27 9.78 94.74 10.17 93.65 10.36 C 92.55 10.56 91.43 10.45 90.43 10.15 C 89.42 9.85 88.28 9.32 87.63 8.55 C 86.97 7.77 86.55 6.56 86.49 5.50 C 86.44 4.44 86.67 3.11 87.28 2.21 C 87.90 1.31 89.13 0.34 90.18 0.11 C 91.22 -0.11 92.61 0.44 93.56 0.88 C 94.52 1.32 95.20 1.99 95.92 2.76 C 96.64 3.53 97.70 4.47 97.88 5.50 Z" fill="#f1e3e8"/></g><path d="M 95.21 5.10 C 95.17 5.55 94.96 6.01 94.70 6.35 C 94.43 6.69 94.02 7.02 93.61 7.16 C 93.19 7.30 92.65 7.29 92.21 7.17 C 91.77 7.06 91.26 6.81 90.96 6.47 C 90.66 6.12 90.40 5.54 90.42 5.10 C 90.45 4.67 90.82 4.18 91.13 3.86 C 91.44 3.55 91.85 3.37 92.27 3.21 C 92.69 3.06 93.20 2.85 93.65 2.93 C 94.09 3.01 94.69 3.32 94.95 3.68 C 95.21 4.04 95.25 4.66 95.21 5.10 Z" fill="#52426e"/><g transform="rotate(15 96.0 15.0)"><path d="M 101.63 15.00 C 101.65 16.11 101.44 17.36 100.85 18.38 C 100.26 19.41 99.21 20.77 98.08 21.15 C 96.95 21.53 95.13 21.19 94.09 20.66 C 93.04 20.12 92.44 18.87 91.81 17.92 C 91.18 16.98 90.50 16.11 90.31 15.00 C 90.12 13.89 90.04 12.24 90.67 11.28 C 91.29 10.32 92.86 9.51 94.05 9.24 C 95.24 8.97 96.70 9.23 97.81 9.65 C 98.92 10.06 100.07 10.83 100.70 11.72 C 101.34 12.61 101.60 13.89 101.63 15.00 Z" fill="#eddde4"/></g><path d="M 97.69 15.08 C 97.71 15.56 97.40 16.22 97.06 16.56 C 96.72 16.91 96.11 17.04 95.63 17.16 C 95.15 17.27 94.66 17.34 94.19 17.25 C 93.71 17.15 93.08 16.94 92.77 16.58 C 92.45 16.22 92.28 15.56 92.29 15.08 C 92.31 14.59 92.57 14.03 92.88 13.65 C 93.19 13.27 93.69 12.93 94.15 12.81 C 94.62 12.68 95.19 12.77 95.65 12.92 C 96.11 13.06 96.58 13.32 96.92 13.68 C 97.26 14.04 97.66 14.59 97.69 15.08 Z" fill="#52426e"/><g transform="rotate(-12 83.0 11.0)"><path d="M 90.20 11.00 C 90.19 12.36 89.63 13.94 88.81 15.05 C 87.98 16.17 86.65 17.12 85.26 17.69 C 83.87 18.26 81.93 18.84 80.47 18.49 C 79.00 18.13 77.16 16.80 76.47 15.56 C 75.77 14.31 76.13 12.39 76.31 11.00 C 76.49 9.61 76.85 8.43 77.55 7.20 C 78.24 5.96 79.16 4.20 80.49 3.59 C 81.82 2.99 84.11 3.01 85.52 3.56 C 86.92 4.10 88.14 5.63 88.92 6.87 C 89.70 8.11 90.22 9.64 90.20 11.00 Z" fill="#e8d3dc"/></g><path d="M 86.96 11.98 C 87.01 12.58 86.98 13.36 86.66 13.87 C 86.33 14.39 85.59 14.95 84.98 15.08 C 84.38 15.21 83.59 14.90 83.03 14.66 C 82.46 14.41 82.01 14.04 81.61 13.59 C 81.22 13.15 80.72 12.56 80.65 11.98 C 80.59 11.39 80.83 10.56 81.22 10.08 C 81.60 9.60 82.35 9.25 82.96 9.10 C 83.57 8.94 84.32 8.95 84.89 9.15 C 85.46 9.34 86.03 9.80 86.37 10.27 C 86.72 10.75 86.91 11.38 86.96 11.98 Z" fill="#52426e"/><g transform="rotate(10 90.5 24.0)"><path d="M 98.25 24.00 C 98.10 25.54 97.55 27.12 96.65 28.29 C 95.76 29.47 94.32 30.58 92.89 31.06 C 91.46 31.55 89.63 31.55 88.07 31.19 C 86.50 30.83 84.51 30.09 83.48 28.90 C 82.45 27.70 81.70 25.49 81.91 24.00 C 82.11 22.51 83.64 21.04 84.70 19.95 C 85.76 18.86 86.87 18.10 88.29 17.46 C 89.70 16.82 91.63 15.82 93.18 16.09 C 94.73 16.35 96.74 17.74 97.59 19.06 C 98.43 20.38 98.41 22.46 98.25 24.00 Z" fill="#e4ccd7"/></g><path d="M 93.24 22.65 C 93.24 23.26 92.99 23.94 92.63 24.48 C 92.27 25.03 91.73 25.66 91.10 25.91 C 90.48 26.15 89.49 26.20 88.88 25.96 C 88.27 25.71 87.78 24.97 87.46 24.42 C 87.14 23.87 87.01 23.27 86.96 22.65 C 86.91 22.02 86.84 21.22 87.17 20.67 C 87.49 20.12 88.24 19.54 88.89 19.36 C 89.53 19.18 90.41 19.35 91.04 19.59 C 91.66 19.84 92.28 20.29 92.65 20.80 C 93.02 21.31 93.24 22.04 93.24 22.65 Z" fill="#52426e"/><g transform="rotate(-8 75.5 22.5)"><path d="M 87.93 22.50 C 87.91 24.60 86.00 27.19 84.45 28.74 C 82.90 30.30 80.69 31.24 78.65 31.82 C 76.61 32.40 74.19 32.77 72.20 32.24 C 70.21 31.71 68.08 30.25 66.72 28.62 C 65.36 27.00 64.18 24.65 64.02 22.50 C 63.86 20.35 64.40 17.32 65.77 15.71 C 67.14 14.10 70.13 13.17 72.24 12.86 C 74.35 12.55 76.37 13.30 78.43 13.85 C 80.49 14.40 83.00 14.72 84.59 16.16 C 86.17 17.60 87.95 20.40 87.93 22.50 Z" fill="#dfc3cf"/></g><path d="M 81.66 21.51 C 81.63 22.37 81.36 23.36 80.85 24.04 C 80.34 24.72 79.45 25.30 78.60 25.59 C 77.75 25.89 76.66 26.03 75.75 25.83 C 74.84 25.62 73.66 25.06 73.15 24.34 C 72.63 23.62 72.52 22.37 72.64 21.51 C 72.77 20.65 73.37 19.89 73.89 19.19 C 74.42 18.49 74.98 17.70 75.79 17.32 C 76.61 16.93 77.90 16.64 78.77 16.90 C 79.65 17.15 80.55 18.08 81.03 18.84 C 81.51 19.61 81.69 20.64 81.66 21.51 Z" fill="#52426e"/>' +
      "</svg>" +
      '<span class="logo-full">Single-cell Genomics Lab</span></a>' +
      '<nav class="nav-links">' + links + "</nav>" +
      '<div class="header-actions">' +
      '<div class="lang-switch" role="group" aria-label="Language">' +
      '<button class="lang-opt" data-lang="ko">KO</button>' +
      '<button class="lang-opt" data-lang="en">ENG</button>' +
      "</div>" +
      '<button class="nav-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>' +
      "</div>" +
      "</div>";
    document.body.insertBefore(el, document.body.firstChild);
    var toggle = el.querySelector(".nav-toggle");
    var nav = el.querySelector(".nav-links");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    Array.prototype.forEach.call(el.querySelectorAll(".lang-opt"), function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });
  }

  function buildFooter() {
    var el = document.createElement("footer");
    el.className = "site-footer";
    el.innerHTML =
      '<div class="inner">' +
      "<div>" +
      '<div class="brand">SGL<span class="dot">.</span> Single-cell Genomics Lab</div>' +
      '<p data-i18n="footer.address">Department of Microbiology, College of Medicine<br>The Catholic University of Korea<br>' +
      "Omnibus Park Bldg A, Rm 8108, 222 Banpo-daero, Seocho-gu, Seoul, South Korea</p>" +
      "</div>" +
      "<div>" +
      '<div class="col-title" data-i18n="footer.contact">Contact</div>' +
      '<p><a href="mailto:haeocklee@catholic.ac.kr">haeocklee@catholic.ac.kr</a><br>+82-2-3147-8365</p>' +
      "</div>" +
      '<div class="footer-univ">' +
      '<a href="https://songeui.catholic.ac.kr" target="_blank" rel="noopener">' +
      '<img class="footer-univ-logo" src="assets/cuk_logo_white.png" alt="The Catholic University of Korea"></a>' +
      '<p data-i18n="footer.campus">Songeui Campus</p>' +
      "</div>" +
      "</div>" +
      '<div class="copyright" data-i18n="footer.copyright">&copy; ' + new Date().getFullYear() +
      " Single-cell Genomics Lab, The Catholic University of Korea</div>";
    document.body.appendChild(el);
  }

  /* ---------- publications ---------- */
  /* members is { "member-id": authorIndex, ... }.
     Split the author string into tokens and bold the ones at member positions. */
  var AUTHOR_RE = /[A-Z][a-zÀ-ž]*(?:\s[A-Z][a-zÀ-ž]*)*, [A-Z]\.(?:\s[A-Z]\.)*/g;
  function boldMembers(authors, members) {
    if (!members || typeof members !== "object") return esc(authors);
    var boldAt = {};
    Object.keys(members).forEach(function (mid) {
      var idx = members[mid];
      if (idx >= 0) boldAt[idx] = true;
    });
    if (!Object.keys(boldAt).length) return esc(authors);
    var idx = 0, last = 0, out = "";
    authors.replace(AUTHOR_RE, function (match, offset) {
      out += esc(authors.substring(last, offset));
      out += boldAt[idx] ? "<b>" + esc(match) + "</b>" : esc(match);
      last = offset + match.length;
      idx++;
      return match;
    });
    out += esc(authors.substring(last));
    return out;
  }

  function pubRow(p) {
    var doiUrl = p.doi ? "https://doi.org/" + encodeURI(p.doi) : null;
    var links = [];
    if (doiUrl) links.push('<a href="' + doiUrl + '" target="_blank" rel="noopener">DOI</a>');
    if (p.pmid) links.push('<a href="https://pubmed.ncbi.nlm.nih.gov/' + esc(p.pmid) + '/" target="_blank" rel="noopener">PubMed</a>');
    var typeBadge = p.type && p.type !== "Article"
      ? '<span class="pub-type">' + esc(p.type) + "</span>" : "";
    var titleInner = doiUrl
      ? '<a href="' + doiUrl + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>" + typeBadge
      : esc(p.title) + typeBadge;
    var metaParts = [esc(p.year), esc(p.journal)];
    if (links.length) metaParts.push(links.join(" &nbsp;&middot;&nbsp; "));
    return (
      '<div class="pub-row"' + (doiUrl ? ' data-doi="' + doiUrl + '"' : "") + ">" +
      '<div class="pub-title">' + titleInner + "</div>" +
      '<div class="pub-authors">' + boldMembers(p.authors, p.members) + "</div>" +
      '<div class="pub-meta">' + metaParts.join(" &nbsp;&middot;&nbsp; ") + "</div>" +
      "</div>"
    );
  }

  /* whole publication row opens the paper via its DOI; inner links keep their own behavior */
  document.addEventListener("click", function (e) {
    var row = e.target.closest ? e.target.closest(".pub-row[data-doi]") : null;
    if (!row) return;
    if (e.target.closest("a")) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && sel.toString()) return; /* user is selecting citation text, not clicking through */
    window.open(row.getAttribute("data-doi"), "_blank", "noopener");
  });

  var __memberFilter = "";
  var __yearFilter = "";
  function renderPubs(pubs, query) {
    var host = document.getElementById("pub-container");
    var count = document.getElementById("pub-count");
    var q = (query || "").trim().toLowerCase();
    var shown = pubs;
    if (__memberFilter) {
      shown = shown.filter(function (p) {
        return p.members && typeof p.members === "object" && __memberFilter in p.members;
      });
    }
    if (__yearFilter) {
      shown = shown.filter(function (p) { return String(p.year) === __yearFilter; });
    }
    if (q) {
      shown = shown.filter(function (p) {
        return (p.title + " " + p.authors + " " + p.journal + " " + p.year)
          .toLowerCase().indexOf(q) !== -1;
      });
    }
    if (count) {
      count.textContent = getLang() === "ko"
        ? "전체 " + pubs.length + "편 중 " + shown.length + "편"
        : shown.length + " of " + pubs.length + " publications";
    }
    if (!shown.length) {
      host.innerHTML = '<p style="margin-top:32px;color:var(--muted);font-size:14px;">No publications match your search.</p>';
      return;
    }
    var byYear = {};
    shown.forEach(function (p) { (byYear[p.year] = byYear[p.year] || []).push(p); });
    var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
    host.innerHTML = years.map(function (y) {
      return '<h2 class="year-heading">' + esc(y) + "</h2>" +
        '<div class="pub-list">' + byYear[y].map(pubRow).join("") + "</div>";
    }).join("");
  }

  /* home "Recent work": the newest lab-led papers (PI is the last author), from the JSON.
     The rows baked into index.html are the no-JS fallback and stay put when they already match. */
  function initRecentPubs() {
    var host = document.getElementById("recent-pubs");
    if (!host) return;
    fetch("data/publications.json?v=19")
      .then(function (r) { return r.json(); })
      .then(function (pubs) {
        var recent = pubs.filter(function (p) {
          var tokens = p.authors.match(AUTHOR_RE) || [];
          return tokens[tokens.length - 1] === "Lee, H. O.";
        }).slice(0, 3);
        var dois = recent.map(function (p) { return "https://doi.org/" + encodeURI(p.doi); });
        var shown = Array.prototype.map.call(host.querySelectorAll(".pub-row"), function (row) {
          return row.getAttribute("data-doi");
        });
        if (!recent.length || dois.join() === shown.join()) return;
        host.innerHTML = recent.map(function (p, i) {
          return (
            '<div class="pub-row" data-doi="' + dois[i] + '">' +
            '<div class="pub-title"><a href="' + dois[i] + '" target="_blank" rel="noopener">' + esc(p.title) + "</a></div>" +
            '<div class="pub-authors">' + boldMembers(p.authors, p.members) + "</div>" +
            '<div class="pub-meta">' + esc(p.year) + " &middot; " + esc(p.journal) + "</div>" +
            "</div>"
          );
        }).join("");
        revealize(host.querySelectorAll(".pub-row"));
      })
      .catch(function () { /* keep the baked-in rows */ });
  }

  var MEMBER_NAMES = {
    "lee-ho": { en: "Hae-Ock Lee", ko: "이혜옥" },
    "kang-hr": { en: "Huiram Kang", ko: "강희람" },
    "shin-gj": { en: "GyeongJin Shin", ko: "신경진" },
    "lee-gs": { en: "Geunseob Lee", ko: "이근섭" },
    "kim-sr": { en: "Serim Kim", ko: "김세림" },
    "kim-y":  { en: "Yeji Kim", ko: "김예지" },
    "lee-js": { en: "Jeongseon Lee", ko: "이정선" },
    "kim-mh": { en: "Minhee Kim", ko: "김민희" },
    "yoo-sh": { en: "Suhyeon Yoo", ko: "유수현" }
  };

  function initPublications() {
    var host = document.getElementById("pub-container");
    if (!host) return;

    /* read ?member= query param */
    var params = new URLSearchParams(window.location.search);
    __memberFilter = params.get("member") || "";

    fetch("data/publications.json?v=19")
      .then(function (r) { return r.json(); })
      .then(function (pubs) {
        /* show member filter chip if active */
        if (__memberFilter && MEMBER_NAMES[__memberFilter]) {
          var chip = document.createElement("div");
          chip.className = "member-filter-chip";
          var name = MEMBER_NAMES[__memberFilter][getLang()] || MEMBER_NAMES[__memberFilter].en;
          chip.innerHTML = '<span>' + esc(name) + '</span><button aria-label="Clear filter">&times;</button>';
          chip.querySelector("button").addEventListener("click", function () {
            __memberFilter = "";
            history.replaceState(null, "", "publications.html");
            chip.remove();
            renderPubs(pubs, input ? input.value : "");
          });
          var toolbar = document.querySelector(".pub-toolbar");
          if (toolbar) toolbar.appendChild(chip);
        }

        var yearSelect = document.getElementById("pub-year-filter");
        if (yearSelect) {
          var allYears = {};
          pubs.forEach(function (p) { allYears[p.year] = true; });
          Object.keys(allYears).sort(function (a, b) { return b - a; }).forEach(function (y) {
            var opt = document.createElement("option");
            opt.value = y; opt.textContent = y;
            yearSelect.appendChild(opt);
          });
          yearSelect.addEventListener("change", function () {
            __yearFilter = yearSelect.value;
            renderPubs(pubs, input ? input.value : "");
          });
        }

        renderPubs(pubs, "");
        revealize(host.querySelectorAll(".year-heading, .pub-row"));
        var input = document.getElementById("pub-search");
        if (input) input.addEventListener("input", function () { renderPubs(pubs, input.value); });
        window.__sglRefreshPubCount = function () { renderPubs(pubs, input ? input.value : ""); };
      })
      .catch(function () {
        host.innerHTML = '<p style="margin-top:32px;color:var(--muted);">Could not load the publication list.</p>';
      });
  }

  /* ---------- scroll-reveal ---------- */
  /* re-armed on exit so the entrance replays every time an element scrolls
     back into view (either direction). Entering is judged against a slightly
     shrunk viewport; re-arming only once the element is fully offscreen, so
     a visible element never blinks out at the boundary. */
  var revealObservers = null;
  function revealize(targets) {
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!revealObservers) {
      revealObservers = {
        ioIn: new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) en.target.classList.add("in");
          });
        }, { rootMargin: "0px 0px -8% 0px" }),
        ioOut: new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) en.target.classList.remove("in");
          });
        })
      };
    }
    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add("reveal");
      el.style.animationDelay = (i % 4) * 60 + "ms";
      revealObservers.ioIn.observe(el);
      revealObservers.ioOut.observe(el);
    });
  }
  function initReveal() {
    /* .feature-row is NOT revealized: rows live inside the research overlay and
       animate via CSS when it opens — an observer there can strand the last row
       invisible depending on open/scroll timing */
    revealize(document.querySelectorAll(".card, .contact-block, .timeline-item, .alumni-chip, .pub-row"));
  }

  /* ---------- live metrics ----------
     publications: counted from our own data/publications.json;
     h-index / citations: OpenAlex by the PI's ORCID (CORS-open, keyless).
     The numbers baked into the HTML stay as fallbacks if a fetch fails. */
  var PI_ORCID = "0000-0001-5123-0322";

  function fmtNum(n) { return Number(n).toLocaleString("en-US"); }

  /* rolls the number up from 0 to its final value (ease-out) */
  function countUp(el, target) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.requestAnimationFrame) {
      el.textContent = fmtNum(target);
      return;
    }
    var dur = 900, t0 = null, done = false;
    function finish() {
      if (done) return;
      done = true;
      el.textContent = fmtNum(target);
    }
    function tick(now) {
      if (done) return;
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      if (p >= 1) { finish(); return; }
      el.textContent = fmtNum(Math.round(target * eased));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    /* rAF pauses in background/throttled tabs — make sure we always land */
    setTimeout(finish, dur + 500);
  }

  function skeletonize(el) {
    el.setAttribute("data-fallback", el.textContent);
    el.innerHTML = '<span class="stat-skel" aria-hidden="true"></span>';
  }
  function settle(el, value) {
    if (!el) return;
    if (value !== null) { countUp(el, value); return; }
    var fb = parseInt((el.getAttribute("data-fallback") || "").replace(/[^0-9]/g, ""), 10);
    if (fb) countUp(el, fb); else el.textContent = el.getAttribute("data-fallback");
  }

  function initLiveStats() {
    var pubEls = document.querySelectorAll('[data-stat="pubs"]');
    var h = document.querySelector('[data-stat="hindex"]');
    var c = document.querySelector('[data-stat="citations"]');
    if (!pubEls.length && !h && !c) return;

    /* skeletons while loading, so no fallback number flashes first */
    Array.prototype.forEach.call(pubEls, skeletonize);
    [h, c].forEach(function (el) { if (el) skeletonize(el); });

    var pubsP = pubEls.length
      ? fetch("data/publications.json?v=19")
          .then(function (r) { return r.json(); })
          .then(function (pubs) { window.__pubCount = pubs.length; return pubs.length; })
          .catch(function () { return null; })
      : Promise.resolve(null);

    var oaP = (h || c)
      ? (function () {
          var ctrl = "AbortController" in window ? new AbortController() : null;
          var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);
          return fetch("https://api.openalex.org/authors/https://orcid.org/" + PI_ORCID,
                       ctrl ? { signal: ctrl.signal } : {})
            .then(function (r) { return r.json(); })
            .then(function (a) {
              clearTimeout(timer);
              return {
                h: a.summary_stats && a.summary_stats.h_index ? a.summary_stats.h_index : null,
                c: a.cited_by_count ? Number(a.cited_by_count) : null
              };
            })
            .catch(function () { clearTimeout(timer); return { h: null, c: null }; });
        })()
      : Promise.resolve({ h: null, c: null });

    /* wait for BOTH sources, then roll all numbers up together */
    Promise.all([pubsP, oaP]).then(function (res) {
      var pubCount = res[0], oa = res[1];
      Array.prototype.forEach.call(pubEls, function (el) { settle(el, pubCount); });
      if (pubCount) applyLang(); /* refresh strings that embed the count */
      settle(h, oa.h);
      settle(c, oa.c);
    });
  }

  /* ---------- featured-study modal ---------- */
  function initPaperModals() {
    var lastTrigger = null;
    function open(id, trigger) {
      var overlay = document.getElementById("modal-" + id);
      if (!overlay) return;
      lastTrigger = trigger || null;
      overlay.hidden = false;
      document.body.classList.add("modal-open");
      var btn = overlay.querySelector(".modal-close");
      if (btn) btn.focus();
    }
    function closeAll() {
      var any = false;
      Array.prototype.forEach.call(document.querySelectorAll(".modal-overlay:not([hidden])"), function (o) {
        o.hidden = true; any = true;
      });
      if (any) {
        document.body.classList.remove("modal-open");
        if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
      }
    }
    function setNavActive(key) {
      var current = key || document.body.getAttribute("data-page");
      Array.prototype.forEach.call(document.querySelectorAll(".nav-links a[data-key]"), function (a) {
        a.classList.toggle("active", a.getAttribute("data-key") === current);
      });
    }
    function openMega(id, trigger) {
      var mega = document.getElementById(id);
      if (!mega) return;
      lastTrigger = trigger || null;
      mega.hidden = false;
      document.body.classList.add("research-open");
      setNavActive("research");
      window.scrollTo(0, 0);
      var btn = mega.querySelector(".mega-close");
      if (btn) btn.focus();
    }
    function closeMega() {
      var any = false;
      Array.prototype.forEach.call(document.querySelectorAll(".mega-overlay:not([hidden])"), function (o) {
        o.hidden = true; any = true;
      });
      return any;
    }
    function dismissMega() {
      if (closeMega()) {
        document.body.classList.remove("research-open");
        setNavActive(null);
        window.scrollTo(0, 0);
        if (location.hash === "#research") history.replaceState(null, "", location.pathname);
        if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
      }
    }
    /* nav "Research": open in place on the home page; other pages navigate
       to index.html#research and the takeover opens on load (hash check below) */
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest('a[href$="index.html#research"]') : null;
      if (link && document.body.getAttribute("data-page") === "home") {
        e.preventDefault();
        history.replaceState(null, "", "#research");
        openMega("research-overlay", link);
      }
    });
    if (location.hash === "#research" && document.getElementById("research-overlay")) {
      openMega("research-overlay", null);
    }
    document.addEventListener("click", function (e) {
      var mega = e.target.closest ? e.target.closest("[data-mega]") : null;
      if (mega) { openMega(mega.getAttribute("data-mega"), mega); return; }
      var card = e.target.closest ? e.target.closest("[data-paper]") : null;
      if (card) { open(card.getAttribute("data-paper"), card); return; }
      if (e.target.closest(".modal-close")) { closeAll(); return; }
      if (e.target.closest(".mega-close")) { dismissMega(); return; }
      var overlay = e.target.classList && e.target.classList.contains("modal-overlay");
      if (overlay) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        /* detail modal first, then the full-screen overlay */
        if (document.querySelector(".modal-overlay:not([hidden])")) { closeAll(); return; }
        dismissMega();
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && e.target.hasAttribute && e.target.hasAttribute("data-paper")) {
        e.preventDefault();
        open(e.target.getAttribute("data-paper"), e.target);
      }
    });
  }

  /* ---------- member profile modal (people page) ---------- */
  var MEMBER_PROFILES = {
    "lee-js":  { email: "pured23@gmail.com",   roles: [
      { i18n: "role.ra", period: "Sep 2023 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]},
    "kim-mh":  { email: "mhkim@cmcnu.or.kr",  roles: [
      { i18n: "role.ra", period: "Oct 2025 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]},
    "kang-hr": { email: "khr1138@gmail.com",   roles: [
      { i18n: "role.ms", period: "Feb 2022 – Feb 2024", where: "Dept. of Microbiology, The Catholic University of Korea" },
      { i18n: "role.phd", period: "Feb 2024 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]},
    "shin-gj": { email: "tlsrudwls789@gmail.com", roles: [
      { i18n: "role.ms.prev", period: "Sep 2020 – Aug 2022", where: "Dept. of Bioinformatics, Soongsil University" },
      { i18n: "role.phd.only", period: "Sep 2022 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ], note: { en: "Current Affiliation: Prof. Seung-Hyun Jeong’s Lab (Sep 2026 –)", ko: "현 소속: 정승현 교수 연구실 (Sep 2026 –)" }},
    "lee-gs":  { email: "dlrmstjq7@gmail.com", roles: [
      { i18n: "role.ms", period: "Feb 2023 – Feb 2025", where: "Dept. of Microbiology, The Catholic University of Korea" },
      { i18n: "role.phd", period: "Feb 2025 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]},
    "kim-sr":  { email: "rlatpfla1258@gmail.com", roles: [
      { i18n: "role.ms", period: "Feb 2024 – Feb 2026", where: "Dept. of Microbiology, The Catholic University of Korea" },
      { i18n: "role.phd", period: "Feb 2026 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]},
    "kim-y":   { email: "rladpwl1022@gmail.com", roles: [
      { i18n: "role.ms", period: "Feb 2024 – Feb 2026", where: "Dept. of Microbiology, The Catholic University of Korea" },
      { i18n: "role.phd", period: "Feb 2026 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]},
    "yoo-sh":  { email: "deniel0514@gmail.com", roles: [
      { i18n: "role.ms", period: "Feb 2025 –", where: "Dept. of Microbiology, The Catholic University of Korea" }
    ]}
  };

  /* ---------- force-directed cluster (people page) ---------- */
  var CLUSTER_MEMBERS = [
    { mid: "lee-js",  cluster: "ra",  i18n: "name.jeongseon", nameEn: "Jeongseon Lee", roleI18n: "role.ra" },
    { mid: "kim-mh",  cluster: "ra",  i18n: "name.minhee",    nameEn: "Minhee Kim",    roleI18n: "role.ra" },
    { mid: "kang-hr", cluster: "phd", i18n: "name.huiram",    nameEn: "Huiram Kang",   roleI18n: "role.phd" },
    { mid: "shin-gj", cluster: "phd", i18n: "name.gyeongjin", nameEn: "GyeongJin Shin",roleI18n: "role.phd.only" },
    { mid: "lee-gs",  cluster: "phd", i18n: "name.geunseob",  nameEn: "Geunseob Lee",  roleI18n: "role.phd" },
    { mid: "kim-sr",  cluster: "phd", i18n: "name.serim",     nameEn: "Serim Kim",     roleI18n: "role.phd" },
    { mid: "kim-y",   cluster: "phd", i18n: "name.yeji",      nameEn: "Yeji Kim",      roleI18n: "role.phd" },
    { mid: "yoo-sh",  cluster: "ms",  i18n: "name.suhyeon",   nameEn: "Suhyeon Yoo",   roleI18n: "role.ms" }
  ];
  var CLUSTER_COLORS = { ra: "#0e9f6e", phd: "#2b53e0", ms: "#7138ea", pi: "#d9418c" };

  function initCluster() {
    var canvas = document.getElementById("cluster-canvas");
    if (!canvas || typeof d3 === "undefined") return;
    var isStudent = function (c) { return c === "phd" || c === "ms"; };
    var w = canvas.offsetWidth;
    var h = Math.max(620, w * 0.66);
    canvas.style.height = h + "px";

    var R = Math.min(46, w / 16);

    /* fixed layout: PI in the middle, students to the right, researchers to the left */
    var target = {
      pi:          { x: w * 0.4,  y: h * 0.5 },
      students:    { x: w * 0.68, y: h * 0.5 },
      researchers: { x: w * 0.13, y: h * 0.5 }
    };

    /* nodes: deterministic ring around each cluster centre */
    var counts = { students: 0, researchers: 0 };
    var nodes = CLUSTER_MEMBERS.map(function (m) {
      var key = isStudent(m.cluster) ? "students" : "researchers";
      var c = target[key], i = counts[key]++;
      var a = i * 2.4, d = R * 1.6 * Math.sqrt(i);
      return {
        mid: m.mid, cluster: m.cluster, nameEn: m.nameEn,
        i18n: m.i18n, roleI18n: m.roleI18n, r: R,
        x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d
      };
    });
    var pi = {
      mid: "lee-ho", cluster: "pi", isPI: true, nameEn: "Hae-Ock Lee",
      i18n: "name.haeock", roleI18n: "nav.pi", r: R * 1.3,
      x: target.pi.x, y: target.pi.y, fx: target.pi.x, fy: target.pi.y
    };
    nodes.push(pi);

    /* edge layer: every member is linked to the PI */
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "cluster-edges");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    canvas.appendChild(svg);
    var edges = nodes.filter(function (n) { return !n.isPI; }).map(function (n) {
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("stroke", CLUSTER_COLORS[n.cluster]);
      svg.appendChild(line);
      return { node: n, el: line };
    });

    /* DOM nodes */
    nodes.forEach(function (n) {
      var el = document.createElement("div");
      el.className = "cluster-node" + (n.isPI ? " is-pi" : "");
      if (n.isPI) el.setAttribute("data-href", "principal-investigator.html");
      else el.setAttribute("data-member", n.mid);
      var names = n.nameEn.trim().split(/\s+/);
      var initials = (names[0][0] || "") + (names.length > 1 ? names[names.length - 1][0] : "");
      var prof = MEMBER_PROFILES[n.mid];
      var email = n.isPI ? "haeocklee@catholic.ac.kr" : (prof ? prof.email : "");
      var rr = n.r;
      el.innerHTML =
        '<div class="avatar" style="width:' + (rr * 2) + 'px;height:' + (rr * 2) + 'px;border-radius:50%;' +
        'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:' + (rr * 0.7) + 'px;' +
        'color:#fff;background:' + CLUSTER_COLORS[n.cluster] + ';">' + initials.toUpperCase() + '</div>' +
        '<h3 data-i18n="' + n.i18n + '">' + n.nameEn + '</h3>' +
        '<div class="role" data-i18n="' + n.roleI18n + '">' + (t(n.roleI18n) || n.roleI18n) + '</div>' +
        (email ? '<div class="email">' + esc(email) + '</div>' : '');
      canvas.appendChild(el);
      n.el = el;
      /* half-width wide enough for the name/role/email labels, so they stay inside the canvas */
      el.style.width = (n.r * 2 + 40) + "px";
      n.hw = Math.max(n.r + 20, Math.ceil(el.scrollWidth / 2));
    });
    pi.el.addEventListener("click", function () {
      if (!pi.el.dataset.dragged) window.location.href = pi.el.getAttribute("data-href");
    });

    /* students cluster center, researchers flank left/right */
    var sim = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-350))
      .force("collide", d3.forceCollide(function (d) { return d.r + 62; }).iterations(3).strength(1))
      .force("x", d3.forceX(function (d) {
        return d.isPI ? target.pi.x : isStudent(d.cluster) ? target.students.x : target.researchers.x;
      }).strength(function (d) { return isStudent(d.cluster) ? 0.03 : 0.06; }))
      .force("y", d3.forceY(function (d) {
        return d.isPI ? target.pi.y : isStudent(d.cluster) ? target.students.y : target.researchers.y;
      }).strength(0.025))
      .alphaDecay(0.03)
      .alphaMin(0.001);

    var minY = R + 50, maxY = h - R - 40;
    var BOUNCE = 0.45;
    function render() {
      nodes.forEach(function (n) {
        var minX = n.hw, maxX = w - n.hw;
        if (n.x < minX) { n.x = minX; if (n.vx < 0) n.vx = -n.vx * BOUNCE; }
        else if (n.x > maxX) { n.x = maxX; if (n.vx > 0) n.vx = -n.vx * BOUNCE; }
        if (n.y < minY) { n.y = minY; if (n.vy < 0) n.vy = -n.vy * BOUNCE; }
        else if (n.y > maxY) { n.y = maxY; if (n.vy > 0) n.vy = -n.vy * BOUNCE; }
        n.el.style.left = (n.x - n.hw) + "px";
        n.el.style.top = (n.y - n.r - 5) + "px";
        n.el.style.width = (n.hw * 2) + "px";
      });
      edges.forEach(function (e) {
        e.el.setAttribute("x1", pi.x); e.el.setAttribute("y1", pi.y);
        e.el.setAttribute("x2", e.node.x); e.el.setAttribute("y2", e.node.y);
      });
    }
    sim.on("tick", render);

    /* settle synchronously so the page opens on the final layout,
       then drop the clustering forces so nodes stay wherever they are put */
    sim.stop();
    sim.tick(400);
    render();
    sim.force("x", null).force("y", null).force("charge", null);
    pi.fx = null; pi.fy = null;

    /* drag to move, release with momentum to throw */
    var drag = d3.drag()
      .on("start", function (event, d) {
        d.el.classList.add("is-dragging");
        d.moved = false;
        d.fx = d.x; d.fy = d.y;
        d.sx = event.x; d.sy = event.y;
        d.px = event.x; d.py = event.y; d.pt = performance.now();
        d.tvx = 0; d.tvy = 0;
        if (d.isPI) {
          /* tether every member to the PI at its current distance, so the lab
             trails behind the PI wherever it goes */
          clearTimeout(initCluster._tether);
          var tether = nodes.filter(function (n) { return !n.isPI; }).map(function (n) {
            return { source: pi, target: n, dist: Math.hypot(n.x - pi.x, n.y - pi.y) };
          });
          sim.force("lead", d3.forceLink(tether).distance(function (l) { return l.dist; }).strength(0.6));
          sim.alphaTarget(0.3).restart();
        } else {
          sim.alphaTarget(0.12).restart();
        }
      })
      .on("drag", function (event, d) {
        var now = performance.now(), dt = Math.max(1, now - d.pt);
        var dx = event.x - d.px, dy = event.y - d.py;
        /* a jittery click is still a click: only a real displacement counts as a drag */
        if (!d.moved && Math.hypot(event.x - d.sx, event.y - d.sy) > 4) d.moved = true;
        if (!d.moved) return;
        /* smoothed pointer velocity, px per frame (~16ms) */
        d.tvx = d.tvx * 0.5 + (dx / dt * 16) * 0.5;
        d.tvy = d.tvy * 0.5 + (dy / dt * 16) * 0.5;
        d.px = event.x; d.py = event.y; d.pt = now;
        d.fx = event.x; d.fy = event.y;
      })
      .on("end", function (event, d) {
        d.el.classList.remove("is-dragging");
        /* stale pointer velocity means the user paused before releasing */
        var idle = performance.now() - d.pt > 80;
        d.fx = null; d.fy = null;
        d.vx = idle ? 0 : d.tvx;
        d.vy = idle ? 0 : d.tvy;
        /* keep the tether while a thrown PI is in flight, then let the lab rest where it lands */
        if (d.isPI) initCluster._tether = setTimeout(function () { sim.force("lead", null); }, 1800);
        /* low friction while a throw is in flight, then back to normal damping */
        if (Math.abs(d.vx) + Math.abs(d.vy) > 6) {
          sim.velocityDecay(0.08);
          clearTimeout(initCluster._flight);
          initCluster._flight = setTimeout(function () { sim.velocityDecay(0.4); }, 1200);
        }
        sim.alphaTarget(0).alpha(0.8).restart();
        if (d.moved) {
          d.el.dataset.dragged = "1";
          setTimeout(function () { delete d.el.dataset.dragged; }, 0);
        }
      });
    nodes.forEach(function (n) { d3.select(n.el).datum(n).call(drag); });

    if (typeof applyLang === "function") applyLang();
  }

  var __memberPubs = null;
  function initMemberModal() {
    var overlay = document.getElementById("member-modal");
    if (!overlay) return;

    function openModal(mid) {
      var prof = MEMBER_PROFILES[mid];
      var nameObj = MEMBER_NAMES[mid];
      if (!prof || !nameObj) return;
      var lang = getLang();
      document.getElementById("mm-name").textContent = nameObj[lang] || nameObj.en;
      var avatarEl = document.getElementById("mm-avatar");
      var cardAvatar = document.querySelector('.cluster-node[data-member="' + mid + '"] .avatar');
      if (cardAvatar) {
        avatarEl.textContent = cardAvatar.textContent;
        avatarEl.style.background = cardAvatar.style.background;
      } else {
        var fullName = nameObj.en.trim().split(/\s+/);
        var initials = (fullName[0][0] || "") + (fullName.length > 1 ? fullName[fullName.length - 1][0] : "");
        avatarEl.textContent = initials.toUpperCase();
      }
      var rolesHtml = prof.roles.map(function (r) {
        var label = t(r.i18n) || r.i18n;
        var line = '<div class="mm-role-row"><span>' + esc(label) + '</span><span class="mm-period">' + esc(r.period) + '</span></div>';
        if (r.where) line += '<div class="mm-role-where">' + esc(r.where) + '</div>';
        return line;
      }).join("");
      if (prof.note) {
        var noteText = prof.note[lang] || prof.note.en;
        rolesHtml += '<div class="mm-role-note">' + esc(noteText) + '</div>';
      }
      document.getElementById("mm-roles").innerHTML = rolesHtml;
      document.getElementById("mm-email").innerHTML = '<a href="mailto:' + esc(prof.email) + '">' + esc(prof.email) + '</a>';
      var pubHeading = document.getElementById("mm-pub-heading");
      pubHeading.innerHTML = t("people.modal.pubs") || "Publications";
      var pubList = document.getElementById("mm-pub-list");
      if (__memberPubs) {
        renderModalPubs(pubList, mid);
      } else {
        pubList.innerHTML = '<p class="mm-loading">' + (lang === "ko" ? "불러오는 중…" : "Loading…") + '</p>';
        fetch("data/publications.json?v=19")
          .then(function (r) { return r.json(); })
          .then(function (pubs) { __memberPubs = pubs; renderModalPubs(pubList, mid); })
          .catch(function () { pubList.innerHTML = '<p class="mm-empty">—</p>'; });
      }
      overlay.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { overlay.classList.add("is-visible"); });
      });
      document.body.classList.add("modal-open");
      overlay.querySelector(".member-modal-close").focus();
    }

    function renderModalPubs(container, mid) {
      var lang = getLang();
      var filtered = __memberPubs.filter(function (p) {
        return p.members && typeof p.members === "object" && mid in p.members;
      });
      if (!filtered.length) {
        container.innerHTML = '<p class="mm-empty">' + (lang === "ko" ? "등록된 논문이 없습니다." : "No publications yet.") + '</p>';
        return;
      }
      container.innerHTML = filtered.map(function (p) {
        var doiUrl = p.doi ? "https://doi.org/" + encodeURI(p.doi) : null;
        var title = doiUrl
          ? '<a href="' + doiUrl + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>'
          : esc(p.title);
        return '<div class="mm-pub">' +
          '<div class="mm-pub-title">' + title + '</div>' +
          '<div class="mm-pub-authors">' + boldMembers(p.authors, p.members) + '</div>' +
          '<div class="mm-pub-meta">' + esc(p.year) + ' · ' + esc(p.journal) + '</div>' +
          '</div>';
      }).join("");
    }

    function closeModal() {
      overlay.classList.remove("is-visible");
      setTimeout(function () { overlay.hidden = true; }, 300);
      document.body.classList.remove("modal-open");
    }

    document.addEventListener("click", function (e) {
      var card = e.target.closest ? e.target.closest(".cluster-node[data-member]") : null;
      if (card) { if (!card.dataset.dragged) openModal(card.getAttribute("data-member")); return; }
      if (e.target.closest(".member-modal-close")) { closeModal(); return; }
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    initPublications();
    initReveal();
    initRecentPubs();
    initPaperModals();
    initLiveStats();
    initCluster();
    initMemberModal();
    applyLang();
  });
})();
