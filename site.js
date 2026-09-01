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
    return v.replace(/\{n\}/g, window.__pubCount || 68);
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
      '<svg class="logo-svg" viewBox="0 0 84 34" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SGL">' +
      '<text x="0" y="27" font-family="Inter, Segoe UI, system-ui, sans-serif" font-size="27" font-weight="800" letter-spacing="0.3" fill="currentColor">SGL</text>' +
      '<circle cx="64" cy="24.5" r="3.2" fill="#2b53e0"/>' +
      '<circle cx="72" cy="9" r="3" fill="#60a5fa"/>' +
      '<circle cx="79" cy="15" r="2.4" fill="#a78bfa"/>' +
      '<circle cx="74" cy="20.5" r="1.9" fill="#34d399"/>' +
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
  /* PI + current lab members, matched against the exact initial forms they
     use in these papers. Surname-comma-initial forms shared with unrelated
     collaborators (Lee, J. / Kim, M. / Kim, S.) are deliberately NOT listed —
     every occurrence in the current data is a different person. */
  var MEMBER_PATTERNS = [
    /Lee, H\. O\./g,            /* Hae-Ock Lee (PI) */
    /Kang, H\.(?! ?[A-Z]\.)/g,  /* Huiram Kang */
    /Shin, G\. J\./g,           /* GyeongJin Shin */
    /Kim, Y\.(?! ?[A-Z]\.)/g,   /* Yeji Kim */
    /Lee HO(?![a-z])/g
  ];
  function boldPI(authors) {
    var s = esc(authors);
    MEMBER_PATTERNS.forEach(function (p) { s = s.replace(p, "<b>$&</b>"); });
    return s;
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
    return (
      '<div class="pub-row"' + (doiUrl ? ' data-doi="' + doiUrl + '"' : "") + ">" +
      '<span class="pub-badge">' + esc(p.year) + " &middot; " + esc(p.journal) + "</span>" +
      "<div>" +
      '<div class="pub-title">' + titleInner + "</div>" +
      '<div class="pub-authors">' + boldPI(p.authors) + "</div>" +
      '<div class="pub-meta">' + links.join(" &nbsp;&middot;&nbsp; ") + "</div>" +
      "</div></div>"
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

  function renderPubs(pubs, query) {
    var host = document.getElementById("pub-container");
    var count = document.getElementById("pub-count");
    var q = (query || "").trim().toLowerCase();
    var shown = q
      ? pubs.filter(function (p) {
          return (p.title + " " + p.authors + " " + p.journal + " " + p.year)
            .toLowerCase().indexOf(q) !== -1;
        })
      : pubs;
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

  function initPublications() {
    var host = document.getElementById("pub-container");
    if (!host) return;
    fetch("data/publications.json")
      .then(function (r) { return r.json(); })
      .then(function (pubs) {
        renderPubs(pubs, "");
        /* reveal treatment only on the initial render — search re-renders
           show rows instantly so filtering doesn't flicker */
        revealize(host.querySelectorAll(".year-heading, .pub-row"));
        var input = document.getElementById("pub-search");
        if (input) input.addEventListener("input", function () { renderPubs(pubs, input.value); });
        window.__sglRefreshPubCount = function () { renderPubs(pubs, input ? input.value : ""); };
      })
      .catch(function () {
        host.innerHTML = '<p style="margin-top:32px;color:var(--muted);">Could not load the publication list.</p>';
      });
  }

  /* ---------- avatars ---------- */
  var AVATAR_COLORS = ["#2b53e0", "#7138ea", "#0e9f6e", "#d9418c", "#e0762b", "#0d94b5"];
  function initAvatars() {
    var els = document.querySelectorAll(".avatar[data-name]");
    Array.prototype.forEach.call(els, function (el, i) {
      var name = el.getAttribute("data-name").trim().split(/\s+/);
      var initials = (name[0][0] || "") + (name.length > 1 ? name[name.length - 1][0] : "");
      el.textContent = initials.toUpperCase();
      el.style.background = AVATAR_COLORS[i % AVATAR_COLORS.length];
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
    revealize(document.querySelectorAll(".card, .person, .contact-block, .timeline-item, .alumni-chip, .pub-row"));
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
      ? fetch("data/publications.json")
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
        if (closeMega()) {
          document.body.classList.remove("modal-open");
          if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
        }
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && e.target.hasAttribute && e.target.hasAttribute("data-paper")) {
        e.preventDefault();
        open(e.target.getAttribute("data-paper"), e.target);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    initPublications();
    initAvatars();
    initReveal();
    initPaperModals();
    initLiveStats();
    applyLang();
  });
})();
