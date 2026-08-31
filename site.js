/* SGL site — shared header/footer injection + publications rendering */
(function () {
  "use strict";

  var NAV = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "principal-investigator.html", label: "Principal Investigator", key: "pi" },
    { href: "people.html", label: "People", key: "people" },
    { href: "publications.html", label: "Publications", key: "publications" },
    { href: "contact.html", label: "Contact", key: "contact" }
  ];

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
      return '<a href="' + n.href + '"' + cls + ">" + n.label + "</a>";
    }).join("");
    var el = document.createElement("header");
    el.className = "site-header";
    el.innerHTML =
      '<div class="inner">' +
      '<a class="logo" href="index.html">SGL<span class="dot">.</span><span class="logo-full">Single-cell Genomics Lab</span></a>' +
      '<button class="nav-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>' +
      '<nav class="nav-links">' + links + "</nav>" +
      "</div>";
    document.body.insertBefore(el, document.body.firstChild);
    var toggle = el.querySelector(".nav-toggle");
    var nav = el.querySelector(".nav-links");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function buildFooter() {
    var el = document.createElement("footer");
    el.className = "site-footer";
    el.innerHTML =
      '<div class="inner">' +
      "<div>" +
      '<div class="brand">SGL<span class="dot">.</span> Single-cell Genomics Lab</div>' +
      "<p>Department of Microbiology, College of Medicine<br>The Catholic University of Korea<br>" +
      "Omnibus Park Bldg A, Rm 8108, 222 Banpo-daero, Seocho-gu, Seoul, South Korea</p>" +
      "</div>" +
      "<div>" +
      '<div class="col-title">Contact</div>' +
      '<p><a href="mailto:haeocklee@catholic.ac.kr">haeocklee@catholic.ac.kr</a><br>+82-2-3147-8365</p>' +
      "</div>" +
      "</div>" +
      '<div class="copyright">&copy; ' + new Date().getFullYear() +
      " Single-cell Genomics Lab, The Catholic University of Korea</div>";
    document.body.appendChild(el);
  }

  /* ---------- publications ---------- */
  function boldPI(authors) {
    return esc(authors)
      .replace(/Lee, H\. O\./g, "<b>Lee, H. O.</b>")
      .replace(/Lee HO(?![a-z])/g, "<b>Lee HO</b>");
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
    if (count) count.textContent = shown.length + " of " + pubs.length + " publications";
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
    revealize(document.querySelectorAll(".card, .person, .contact-block, .timeline-item, .alumni-chip, .pub-row"));
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    initPublications();
    initAvatars();
    initReveal();
  });
})();
