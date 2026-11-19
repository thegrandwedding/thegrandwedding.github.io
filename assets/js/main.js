(function () {
  "use strict";

  /* =========================================================
     Invitation-gated wedding site.

     A guest arrives with ?invite=<code>. The code names a file in
     data/invites/<code>.json, which lists the event files (and the
     families file) that guest may see. Nothing else is ever fetched,
     so uninvited events never reach the guest's browser.

     No code, or an unknown code -> the landing page.
     ========================================================= */

  var CODE_RE = /^[A-Za-z0-9]{4,32}$/;

  var bar = document.querySelector(".countdown-bar");
  var nav = document.querySelector(".tabs");
  var tabsEl = document.getElementById("tabs");
  var mainEl = document.getElementById("main");
  var landing = document.getElementById("landing");
  var loading = document.getElementById("loading");

  /* ---------- small helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function getJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " -> " + r.status);
      return r.json();
    });
  }

  var ORNAMENT_SMALL =
    '<div class="ornament small" aria-hidden="true"><span class="line"></span><span class="diamond"></span><span class="line"></span></div>';

  /* ---------- work out which invitation code to use ----------
     Only the code in the address counts. Nothing is remembered on the device,
     so the plain address always shows the landing page. */
  function resolveCode() {
    var code = new URLSearchParams(location.search).get("invite");
    return code && CODE_RE.test(code) ? code : null;
  }

  /* ---------- rendering ---------- */
  function renderWelcome(invite, families, events) {
    var html = '<section class="panel" data-panel="home" role="tabpanel" hidden>';
    html += '<h2 class="section-title">Welcome</h2>';
    if (invite.greeting) html += '<p class="greeting">' + esc(invite.greeting) + "</p>";
    html += '<p class="lede">It is with the greatest joy that our families invite you to share in the ' +
      (events.length > 1 ? "celebrations" : "celebration") +
      " as Seersha and Siddhant begin their life together.</p>";

    if (families) {
      html += '<div class="families">' + familyBlock("The Bride", families.bride) +
        '<div class="family-divider" aria-hidden="true"><span>&amp;</span></div>' +
        familyBlock("The Groom", families.groom) + "</div>";
    }

    html += '<h3 class="sub-title">' + (events.length > 1 ? "Your Celebrations" : "Your Invitation") + "</h3>";
    html += '<ol class="timeline">';
    events.forEach(function (e) {
      var when = e.date + (e.time && e.time !== e.date && e.time.indexOf("announced") === -1 ? " · " + e.time : "");
      html += '<li><a href="#' + esc(e.id) + '"><span class="t-date">' + esc(when) +
        '</span><span class="t-name">' + esc(e.title) + "</span></a></li>";
    });
    html += "</ol></section>";
    return html;
  }

  function familyBlock(role, f) {
    return '<div class="family"><p class="role">' + esc(role) + "</p>" +
      '<p class="person">' + esc(f.name) + "</p>" +
      '<p class="parents">' + esc(f.relation) + "<br>" + esc(f.parents) + "</p>" +
      '<p class="address">' + f.address.map(esc).join("<br>") + "</p></div>";
  }

  function renderStandard(e) {
    return '<section class="panel" data-panel="' + esc(e.id) + '" role="tabpanel" hidden>' +
      '<p class="kicker">' + esc(e.kicker) + "</p>" +
      '<h2 class="event-name">' + esc(e.title) + "</h2>" + ORNAMENT_SMALL +
      '<p class="lede">' + esc(e.lede) + "</p>" +
      '<dl class="details">' +
      "<div><dt>Date</dt><dd>" + esc(e.date) + "</dd></div>" +
      "<div><dt>Time</dt><dd>" + esc(e.time) + "</dd></div>" +
      "<div><dt>Venue</dt><dd>" + esc(e.venue) + "</dd></div>" +
      "</dl></section>";
  }

  /* ---------- themed card decorations (inline SVG, no image files) ---------- */
  function rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  // Haldi: a marigold toran (swags + hanging strands) and drifting petals.
  function decoHaldi() {
    var cols = ["#f59e0b", "#fbbf24", "#ea7a0c", "#fcd34d"];
    var svg = '<svg class="deco-top" viewBox="0 0 600 170" aria-hidden="true">';
    var k, i, t, x, y;
    // hanging strands at the swag joins, drawn first so the swags sit on top
    var strands = [7, 150, 300, 450, 593], lens = [11, 7, 9, 7, 11];
    strands.forEach(function (sx, n) {
      for (i = 0; i < lens[n]; i++) {
        svg += '<circle cx="' + sx + '" cy="' + (16 + i * 12) + '" r="6.5" fill="' + cols[(i + n) % 4] + '"/>';
      }
      var ey = 16 + lens[n] * 12;
      svg += '<path d="M' + sx + " " + (ey - 4) + " q -7 12 0 20 q 7 -8 0 -20z" + '" fill="#4d7c0f"/>';
    });
    for (k = 0; k < 4; k++) {
      for (i = 0; i <= 14; i++) {
        t = i / 14; x = k * 150 + 150 * t; y = 14 + 40 * Math.sin(Math.PI * t);
        svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7.5" fill="' + cols[(i + k) % 4] + '"/>';
      }
      // a pair of mango leaves at the bottom of each swag
      x = k * 150 + 75;
      svg += '<path d="M' + x + ' 56 q -14 6 -22 18 q 16 -2 22 -18z" fill="#65a30d"/>' +
             '<path d="M' + x + ' 56 q 14 6 22 18 q -16 -2 -22 -18z" fill="#4d7c0f"/>';
    }
    svg += "</svg>";
    var r = rng(7), petals = "";
    for (i = 0; i < 18; i++) {
      petals += '<span class="petal" style="left:' + (r() * 100).toFixed(1) + "%;animation-delay:-" +
        (r() * 14).toFixed(1) + "s;animation-duration:" + (9 + r() * 8).toFixed(1) + "s;--s:" +
        (0.6 + r() * 0.8).toFixed(2) + ";--c:" + cols[i % 4] + '"></span>';
    }
    return '<div class="deco" aria-hidden="true">' + svg + petals + "</div>";
  }

  // Sangeet: a canopy of roses, fairy-light strands with lanterns, glitter and stage lights.
  function decoSangeet() {
    var r = rng(11), i, x, len, svg = '<svg class="deco-top" viewBox="0 0 600 190" aria-hidden="true">';
    // fairy lights
    for (i = 0; i < 22; i++) {
      x = 14 + i * 27 + (r() * 8 - 4);
      len = 50 + r() * 95;
      svg += '<line x1="' + x.toFixed(1) + '" y1="20" x2="' + x.toFixed(1) + '" y2="' + len.toFixed(1) +
        '" stroke="rgba(255,240,220,.35)" stroke-width=".8"/>';
      for (var y = 34; y < len; y += 14 + r() * 8) {
        svg += '<circle class="twinkle" style="animation-delay:-' + (r() * 3).toFixed(2) + 's" cx="' + x.toFixed(1) +
          '" cy="' + y.toFixed(1) + '" r="' + (1.4 + r() * 1.4).toFixed(1) + '" fill="#fff6e0"/>';
      }
      if (i % 5 === 2) { // lantern
        svg += '<g transform="translate(' + x.toFixed(1) + " " + len.toFixed(1) + ')">' +
          '<path d="M-6 0 h12 l3 6 v14 l-3 5 h-12 l-3 -5 v-14z" fill="rgba(255,236,200,.18)" stroke="#e9d5ff" stroke-width="1"/>' +
          '<rect x="-2" y="8" width="4" height="8" rx="2" fill="#fde68a" class="twinkle"/></g>';
      }
    }
    // greenery
    for (i = 0; i < 26; i++) {
      x = r() * 600;
      svg += '<ellipse cx="' + x.toFixed(1) + '" cy="' + (16 + r() * 26).toFixed(1) + '" rx="13" ry="5" fill="' +
        (i % 2 ? "#4f7a4a" : "#6b9a5e") + '" transform="rotate(' + (r() * 70 - 35).toFixed(0) + " " + x.toFixed(1) + ' 28)"/>';
    }
    // roses
    for (i = 0; i < 11; i++) {
      x = 10 + i * 58 + (r() * 14 - 7);
      var y0 = 26 + r() * 12, s = 0.75 + r() * 0.4;
      svg += '<g transform="translate(' + x.toFixed(1) + " " + y0.toFixed(1) + ") scale(" + s.toFixed(2) + ')">' +
        '<circle r="22" fill="#f2b8d2"/><circle r="16" fill="#e79bbd"/><circle r="10" fill="#d97aa6"/>' +
        '<path d="M-10 2 a10 10 0 0 1 18 -6 M-6 6 a8 8 0 0 0 14 -2 M-3 -1 a4 4 0 0 1 6 0" fill="none" stroke="#b8507f" stroke-width="1.6"/></g>';
    }
    // baby's breath
    for (i = 0; i < 40; i++) {
      svg += '<circle cx="' + (r() * 600).toFixed(1) + '" cy="' + (8 + r() * 44).toFixed(1) + '" r="' +
        (1.5 + r() * 1.8).toFixed(1) + '" fill="#fffaf3"/>';
    }
    svg += "</svg>";
    var glitter = "";
    for (i = 0; i < 26; i++) {
      glitter += '<span class="sparkle" style="left:' + (r() * 100).toFixed(1) + "%;top:" + (25 + r() * 75).toFixed(1) +
        "%;animation-delay:-" + (r() * 4).toFixed(2) + "s;--s:" + (0.5 + r() * 0.9).toFixed(2) + '"></span>';
    }
    return '<div class="deco" aria-hidden="true">' + svg + glitter +
      '<span class="stage-light left"></span><span class="stage-light right"></span></div>';
  }

  var DECOR = { haldi: decoHaldi, sangeet: decoSangeet };

  function renderCard(e) {
    var c = e.card;
    var theme = c.theme && DECOR[c.theme] ? c.theme : null;
    var rsvp = (c.rsvp || []).map(function (r) {
      return esc(r.name) + ' · <a href="' + esc(r.href) + '" target="_blank" rel="noopener">' + esc(r.phone) + "</a>" +
        (r.note ? " (" + esc(r.note) + ")" : "");
    }).join("<br>");
    var actions = "";
    if (c.mapUrl) actions += '<a class="btn" href="' + esc(c.mapUrl) + '" target="_blank" rel="noopener">View on Map</a>';
    if (c.pdf) actions += '<a class="btn ghost" href="' + esc(c.pdf) + '" target="_blank" rel="noopener">Download Card</a>';

    return '<section class="panel" data-panel="' + esc(e.id) + '" role="tabpanel" hidden>' +
      '<article class="card' + (theme ? " theme-" + theme : "") + '">' +
      (theme ? DECOR[theme]() : "") +
      '<div class="card-body">' +
      (c.invocation ? '<p class="card-invocation">' + esc(c.invocation) + "</p>" : "") +
      (c.hosts ? '<p class="card-hosts">' + esc(c.hosts) + "</p>" : "") +
      '<p class="card-request">' + esc(c.request) + "</p>" +
      '<h2 class="card-title"><span class="flourish">◇</span> ' + esc(c.heading) + ' <span class="flourish">◇</span></h2>' +
      '<p class="card-name">' + esc(c.names[0]) + "</p>" +
      '<p class="card-amp">&amp;</p>' +
      '<p class="card-name">' + esc(c.names[1]) + "</p>" +
      (c.tagline ? '<p class="card-tagline">' + esc(c.tagline) + "</p>" : "") +
      '<div class="card-date"><span class="side">' + esc(c.weekday) + '</span>' +
      '<span class="day">' + esc(c.day) + "<small>" + esc(c.monthYear) + "</small></span>" +
      '<span class="side">' + esc(c.time) + "</span></div>" +
      '<p class="card-label">Venue</p>' +
      '<p class="card-venue">' + esc(c.venue) + "</p>" +
      (c.venueSub ? '<p class="card-venue-sub">' + esc(c.venueSub) + "</p>" : "") +
      (c.address && c.address.length ? '<p class="card-address">' + c.address.map(esc).join("<br>") + "</p>" : "") +
      (actions ? '<p class="card-actions">' + actions + "</p>" : "") +
      (rsvp ? '<p class="card-label">R.S.V.P.</p><p class="card-rsvp">' + rsvp + "</p>" : "") +
      "</div></article></section>";
  }

  /* ---------- countdown: to the guest's next dated event ---------- */
  function startCountdown(events) {
    var label = document.getElementById("countdown-label");
    var wrap = document.getElementById("countdown");
    var d = document.getElementById("cd-days"), h = document.getElementById("cd-hours"),
        m = document.getElementById("cd-mins"), s = document.getElementById("cd-secs");
    var targets = events.filter(function (e) { return e.countdownAt; })
      .map(function (e) { return { label: e.countdownLabel || ("Until the " + e.title), at: new Date(e.countdownAt).getTime() }; })
      .sort(function (a, b) { return a.at - b.at; });
    if (!targets.length) return;

    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function tick() {
      var now = Date.now(), t = null;
      for (var i = 0; i < targets.length; i++) if (targets[i].at > now) { t = targets[i]; break; }
      if (!t) {
        label.textContent = "Happily ever after — thank you for celebrating with us";
        wrap.hidden = true;
        syncOffset();
        return false;
      }
      var diff = Math.floor((t.at - now) / 1000);
      label.textContent = t.label;
      d.textContent = Math.floor(diff / 86400);
      h.textContent = pad(Math.floor((diff % 86400) / 3600));
      m.textContent = pad(Math.floor((diff % 3600) / 60));
      s.textContent = pad(diff % 60);
      return true;
    }
    wrap.hidden = false;
    syncOffset();
    if (tick()) {
      var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
    }
  }

  /* ---------- tabs ---------- */
  function syncOffset() { nav.style.top = bar.offsetHeight + "px"; }
  window.addEventListener("resize", syncOffset);

  function setupTabs(names) {
    var links = Array.prototype.slice.call(tabsEl.querySelectorAll("a[data-tab]"));
    var panels = Array.prototype.slice.call(mainEl.querySelectorAll(".panel[data-panel]"));

    function show(name, scroll) {
      if (names.indexOf(name) === -1) name = "home";
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
      links.forEach(function (a) {
        var on = a.getAttribute("data-tab") === name;
        a.setAttribute("aria-selected", on ? "true" : "false");
        if (on && a.scrollIntoView) a.scrollIntoView({ block: "nearest", inline: "center" });
      });
      if (scroll) {
        var y = nav.getBoundingClientRect().top + window.pageYOffset - bar.offsetHeight;
        if (window.pageYOffset > y || name !== "home") window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
    window.addEventListener("hashchange", function () { show(location.hash.slice(1), true); });
    show(location.hash.slice(1), false);
  }

  /* ---------- states ---------- */
  function showLanding() {
    loading.hidden = true;
    landing.hidden = false;
    document.body.classList.remove("is-loading");
    syncOffset();
  }

  function showInvitation(invite, families, events) {
    events.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    var tabs = '<a href="#home" role="tab" data-tab="home">Welcome</a>';
    events.forEach(function (e) {
      tabs += '<a href="#' + esc(e.id) + '" role="tab" data-tab="' + esc(e.id) + '">' + esc(e.title) + "</a>";
    });
    tabsEl.innerHTML = tabs;

    var panels = renderWelcome(invite, families, events);
    events.forEach(function (e) { panels += e.layout === "card" ? renderCard(e) : renderStandard(e); });
    loading.insertAdjacentHTML("beforebegin", panels);

    loading.hidden = true;
    nav.hidden = false;
    document.body.classList.remove("is-loading");
    startCountdown(events);
    syncOffset();
    setupTabs(["home"].concat(events.map(function (e) { return e.id; })));
  }

  /* ---------- boot ---------- */
  // Clear the code older versions of the site saved on guests' devices.
  try { localStorage.removeItem("grandwedding.invite"); } catch (e) {}

  var code = resolveCode();
  if (!code) { showLanding(); return; }

  getJSON("data/invites/" + code + ".json")
    .then(function (invite) {
      return Promise.all([
        invite.families ? getJSON(invite.families).catch(function () { return null; }) : null,
        Promise.all(invite.events.map(getJSON))
      ]).then(function (r) { showInvitation(invite, r[0], r[1]); });
    })
    .catch(function (err) {
      if (window.console) console.warn("Invitation not found:", err);
      showLanding();
    });
})();
