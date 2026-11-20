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
      (f.address && f.address.length ? '<p class="address">' + f.address.map(esc).join("<br>") + "</p>" : "") + "</div>";
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

  function f1(n) { return n.toFixed(1); }

  // A ruffled marigold head: dashed stroke gives the frilly petal edge.
  function marigold(cx, cy, rad, col, edge) {
    return '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(rad * 0.72) + '" fill="' + col +
      '" stroke="' + edge + '" stroke-width="' + f1(rad * 0.62) + '" stroke-dasharray="1.7 1.3"/>' +
      '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(rad * 0.28) + '" fill="#b45309" opacity=".55"/>';
  }

  // Haldi: drenched in yellow — side drapes, curtains of marigold strands,
  // a heavy marigold valance, jasmine buds, falling petals and warm bokeh.
  function decoHaldi() {
    var r = rng(7), i, j, x, y, len, svg;
    var cols = [["#f59e0b", "#fbbf24"], ["#facc15", "#fde047"], ["#f97316", "#fb923c"], ["#fbbf24", "#fde68a"], ["#ea580c", "#f97316"]];
    function pick() { return cols[Math.floor(r() * cols.length)]; }

    svg = '<svg class="deco-top" viewBox="0 0 600 470" aria-hidden="true">';
    // hanging strands: long at the sides, shorter over the text
    for (i = 0; i < 32; i++) {
      x = 6 + i * 18.6 + (r() * 6 - 3);
      var edgeDist = Math.min(x, 600 - x);
      len = edgeDist < 130 ? 160 + r() * 290 : 48 + r() * 40;
      svg += '<line x1="' + f1(x) + '" y1="20" x2="' + f1(x) + '" y2="' + f1(len) + '" stroke="#a16207" stroke-width=".7" opacity=".6"/>';
      for (y = 34, j = 0; y < len; y += 12.5, j++) {
        if (j % 5 === 4) { // jasmine buds
          svg += '<circle cx="' + f1(x - 2) + '" cy="' + f1(y) + '" r="2.6" fill="#fffdf5"/><circle cx="' + f1(x + 2) +
            '" cy="' + f1(y + 2) + '" r="2.4" fill="#fffbeb"/>';
        } else {
          var c = pick();
          svg += marigold(x, y, 6 + r() * 2.2, c[0], c[1]);
        }
      }
      svg += '<path d="M' + f1(x) + " " + f1(len + 4) + ' q -6 10 0 18 q 6 -8 0 -18z" fill="#4d7c0f"/>';
    }
    // valance: three dense rows of marigolds with mango leaves
    for (var row = 0; row < 3; row++) {
      for (x = -6; x < 610; x += 10 + r() * 3) {
        var c2 = pick();
        svg += marigold(x, 8 + row * 11 + r() * 4, 8 + r() * 3, c2[0], c2[1]);
      }
    }
    for (i = 0; i < 14; i++) {
      x = 20 + i * 43;
      svg += '<path d="M' + x + ' 40 q -14 8 -20 22 q 15 -4 20 -22z" fill="#65a30d"/>' +
             '<path d="M' + x + ' 40 q 14 8 20 22 q -15 -4 -20 -22z" fill="#3f6212"/>';
    }
    svg += "</svg>";

    // bottom: marigold garland and corner bunches
    var bot = '<svg class="deco-bottom" viewBox="0 0 600 90" aria-hidden="true">';
    for (x = -4; x < 610; x += 11 + r() * 3) {
      var c3 = pick();
      bot += marigold(x, 74 + r() * 8, 8 + r() * 3, c3[0], c3[1]);
    }
    [[30, 60], [570, 60]].forEach(function (pt) {
      for (i = 0; i < 9; i++) {
        var c4 = pick();
        bot += marigold(pt[0] + (r() * 56 - 28), pt[1] + (r() * 36 - 22), 11 + r() * 5, c4[0], c4[1]);
      }
    });
    bot += "</svg>";

    var bits = "";
    for (i = 0; i < 16; i++) {
      bits += '<span class="bokeh" style="left:' + f1(r() * 100) + "%;top:" + f1(10 + r() * 85) + "%;--s:" +
        (0.5 + r()).toFixed(2) + ";animation-delay:-" + f1(r() * 6) + 's"></span>';
    }
    var pcols = ["#fbbf24", "#f59e0b", "#facc15", "#fb923c", "#fde047"];
    for (i = 0; i < 44; i++) {
      bits += '<span class="petal" style="left:' + f1(r() * 100) + "%;animation-delay:-" + f1(r() * 16) +
        "s;animation-duration:" + f1(8 + r() * 9) + "s;--s:" + (0.6 + r() * 0.9).toFixed(2) + ";--c:" + pcols[i % 5] + '"></span>';
    }
    return '<div class="deco" aria-hidden="true"><span class="drape left"></span><span class="drape right"></span>' +
      svg + bot + bits + "</div>";
  }

  // A layered rose.
  function rose(cx, cy, R, pal) {
    return '<g transform="translate(' + f1(cx) + " " + f1(cy) + ')">' +
      '<circle r="' + f1(R) + '" fill="' + pal[0] + '"/>' +
      '<circle cx="' + f1(-R * .18) + '" cy="' + f1(-R * .12) + '" r="' + f1(R * .78) + '" fill="' + pal[1] + '"/>' +
      '<circle cx="' + f1(R * .12) + '" cy="' + f1(R * .06) + '" r="' + f1(R * .55) + '" fill="' + pal[2] + '"/>' +
      '<path d="M' + f1(-R * .5) + " " + f1(R * .15) + " a" + f1(R * .5) + " " + f1(R * .5) + " 0 0 1 " + f1(R * .9) + " " + f1(-R * .35) +
      " M" + f1(-R * .3) + " " + f1(R * .38) + " a" + f1(R * .4) + " " + f1(R * .4) + " 0 0 0 " + f1(R * .7) + " " + f1(-R * .1) +
      " M" + f1(-R * .15) + " " + f1(-R * .05) + " a" + f1(R * .2) + " " + f1(R * .2) + " 0 0 1 " + f1(R * .32) + ' 0" fill="none" stroke="' +
      pal[3] + '" stroke-width="' + f1(Math.max(1.2, R * .07)) + '" stroke-linecap="round"/></g>';
  }

  // Sangeet: all bling — a rose-and-hydrangea canopy, curtains of glowing
  // fairy lights and lanterns, bokeh, glitter, and pink stage spotlights.
  function decoSangeet() {
    var r = rng(11), i, x, y, len;
    var svg = '<svg class="deco-top" viewBox="0 0 600 470" aria-hidden="true">' +
      '<defs><filter id="sg-glow" x="-200%" y="-200%" width="500%" height="500%">' +
      '<feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';

    // fairy-light curtain
    svg += '<g filter="url(#sg-glow)">';
    var ends = [];
    for (i = 0; i < 46; i++) {
      x = 5 + i * 13 + (r() * 5 - 2.5);
      var edgeDist = Math.min(x, 600 - x);
      len = edgeDist < 140 ? 170 + r() * 280 : 60 + r() * 42;
      svg += '<line x1="' + f1(x) + '" y1="30" x2="' + f1(x) + '" y2="' + f1(len) + '" stroke="rgba(255,236,210,.28)" stroke-width=".6"/>';
      for (y = 42; y < len; y += 11 + r() * 9) {
        var pink = r() < 0.14;
        svg += '<circle class="twinkle" style="animation-delay:-' + f1(r() * 3) + 's" cx="' + f1(x) + '" cy="' + f1(y) +
          '" r="' + f1(1.3 + r() * 1.6) + '" fill="' + (pink ? "#ffc2dd" : "#fff3d1") + '"/>';
      }
      if (edgeDist < 140) ends.push([x, len]);
    }
    svg += "</g>";
    // lanterns at the ends of some side strands
    ends.forEach(function (e, n) {
      if (n % 3 !== 1) return;
      svg += '<g transform="translate(' + f1(e[0]) + " " + f1(e[1]) + ')">' +
        '<path d="M0 0 v4" stroke="#e6c27a"/><path d="M-4 4 h8 l2 3 h-12z" fill="#e6c27a"/>' +
        '<path d="M-7 7 h14 l3 8 v12 l-4 8 h-12 l-4 -8 v-12z" fill="rgba(255,214,140,.22)" stroke="#e6c27a" stroke-width="1.1"/>' +
        '<path d="M0 7 v28 M-7 15 h14 M-7 27 h14" stroke="#e6c27a" stroke-width=".6" opacity=".8"/>' +
        '<ellipse cx="0" cy="21" rx="3.4" ry="5" fill="#ffd27a" filter="url(#sg-glow)" class="twinkle"/>' +
        '<path d="M-3 35 h6 l-3 5z" fill="#e6c27a"/></g>';
    });

    // greenery
    for (i = 0; i < 48; i++) {
      x = r() * 610 - 5; y = 14 + r() * 50;
      var rot = r() * 140 - 70;
      svg += '<path d="M0 0 q 10 -7 22 0 q -10 7 -22 0z" fill="' + (i % 3 ? "#3f6b46" : "#5d8c55") +
        '" transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + rot.toFixed(0) + ')"/>';
    }
    // hydrangea clusters
    for (i = 0; i < 9; i++) {
      var hx = 20 + r() * 560, hy = 28 + r() * 26;
      for (var k = 0; k < 16; k++) {
        var a = r() * 6.28, d = r() * 13;
        svg += '<circle cx="' + f1(hx + Math.cos(a) * d) + '" cy="' + f1(hy + Math.sin(a) * d) + '" r="3.4" fill="' +
          (k % 3 ? "#e9d5ff" : "#fdf4ff") + '" stroke="#c4b5fd" stroke-width=".5"/>';
      }
    }
    // roses, two rows
    var pals = [
      ["#f9c5d8", "#f4a7c4", "#eb8fb5", "#c2557f"],
      ["#f4a7c4", "#ec8db3", "#de6f9e", "#a83c6a"],
      ["#fde2ec", "#f9c9da", "#f2aac5", "#c86b93"],
      ["#fff4ec", "#fbe4d8", "#f5cdbb", "#c99a86"]
    ];
    for (i = 0; i < 13; i++) {
      svg += rose(i * 48 + r() * 12 - 6, 22 + r() * 8, 22 + r() * 9, pals[Math.floor(r() * 4)]);
    }
    for (i = 0; i < 9; i++) {
      x = 30 + i * 68 + r() * 16 - 8;
      if (x > 200 && x < 400 && r() < 0.5) continue;
      svg += rose(x, 54 + r() * 14, 17 + r() * 8, pals[Math.floor(r() * 4)]);
    }
    // baby's breath
    for (i = 0; i < 90; i++) {
      svg += '<circle cx="' + f1(r() * 600) + '" cy="' + f1(4 + r() * 70) + '" r="' + f1(1.2 + r() * 1.8) + '" fill="#fffaf3"/>';
    }
    svg += "</svg>";

    // stage: spotlight fixtures in the corners
    var stage = '<svg class="deco-bottom" viewBox="0 0 600 110" aria-hidden="true">' +
      '<defs><radialGradient id="sg-lens"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ffd1e6"/><stop offset="1" stop-color="#f472b6" stop-opacity="0"/></radialGradient></defs>' +
      '<g transform="translate(46 86) rotate(-38)"><rect x="-24" y="-16" width="44" height="32" rx="5" fill="#1c1b2e" stroke="#4b4870"/>' +
      '<ellipse cx="22" cy="0" rx="8" ry="17" fill="#2a2843" stroke="#6b6894"/><ellipse cx="24" cy="0" rx="14" ry="22" fill="url(#sg-lens)"/></g>' +
      '<g transform="translate(554 86) rotate(38) scale(-1 1)"><rect x="-24" y="-16" width="44" height="32" rx="5" fill="#1c1b2e" stroke="#4b4870"/>' +
      '<ellipse cx="22" cy="0" rx="8" ry="17" fill="#2a2843" stroke="#6b6894"/><ellipse cx="24" cy="0" rx="14" ry="22" fill="url(#sg-lens)"/></g>' +
      "</svg>";

    var bits = '<span class="stage-light left"></span><span class="stage-light right"></span><span class="stage-floor"></span>';
    for (i = 0; i < 22; i++) {
      bits += '<span class="bokeh" style="left:' + f1(r() * 100) + "%;top:" + f1(15 + r() * 80) + "%;--s:" +
        (0.4 + r() * 1.1).toFixed(2) + ";--c:" + (i % 3 ? "rgba(255,190,225,.5)" : "rgba(255,226,170,.5)") +
        ";animation-delay:-" + f1(r() * 8) + 's"></span>';
    }
    for (i = 0; i < 70; i++) {
      var low = i < 40;
      bits += '<span class="sparkle" style="left:' + f1(r() * 100) + "%;top:" + f1(low ? 62 + r() * 36 : 18 + r() * 60) +
        "%;animation-delay:-" + f1(r() * 4) + "s;--s:" + (0.35 + r() * 0.9).toFixed(2) + '"></span>';
    }
    return '<div class="deco" aria-hidden="true">' + bits + svg + stage + "</div>";
  }

  // A peony / garden rose seen from above: rings of rounded petals.
  function peony(cx, cy, R, pal, rot) {
    var s = '<g transform="translate(' + f1(cx) + " " + f1(cy) + ") rotate(" + (rot || 0).toFixed(0) + ')">', k;
    for (k = 0; k < 9; k++) {
      s += '<ellipse cx="0" cy="' + f1(-R * .55) + '" rx="' + f1(R * .42) + '" ry="' + f1(R * .5) + '" fill="' + pal[0] +
        '" stroke="' + pal[2] + '" stroke-width=".6" transform="rotate(' + (k * 40) + ')"/>';
    }
    for (k = 0; k < 7; k++) {
      s += '<ellipse cx="0" cy="' + f1(-R * .32) + '" rx="' + f1(R * .3) + '" ry="' + f1(R * .36) + '" fill="' + pal[1] +
        '" stroke="' + pal[2] + '" stroke-width=".5" transform="rotate(' + (k * 51 + 20) + ')"/>';
    }
    s += '<circle r="' + f1(R * .26) + '" fill="' + pal[2] + '"/>' +
      '<path d="M' + f1(-R * .14) + ' 0 a' + f1(R * .14) + " " + f1(R * .14) + " 0 1 1 " + f1(R * .2) + ' 0" fill="none" stroke="' + pal[0] + '" stroke-width="' + f1(Math.max(.8, R * .06)) + '"/>';
    return s + "</g>";
  }

  function leaf(x, y, len, rot, col) {
    return '<path d="M0 0 q ' + f1(len * .45) + " " + f1(-len * .32) + " " + f1(len) + " 0 q " + f1(-len * .55) + " " + f1(len * .32) + " " + f1(-len) +
      ' 0z" fill="' + col + '" transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + rot.toFixed(0) + ')"/>';
  }

  // A lotus bloom, pichwai style, opening upwards from (cx, cy).
  function lotus(cx, cy, R) {
    var s = '<g transform="translate(' + f1(cx) + " " + f1(cy) + ')">';
    [[-62, "#d9668c"], [62, "#d9668c"], [-38, "#ec8fae"], [38, "#ec8fae"], [-16, "#f6b6c9"], [16, "#f6b6c9"], [0, "#fbd3df"]].forEach(function (p) {
      s += '<path d="M0 0 C ' + f1(-R * .34) + " " + f1(-R * .4) + " " + f1(-R * .22) + " " + f1(-R * .85) + " 0 " + f1(-R) +
        " C " + f1(R * .22) + " " + f1(-R * .85) + " " + f1(R * .34) + " " + f1(-R * .4) + ' 0 0z" fill="' + p[1] +
        '" stroke="#b8466e" stroke-width=".6" transform="rotate(' + p[0] + ')"/>';
    });
    return s + '<ellipse cx="0" cy="' + f1(-R * .08) + '" rx="' + f1(R * .28) + '" ry="' + f1(R * .1) + '" fill="#e8c766"/></g>';
  }

  // Varmala: an ivory-and-blush jharokha — a gold cusped Mughal arch, blush peonies
  // spilling from the spandrels, rose-and-jasmine strands, a lotus pond below.
  function decoVarmala() {
    var r = rng(23), i, j, x, y, t;
    var pals = [
      ["#f9d3de", "#f2a9c0", "#c8587f"],
      ["#f3b3c6", "#e98aa8", "#b2416b"],
      ["#fff2f2", "#fbd9df", "#d27a95"],
      ["#fbc4cf", "#f59fb2", "#c4506f"],
      ["#ffffff", "#fdf0f2", "#e7a9ba"]
    ];
    var greens = ["#6f9e6a", "#8fb98a", "#4f7f57", "#a7c79a"];
    function pk(a) { return a[Math.floor(r() * a.length)]; }

    // the arch opening: legs at x=40/560, springing at y=290, cusped up to a point at (300, 40)
    function bez(p0, p1, p2, p3, u) {
      var v = 1 - u;
      return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
              v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
    }
    var L = [[40, 290], [40, 150], [180, 96], [300, 40]];
    var pts = [], N = 10;
    for (i = 0; i <= N; i++) pts.push(bez(L[0], L[1], L[2], L[3], i / N));
    var edge = "M40 400 V290";
    for (i = 1; i <= N; i++) {
      var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      edge += " A" + f1(d * .56) + " " + f1(d * .56) + " 0 0 0 " + f1(pts[i][0]) + " " + f1(pts[i][1]);
    }
    for (i = N - 1; i >= 0; i--) {
      var d2 = Math.hypot(pts[i][0] - pts[i + 1][0], pts[i][1] - pts[i + 1][1]);
      edge += " A" + f1(d2 * .56) + " " + f1(d2 * .56) + " 0 0 0 " + f1(600 - pts[i][0]) + " " + f1(pts[i][1]);
    }
    edge += " V400";

    var svg = '<svg class="deco-top" viewBox="0 0 600 400" aria-hidden="true">' +
      '<defs><pattern id="vm-jaali" width="18" height="18" patternUnits="userSpaceOnUse">' +
      '<path d="M9 0 L18 9 L9 18 L0 9z" fill="none" stroke="rgba(184,134,43,.38)" stroke-width=".7"/>' +
      '<circle cx="9" cy="9" r="1.1" fill="rgba(201,151,58,.6)"/></pattern>' +
      '<linearGradient id="vm-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8862b"/><stop offset=".35" stop-color="#f7e3a1"/>' +
      '<stop offset=".6" stop-color="#c9973a"/><stop offset="1" stop-color="#f3d98f"/></linearGradient></defs>' +
      // carved spandrels
      '<path d="M0 0 H600 V400 H0 Z ' + edge + ' Z" fill="#f8e1e6" fill-rule="evenodd"/>' +
      '<path d="M0 0 H600 V400 H0 Z ' + edge + ' Z" fill="url(#vm-jaali)" fill-rule="evenodd"/>' +
      // gold arch outline, double
      '<path d="' + edge + '" fill="none" stroke="url(#vm-gold)" stroke-width="3.2"/>' +
      '<path d="' + edge + '" fill="none" stroke="#f3d98f" stroke-width=".8" stroke-dasharray="1 3" transform="translate(0 7) scale(1)" opacity=".8"/>';
    // jewels at the cusps
    for (i = 1; i < N; i++) {
      [[pts[i][0], pts[i][1]], [600 - pts[i][0], pts[i][1]]].forEach(function (p) {
        svg += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="2.6" fill="#f7e3a1"/><circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="1.2" fill="#d9668c"/>';
      });
    }
    // finial at the point of the arch
    svg += '<g transform="translate(300 40)"><path d="M0 -24 C6 -16 8 -8 0 0 C-8 -8 -6 -16 0 -24z" fill="url(#vm-gold)"/>' +
      '<circle cy="-28" r="3" fill="#f7e3a1"/><circle cy="-10" r="2.4" fill="#d9668c"/></g>';

    // rose & jasmine strands hanging inside the arch, near the legs
    [[52, 250, 400], [66, 236, 350], [534, 236, 350], [548, 250, 400]].forEach(function (s) {
      x = s[0];
      svg += '<line x1="' + x + '" y1="' + s[1] + '" x2="' + x + '" y2="' + s[2] + '" stroke="rgba(184,134,43,.5)" stroke-width=".6"/>';
      for (y = s[1] + 8, j = 0; y < s[2]; y += 11, j++) {
        if (j % 4 === 3) {
          svg += '<circle cx="' + (x - 2) + '" cy="' + f1(y) + '" r="2.5" fill="#fffaf0"/><circle cx="' + (x + 2) + '" cy="' + f1(y + 2) + '" r="2.3" fill="#fffdf7"/>';
        } else {
          var pl = pk(pals);
          svg += '<circle cx="' + x + '" cy="' + f1(y) + '" r="4.6" fill="' + pl[1] + '" stroke="' + pl[0] + '" stroke-width="2.2" stroke-dasharray="1.5 1.2"/>';
        }
      }
      svg += '<path d="M' + x + " " + (s[2] - 2) + ' q -5 9 0 15 q 5 -6 0 -15z" fill="#e8c766"/>';
    });

    // floral cascades from both top corners
    [[0, 1], [600, -1]].forEach(function (side) {
      var ox = side[0], sx = side[1];
      for (i = 0; i < 38; i++) {
        t = r();
        x = ox + sx * (r() * (210 - t * 140));
        y = 6 + t * 170 + r() * 20;
        svg += leaf(x, y, 18 + r() * 16, r() * 360, pk(greens));
      }
      for (i = 0; i < 16; i++) {
        t = r();
        x = ox + sx * (8 + r() * (190 - t * 150));
        y = 10 + t * 150;
        svg += peony(x, y, 15 + r() * 13 - t * 6, pk(pals), r() * 360);
      }
      for (i = 0; i < 26; i++) { // buds and baby's breath
        t = r();
        svg += '<circle cx="' + f1(ox + sx * r() * (200 - t * 150)) + '" cy="' + f1(6 + t * 180) + '" r="' + f1(1.4 + r() * 1.8) + '" fill="' + (i % 3 ? "#fffaf3" : "#f6b6c9") + '"/>';
      }
    });
    svg += "</svg>";

    // lotus pond along the bottom
    var bot = '<svg class="deco-bottom" viewBox="0 0 600 110" aria-hidden="true">' +
      '<path d="M0 92 Q150 84 300 92 T600 92 V110 H0z" fill="#f8e1e6"/>' +
      '<path d="M0 92 Q150 84 300 92 T600 92" fill="none" stroke="url(#vm-gold)" stroke-width="2"/>';
    for (i = 0; i < 3; i++) {
      bot += '<path d="M' + (30 + i * 12) + " " + (99 + i * 4) + " q 20 -4 40 0 t 40 0 M" + (460 - i * 12) + " " + (99 + i * 4) +
        ' q 20 -4 40 0 t 40 0" fill="none" stroke="rgba(184,134,43,.55)" stroke-width=".8"/>';
    }
    [[22, 92, 30], [96, 96, 20], [504, 96, 20], [578, 92, 30]].forEach(function (p) {
      bot += '<path d="M' + p[0] + " " + p[1] + " a" + p[2] + " " + f1(p[2] * .3) + " 0 1 0 " + f1(p[2] * .9) + ' -3z" fill="#4f7f57" stroke="#2f5a3a" stroke-width=".8" transform="translate(' + f1(-p[2] * .45) + ' 0)"/>';
    });
    bot += '<path d="M60 90 Q58 60 70 44" fill="none" stroke="#4f7f57" stroke-width="2"/><path d="M540 90 Q542 60 530 44" fill="none" stroke="#4f7f57" stroke-width="2"/>' +
      '<path d="M70 44 C64 36 66 26 72 20 C78 28 78 38 70 44z" fill="#ec8fae" stroke="#b8466e" stroke-width=".6"/>' +
      '<path d="M530 44 C536 36 534 26 528 20 C522 28 522 38 530 44z" fill="#ec8fae" stroke="#b8466e" stroke-width=".6"/>' +
      lotus(30, 88, 40) + lotus(570, 88, 40) + lotus(124, 93, 22) + lotus(476, 93, 22) + "</svg>";

    var bits = '<span class="vm-side left"></span><span class="vm-side right"></span><span class="vm-glow"></span>';
    for (i = 0; i < 14; i++) {
      bits += '<span class="bokeh" style="left:' + f1(10 + r() * 80) + "%;top:" + f1(25 + r() * 65) + "%;--s:" +
        (0.4 + r() * 0.8).toFixed(2) + ";--c:rgba(240,190,140,.35);animation-delay:-" + f1(r() * 7) + 's"></span>';
    }
    var pcols = ["#f9c5d4", "#f2a2bb", "#fbe0e7", "#e98aa8", "#fff4f4"];
    for (i = 0; i < 34; i++) {
      bits += '<span class="petal" style="left:' + f1(r() * 100) + "%;animation-delay:-" + f1(r() * 16) +
        "s;animation-duration:" + f1(9 + r() * 9) + "s;--s:" + (0.55 + r() * 0.8).toFixed(2) + ";--c:" + pcols[i % 5] + '"></span>';
    }
    return '<div class="deco" aria-hidden="true">' + bits + svg + bot + "</div>";
  }

  /* ---------- couple illustrations (faceless, stylized) ---------- */
  var SKIN = "#d9a07a", HAIR = "#2a1a14";

  // Sangeet: the couple mid-dance, her hand raised in his.
  function sceneSangeet() {
    var r = rng(5), i, dots = "";
    for (i = 0; i < 90; i++) {
      dots += '<circle cx="' + f1(40 + r() * 150) + '" cy="' + f1(110 + r() * 170) + '" r="' + f1(0.6 + r() * 1.3) +
        '" fill="' + (i % 4 ? "#dbe4ff" : "#f9d77e") + '" class="twinkle" style="animation-delay:-' + f1(r() * 3) + 's"/>';
    }
    var coatDots = "";
    for (i = 0; i < 40; i++) {
      coatDots += '<circle cx="' + f1(170 + r() * 42) + '" cy="' + f1(76 + r() * 112) + '" r="' + f1(0.5 + r() * 0.9) + '" fill="#c7d2fe" opacity=".7"/>';
    }
    var LEH = "M103 117 Q112 120 122 117 C136 160 158 215 182 262 Q116 282 44 262 C68 215 88 160 103 117 Z";
    var COAT = "M172 78 Q190 72 208 78 L210 186 Q190 192 172 186 Z";
    return '<svg viewBox="0 0 300 290" aria-hidden="true">' +
      '<defs><linearGradient id="sc-leh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3c82"/><stop offset="1" stop-color="#121a45"/></linearGradient>' +
      '<clipPath id="sc-lehc"><path d="' + LEH + '"/></clipPath><clipPath id="sc-coatc"><path d="' + COAT + '"/></clipPath>' +
      '<radialGradient id="sc-floor"><stop offset="0" stop-color="#ff9fd0" stop-opacity=".75"/><stop offset="1" stop-color="#ff9fd0" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="150" cy="270" rx="135" ry="16" fill="url(#sc-floor)"/>' +
      // her dupatta, flowing behind
      '<path d="M102 84 C78 100 58 140 40 196 C36 214 44 226 54 228 C58 190 76 140 104 100 Z" fill="rgba(226,232,255,.78)" stroke="rgba(255,255,255,.6)" stroke-width=".8"/>' +
      // his legs (churidar), one kicked out
      '<path d="M181 184 L176 226 L171 264" fill="none" stroke="#f3eee6" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M201 184 Q220 212 236 230" fill="none" stroke="#f3eee6" stroke-width="11" stroke-linecap="round"/>' +
      '<ellipse cx="167" cy="268" rx="9" ry="4" fill="#1a1530"/><ellipse cx="240" cy="234" rx="8" ry="4" fill="#1a1530" transform="rotate(35 240 234)"/>' +
      // his sherwani
      '<path d="' + COAT + '" fill="#1b2550" stroke="#3b4a8a" stroke-width="1"/>' +
      '<g clip-path="url(#sc-coatc)">' + coatDots + "</g>" +
      '<path d="M190 76 V186" stroke="#3b4a8a" stroke-width="1"/>' +
      [86, 98, 110, 122, 134, 146, 158, 170].map(function (y) { return '<circle cx="190" cy="' + y + '" r="1.6" fill="#f3d9a4"/>'; }).join("") +
      // his head
      '<rect x="187" y="66" width="7" height="12" fill="' + SKIN + '"/>' +
      '<circle cx="190" cy="58" r="12.5" fill="' + SKIN + '"/>' +
      '<path d="M177 60 Q176 44 191 43 Q205 44 203 58 Q197 50 187 52 Q180 54 177 62 Z" fill="' + HAIR + '"/>' +
      // his arms: one raised to hold her hand, one out
      '<path d="M175 84 Q150 58 109 30" fill="none" stroke="#1b2550" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M206 84 Q228 106 238 93" fill="none" stroke="#1b2550" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="240" cy="91" r="3.8" fill="' + SKIN + '"/>' +
      // her lehenga with sparkle
      '<path d="' + LEH + '" fill="url(#sc-leh)"/>' +
      '<g clip-path="url(#sc-lehc)">' + dots +
      '<path d="M70 210 Q112 226 160 210 M58 236 Q112 254 172 236" fill="none" stroke="rgba(199,210,254,.45)" stroke-width="1.2"/></g>' +
      '<path d="M44 262 Q116 282 182 262" fill="none" stroke="#e0e7ff" stroke-width="5" stroke-linecap="round"/>' +
      // her blouse and midriff
      '<path d="M104 112 Q112 115 121 112 L121 119 L104 119 Z" fill="' + SKIN + '"/>' +
      '<path d="M100 82 Q112 78 124 82 L121 112 Q112 115 104 112 Z" fill="#22306b" stroke="#c7d2fe" stroke-width=".8"/>' +
      // her arms: one raised into his hand, one at her waist
      '<path d="M102 86 Q92 60 105 31" fill="none" stroke="' + SKIN + '" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M97 52 l6 2 M96 57 l6 2" stroke="#f3d9a4" stroke-width="1.6"/>' +
      '<circle cx="107" cy="29" r="4" fill="' + SKIN + '"/>' +
      '<path d="M123 86 Q135 100 126 114" fill="none" stroke="' + SKIN + '" stroke-width="5" stroke-linecap="round"/>' +
      // her head
      '<rect x="109" y="72" width="6" height="11" fill="' + SKIN + '"/>' +
      '<circle cx="112" cy="64" r="12" fill="' + SKIN + '"/>' +
      '<path d="M100 66 Q98 50 112 50 Q126 50 124 62 Q118 56 108 58 Q103 61 102 72 Z" fill="' + HAIR + '"/>' +
      '<circle cx="100" cy="56" r="6.5" fill="' + HAIR + '"/>' +
      '<circle cx="101.5" cy="73" r="1.8" fill="#f3d9a4"/>' +
      "</svg>";
  }

  // Haldi: the couple seated together on a low piri, haldi bowls in front.
  function sceneHaldi() {
    var r = rng(9), i, smudge = "", petals = "";
    [[107, 92, 2.6], [119, 96, 2], [112, 100, 1.6], [182, 84, 2.6], [195, 88, 2.2], [176, 122, 3], [196, 140, 2.6], [110, 124, 2.4]]
      .forEach(function (s) { smudge += '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#f59e0b" opacity=".85"/>'; });
    for (i = 0; i < 16; i++) {
      petals += marigold(30 + r() * 240, 222 + r() * 16, 3.5 + r() * 2, i % 2 ? "#f59e0b" : "#fbbf24", i % 2 ? "#fbbf24" : "#fde68a");
    }
    function bowl(cx) {
      return '<ellipse cx="' + cx + '" cy="214" rx="27" ry="9" fill="#c8901a" stroke="#8a5a0a" stroke-width="1.2"/>' +
        '<ellipse cx="' + cx + '" cy="211" rx="21" ry="5.5" fill="#f5a30b"/>' +
        '<path d="M' + (cx - 27) + ' 214 Q' + cx + ' 236 ' + (cx + 27) + ' 214" fill="#b07a12"/>' +
        marigold(cx - 8, 209, 3.5, "#ea580c", "#fb923c") + marigold(cx + 7, 210, 3.2, "#f59e0b", "#fde047");
    }
    return '<svg viewBox="38 58 224 184" aria-hidden="true">' +
      // low decorated seat
      '<rect x="44" y="192" width="212" height="22" rx="5" fill="#b45309"/>' +
      '<rect x="44" y="192" width="212" height="5" rx="2" fill="#d97706"/>' +
      // her long hair behind
      '<path d="M98 86 Q92 124 100 160 L128 160 Q133 122 128 86 Z" fill="' + HAIR + '"/>' +
      // her lehenga, seated
      '<path d="M100 136 Q113 140 126 136 Q168 166 166 200 Q113 212 60 200 Q60 166 100 136 Z" fill="#fde047" stroke="#f97316" stroke-width="2"/>' +
      '<path d="M66 196 Q113 206 162 196" fill="none" stroke="#ea580c" stroke-width="3"/>' +
      // her blouse and dupatta
      '<path d="M98 108 Q113 102 128 108 L126 138 Q113 141 100 138 Z" fill="#facc15" stroke="#ea580c" stroke-width="1"/>' +
      '<path d="M126 106 Q144 132 134 178 L122 178 Q130 140 119 110 Z" fill="#fb923c"/>' +
      // her arm to her lap
      '<path d="M100 112 Q86 142 104 168" fill="none" stroke="' + SKIN + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M90 146 l7 -2 M90 151 l7 -2" stroke="#ea580c" stroke-width="1.8"/>' +
      // her head
      '<rect x="109" y="96" width="8" height="12" fill="' + SKIN + '"/>' +
      '<circle cx="113" cy="88" r="14" fill="' + SKIN + '"/>' +
      '<path d="M99 90 Q98 72 113 72 Q128 72 127 88 Q120 80 110 81 Q102 84 100 96 Z" fill="' + HAIR + '"/>' +
      marigold(126, 77, 4.5, "#f59e0b", "#fde047") + marigold(119, 73, 3.6, "#ea580c", "#fb923c") +
      '<circle cx="100" cy="99" r="2" fill="#f3d9a4"/>' +
      // his kurta
      '<path d="M166 100 Q188 92 210 100 L214 170 Q188 178 162 170 Z" fill="#fcd34d" stroke="#ea580c" stroke-width="1"/>' +
      '<path d="M188 96 V136" stroke="#ea580c" stroke-width="1.2"/>' +
      [104, 114, 124].map(function (y) { return '<circle cx="188" cy="' + y + '" r="1.5" fill="#b45309"/>'; }).join("") +
      // his legs, cross-legged
      '<path d="M150 196 Q152 168 176 166 L206 166 Q236 170 238 196 Q194 206 150 196 Z" fill="#fff7e0" stroke="#e7d7a8" stroke-width="1"/>' +
      '<path d="M172 184 Q194 176 220 186" fill="none" stroke="#e7d7a8" stroke-width="1.4"/>' +
      // his head
      '<rect x="184" y="90" width="9" height="12" fill="' + SKIN + '"/>' +
      '<circle cx="188" cy="80" r="15" fill="' + SKIN + '"/>' +
      '<path d="M173 80 Q172 63 188 63 Q204 63 203 78 Q196 70 186 71 Q178 73 174 85 Z" fill="' + HAIR + '"/>' +
      '<path d="M176 86 Q188 101 200 86 Q199 98 188 99 Q177 98 176 86 Z" fill="#3b2a22"/>' +
      // his arm around her shoulder, other hand on his knee
      '<path d="M169 106 Q148 102 129 109" fill="none" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="127" cy="110" r="4.5" fill="' + SKIN + '"/>' +
      '<path d="M210 106 Q228 138 216 166" fill="none" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="215" cy="169" r="4.5" fill="' + SKIN + '"/>' +
      smudge + bowl(86) + bowl(214) + petals +
      "</svg>";
  }

  // A rose-and-jasmine varmala hanging between two points (a quadratic sag).
  function varmala(ax, ay, bx, by, cx, cy, n, seed) {
    var r = rng(seed), s = "", k, u, v, x, y;
    var roses = [["#f3b3c6", "#c8587f"], ["#e98aa8", "#a83c66"], ["#fbd3de", "#d27a95"]];
    s += '<path d="M' + ax + " " + ay + " Q" + cx + " " + cy + " " + bx + " " + by + '" fill="none" stroke="#7a5a2a" stroke-width="1"/>';
    for (k = 0; k <= n; k++) {
      u = k / n; v = 1 - u;
      x = v * v * ax + 2 * v * u * cx + u * u * bx;
      y = v * v * ay + 2 * v * u * cy + u * u * by;
      if (k % 5 === 2) {
        s += leaf(x - 1, y, 9, 120 + r() * 40, "#6f9e6a") + leaf(x + 1, y, 9, 20 + r() * 40, "#4f7f57");
      } else if (k % 5 === 4) {
        s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="2.6" fill="#fffaf2" stroke="#efe2c8" stroke-width=".5"/>';
      } else {
        var p = roses[Math.floor(r() * 3)];
        s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="3.6" fill="' + p[0] + '" stroke="' + p[1] + '" stroke-width="1.6" stroke-dasharray="1.4 1"/>';
      }
    }
    // tassel at the bottom of the loop
    u = .5; v = .5;
    x = v * v * ax + 2 * v * u * cx + u * u * bx; y = v * v * ay + 2 * v * u * cy + u * u * by;
    s += '<path d="M' + f1(x) + " " + f1(y + 3) + " v9" + '" stroke="#c9973a" stroke-width="1"/>' +
      '<circle cx="' + f1(x) + '" cy="' + f1(y + 13) + '" r="3.4" fill="#e98aa8" stroke="#a83c66" stroke-width="1"/>' +
      '<path d="M' + f1(x - 2.5) + " " + f1(y + 16) + " l2.5 7 l2.5 -7" + '" fill="#e8c766"/>';
    return s;
  }

  // Varmala: the couple face each other, each lifting a garland for the other.
  function sceneVarmala() {
    var r = rng(31), i, zari = "", coat = "";
    for (i = 0; i < 70; i++) {
      zari += '<circle cx="' + f1(40 + r() * 140) + '" cy="' + f1(140 + r() * 100) + '" r="' + f1(.5 + r() * .9) + '" fill="#f7e3a1" opacity=".85"/>';
    }
    for (i = 0; i < 26; i++) {
      coat += '<circle cx="' + f1(176 + r() * 46) + '" cy="' + f1(90 + r() * 110) + '" r="' + f1(.5 + r() * .7) + '" fill="#c9973a" opacity=".7"/>';
    }
    var LEH = "M96 128 Q109 132 122 128 C140 165 160 205 176 244 Q109 260 42 244 C58 205 78 165 96 128 Z";
    var COAT = "M182 84 Q198 78 214 84 L224 204 Q198 212 172 204 Z";
    return '<svg viewBox="26 14 248 254" aria-hidden="true">' +
      '<defs><radialGradient id="vm-halo"><stop offset="0" stop-color="#f2b8c6" stop-opacity=".7"/><stop offset=".6" stop-color="#f6cdd7" stop-opacity=".3"/>' +
      '<stop offset="1" stop-color="#f6cdd7" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="vm-leh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ec8fab"/><stop offset="1" stop-color="#b83a63"/></linearGradient>' +
      '<clipPath id="vm-lehc"><path d="' + LEH + '"/></clipPath><clipPath id="vm-coatc"><path d="' + COAT + '"/></clipPath></defs>' +
      // the full moon behind them, pichwai style
      '<circle cx="150" cy="120" r="118" fill="url(#vm-halo)"/>' +
      '<circle cx="150" cy="104" r="70" fill="none" stroke="rgba(184,134,43,.6)" stroke-width="1"/>' +
      '<circle cx="150" cy="104" r="64" fill="none" stroke="rgba(184,134,43,.45)" stroke-width=".6" stroke-dasharray="2 3"/>' +
      // dais
      '<path d="M18 250 Q150 238 282 250 L276 262 Q150 254 24 262 Z" fill="#c9973a"/>' +
      '<path d="M24 262 Q150 254 276 262" fill="none" stroke="#7a5a2a" stroke-width="1"/>' +

      // ---- groom (right, facing left) ----
      // safa tail down his back
      '<path d="M210 52 Q226 80 222 132 L214 132 Q216 88 204 60 Z" fill="#e98aa8"/>' +
      // legs and juttis
      '<rect x="184" y="200" width="11" height="44" fill="#f6efe0"/><rect x="201" y="200" width="11" height="44" fill="#f6efe0"/>' +
      '<path d="M178 246 h18 v-4 h-12 q-6 0 -8 4z" fill="#c9973a"/><path d="M200 246 h18 q-2 -4 -8 -4 h-10z" fill="#c9973a"/>' +
      // sherwani
      '<path d="' + COAT + '" fill="#fbf3e2" stroke="#b8925a" stroke-width="1.2"/>' +
      '<g clip-path="url(#vm-coatc)">' + coat + '<path d="M172 196 Q198 204 224 196" stroke="#c9973a" stroke-width="5" fill="none"/></g>' +
      '<path d="M198 82 V204" stroke="#c9a76a" stroke-width="1"/>' +
      [94, 106, 118, 130, 142].map(function (y) { return '<circle cx="198" cy="' + y + '" r="1.6" fill="#c9973a"/>'; }).join("") +
      // pink stole over one shoulder
      '<path d="M206 82 Q192 120 178 170 L186 172 Q198 124 214 88 Z" fill="#e98aa8" opacity=".95"/>' +
      // neck, head, beard
      '<rect x="194" y="70" width="8" height="14" fill="' + SKIN + '"/>' +
      '<circle cx="197" cy="60" r="13" fill="' + SKIN + '"/>' +
      '<path d="M185 64 Q197 78 209 64 Q208 74 197 75 Q186 74 185 64 Z" fill="#3b2a22"/>' +
      // safa (turban) with brooch and kalgi
      '<path d="M182 56 Q180 38 197 36 Q215 37 213 56 Q197 48 182 56 Z" fill="#e98aa8"/>' +
      '<path d="M183 50 Q197 42 212 50 M184 44 Q197 37 210 44" fill="none" stroke="#c8587f" stroke-width="1.4"/>' +
      '<circle cx="190" cy="44" r="3" fill="#f7e3a1" stroke="#c9973a"/><circle cx="190" cy="44" r="1.2" fill="#2f6b4a"/>' +
      '<path d="M190 41 Q184 26 192 18 Q190 30 192 41z" fill="#fff6e6" stroke="#e8c766" stroke-width=".6"/>' +
      // his arms, raised towards her, holding his garland
      '<path d="M186 90 Q160 84 140 62" fill="none" stroke="#f3e6cc" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M210 92 Q196 70 168 50" fill="none" stroke="#f3e6cc" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="138" cy="60" r="4" fill="' + SKIN + '"/><circle cx="166" cy="48" r="4" fill="' + SKIN + '"/>' +

      // ---- bride (left, facing right) ----
      // veil falling down her back
      '<path d="M100 56 Q84 90 70 170 Q60 220 64 238 L84 236 Q82 170 102 110 Z" fill="rgba(247,180,199,.72)" stroke="#e8c766" stroke-width="1.4"/>' +
      // lehenga with zari
      '<path d="' + LEH + '" fill="url(#vm-leh)"/>' +
      '<g clip-path="url(#vm-lehc)">' + zari +
      '<path d="M56 214 Q109 226 164 214" fill="none" stroke="#e8c766" stroke-width="1.5"/>' +
      '<path d="M40 240 Q109 256 178 240" fill="none" stroke="#e8c766" stroke-width="6"/>' +
      '<path d="M40 240 Q109 256 178 240" fill="none" stroke="#c8587f" stroke-width="1.2" stroke-dasharray="2 3"/></g>' +
      // blouse and midriff
      '<path d="M97 122 Q109 126 121 122 L122 129 L96 129 Z" fill="' + SKIN + '"/>' +
      '<path d="M93 92 Q109 86 125 92 L121 122 Q109 126 97 122 Z" fill="#e17a99" stroke="#e8c766" stroke-width="1"/>' +
      // neck, head, jewellery
      '<rect x="105" y="78" width="7" height="14" fill="' + SKIN + '"/>' +
      '<circle cx="108" cy="68" r="12" fill="' + SKIN + '"/>' +
      '<path d="M98 88 Q108 98 118 88" fill="none" stroke="#e8c766" stroke-width="2.4"/>' +
      '<circle cx="108" cy="96" r="2" fill="#d9668c" stroke="#e8c766"/>' +
      // hair and the veil over her head
      '<path d="M96 70 Q95 54 108 53 Q121 54 120 66 Q113 60 104 62 Q99 64 98 76 Z" fill="' + HAIR + '"/>' +
      '<path d="M94 74 Q90 48 108 46 Q124 46 124 60 Q114 52 104 54 Q96 58 96 80 Z" fill="rgba(247,180,199,.85)" stroke="#e8c766" stroke-width="1.4"/>' +
      '<circle cx="108" cy="57" r="2.2" fill="#f7e3a1"/><circle cx="108" cy="60.5" r="1.4" fill="#d9668c"/>' +
      // her arms, raised towards him, holding her garland
      '<path d="M120 96 Q140 86 154 64" fill="none" stroke="' + SKIN + '" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M96 98 Q110 76 128 66" fill="none" stroke="' + SKIN + '" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M139 82 l5 -4 M142 86 l5 -4" stroke="#e8c766" stroke-width="1.6"/>' +
      '<circle cx="155" cy="62" r="3.6" fill="' + SKIN + '"/><circle cx="129" cy="65" r="3.6" fill="' + SKIN + '"/>' +

      // the two garlands, crossing between them
      varmala(129, 64, 155, 61, 140, 132, 26, 3) +
      varmala(138, 59, 166, 47, 156, 122, 26, 4) +
      "</svg>";
  }

  // A henna paisley (bota), drawn in gold line, tip curling at the top.
  function paisley(x, y, s, rot) {
    return '<g transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + (rot || 0) + ") scale(" + s + ')" fill="none" stroke="url(#mh-gold)" stroke-linecap="round">' +
      '<path d="M0 30 C-22 30 -26 4 -10 -10 C0 -18 8 -26 4 -38 C22 -26 26 -2 18 14 C12 26 6 30 0 30z" stroke-width="1.6"/>' +
      '<path d="M0 22 C-14 22 -16 6 -6 -3 C1 -9 6 -14 5 -22 C15 -13 16 0 12 10 C8 18 4 22 0 22z" stroke-width="1"/>' +
      '<circle cx="2" cy="6" r="4" stroke-width="1"/><circle cx="2" cy="6" r="1.4" fill="#e8c766" stroke="none"/>' +
      '<path d="M-8 16 l-4 4 M-12 8 l-5 2 M-12 -1 l-5 -1" stroke-width=".9"/>' +
      [[-22, 22], [-26, 8], [-22, -6], [-13, -18], [26, 12], [28, -4], [22, -18]].map(function (d) {
        return '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="1.1" fill="#e8c766" stroke="none"/>';
      }).join("") + "</g>";
  }

  // Concentric henna mandala in gold line, centred on (cx, cy).
  function mandala(cx, cy, R) {
    var s = '<g transform="translate(' + f1(cx) + " " + f1(cy) + ')" fill="none" stroke="url(#mh-gold)">', k, a, n;
    s += '<circle r="' + f1(R * .14) + '" stroke-width="1.4"/><circle r="' + f1(R * .06) + '" fill="#e8c766" stroke="none"/>';
    for (k = 0; k < 12; k++) { // inner petals
      a = k * 30;
      s += '<path d="M0 ' + f1(-R * .16) + " C" + f1(R * .08) + " " + f1(-R * .24) + " " + f1(R * .06) + " " + f1(-R * .34) + " 0 " + f1(-R * .4) +
        " C" + f1(-R * .06) + " " + f1(-R * .34) + " " + f1(-R * .08) + " " + f1(-R * .24) + " 0 " + f1(-R * .16) + 'z" stroke-width="1.1" transform="rotate(' + a + ')"/>';
    }
    s += '<circle r="' + f1(R * .46) + '" stroke-width="1"/><circle r="' + f1(R * .5) + '" stroke-width=".7" stroke-dasharray="1 3"/>';
    n = 24;
    for (k = 0; k < n; k++) { // scallop ring
      a = k * 360 / n;
      s += '<path d="M' + f1(-R * .066) + " " + f1(-R * .52) + " A" + f1(R * .066) + " " + f1(R * .066) + " 0 0 1 " + f1(R * .066) + " " + f1(-R * .52) +
        '" stroke-width="1" transform="rotate(' + a + ')"/><circle cy="' + f1(-R * .62) + '" r="1.2" fill="#e8c766" stroke="none" transform="rotate(' + a + ')"/>';
    }
    n = 16;
    for (k = 0; k < n; k++) { // outer leaf petals with veins
      a = k * 360 / n;
      s += '<g transform="rotate(' + a + ')"><path d="M0 ' + f1(-R * .66) + " C" + f1(R * .16) + " " + f1(-R * .74) + " " + f1(R * .14) + " " + f1(-R * .9) + " 0 " + f1(-R) +
        " C" + f1(-R * .14) + " " + f1(-R * .9) + " " + f1(-R * .16) + " " + f1(-R * .74) + " 0 " + f1(-R * .66) + 'z" stroke-width="1.3"/>' +
        '<path d="M0 ' + f1(-R * .7) + " V" + f1(-R * .93) + '" stroke-width=".7"/>' +
        '<circle cy="' + f1(-R * 1.06) + '" r="1.5" fill="#e8c766" stroke="none"/></g>';
    }
    return s + "</g>";
  }

  // Mehendi: gilded henna on emerald — a rising gold mandala, paisleys,
  // tree-of-life vines down both sides and a henna border below.
  function decoMehendi() {
    var r = rng(41), i;
    var gold = '<linearGradient id="mh-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8862b"/><stop offset=".35" stop-color="#f7e3a1"/>' +
      '<stop offset=".65" stop-color="#c9973a"/><stop offset="1" stop-color="#f3d98f"/></linearGradient>';
    var svg = '<svg class="deco-top" viewBox="0 0 600 260" aria-hidden="true"><defs>' + gold + "</defs>" +
      mandala(300, -6, 118) +
      paisley(96, 44, 1.25, -40) + paisley(504, 44, 1.25, 40) +
      // dotted henna swags along the top edge
      '<path d="M60 14 Q120 40 170 16 M430 16 Q480 40 540 14" fill="none" stroke="url(#mh-gold)" stroke-width="1" stroke-dasharray="1 4" stroke-linecap="round"/>' +
      [150, 450].map(function (x) {
        return '<g transform="translate(' + x + ' 14)">' +
          '<path d="M0 0 v18" stroke="#c9973a" stroke-width=".8"/>' +
          '<path d="M0 18 c-6 6 -6 14 0 20 c6 -6 6 -14 0 -20z" fill="none" stroke="url(#mh-gold)" stroke-width="1.2"/>' +
          '<circle cy="28" r="1.8" fill="#e8c766"/><circle cy="44" r="2.4" fill="#e8c766"/></g>';
      }).join("") +
      "</svg>";

    var bot = '<svg class="deco-bottom" viewBox="0 0 600 120" aria-hidden="true"><defs>' +
      '<linearGradient id="mh-gold2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8862b"/><stop offset=".4" stop-color="#f7e3a1"/><stop offset="1" stop-color="#c9973a"/></linearGradient></defs>' +
      '<g fill="none" stroke="url(#mh-gold2)" stroke-linecap="round">' +
      '<path d="M60 108 H540" stroke-width="1.4"/><path d="M60 100 H540" stroke-width=".7" stroke-dasharray="1 4"/>';
    for (i = 0; i < 20; i++) {
      var x = 75 + i * 23.7;
      bot += '<path d="M' + f1(x - 10) + " 108 A10 10 0 0 1 " + f1(x + 10) + ' 108" stroke-width="1"/><circle cx="' + f1(x) + '" cy="94" r="1.1" fill="#e8c766" stroke="none"/>';
    }
    bot += "</g>" + paisley(96, 74, 1.05, -140).replace(/mh-gold\)/g, "mh-gold2)") + paisley(504, 74, 1.05, 140).replace(/mh-gold\)/g, "mh-gold2)") +
      mandala(300, 128, 54).replace(/mh-gold\)/g, "mh-gold2)") + "</svg>";

    var bits = '<span class="mh-side left"></span><span class="mh-side right"></span><span class="mh-glow"></span>';
    for (i = 0; i < 12; i++) {
      bits += '<span class="bokeh" style="left:' + f1(12 + r() * 76) + "%;top:" + f1(20 + r() * 70) + "%;--s:" +
        (0.4 + r() * 0.8).toFixed(2) + ";--c:rgba(247,227,161,.28);animation-delay:-" + f1(r() * 7) + 's"></span>';
    }
    for (i = 0; i < 46; i++) {
      bits += '<span class="glint" style="left:' + f1(10 + r() * 80) + "%;top:" + f1(4 + r() * 92) + "%;animation-delay:-" + f1(r() * 4) +
        "s;--s:" + (0.5 + r()).toFixed(2) + '"></span>';
    }
    return '<div class="deco" aria-hidden="true">' + bits + svg + bot + "</div>";
  }

  // A raised palm with henna: fingers up, a mandala in the middle.
  function hennaPalm(cx, cy, flip) {
    var H = "#8a3b12", s = '<g transform="translate(' + cx + " " + cy + ")" + (flip ? " scale(-1 1)" : "") + '">';
    s += '<rect x="-9" y="-28" width="4.6" height="17" rx="2.3" fill="' + SKIN + '"/>' +
      '<rect x="-4" y="-31" width="4.6" height="20" rx="2.3" fill="' + SKIN + '"/>' +
      '<rect x="1" y="-30" width="4.6" height="19" rx="2.3" fill="' + SKIN + '"/>' +
      '<rect x="6" y="-25" width="4.4" height="15" rx="2.2" fill="' + SKIN + '"/>' +
      '<path d="M-9 -4 q -9 -6 -10 -14 q 4 -2 7 3 l 4 6z" fill="' + SKIN + '"/>' +
      '<path d="M-10 -14 Q-11 6 0 9 Q11 6 10 -14 Z" fill="' + SKIN + '"/>';
    // henna: fingertip caps, finger lines, palm mandala, wrist band
    [[-6.7, -26], [-1.7, -29], [3.3, -28], [8.2, -23]].forEach(function (f) {
      s += '<rect x="' + (f[0] - 2.3) + '" y="' + f[1] + '" width="4.6" height="4" rx="2" fill="' + H + '"/>' +
        '<path d="M' + (f[0] - 1.6) + " " + (f[1] + 7) + " h3.2 M" + (f[0] - 1.6) + " " + (f[1] + 10) + ' h3.2" stroke="' + H + '" stroke-width=".7"/>';
    });
    s += '<circle cx="0" cy="-4" r="5.4" fill="none" stroke="' + H + '" stroke-width=".9"/>' +
      '<circle cx="0" cy="-4" r="2.2" fill="' + H + '"/>';
    for (var k = 0; k < 8; k++) {
      s += '<circle cx="' + f1(Math.cos(k * .785) * 7.6) + '" cy="' + f1(-4 + Math.sin(k * .785) * 7.6) + '" r=".8" fill="' + H + '"/>';
    }
    s += '<path d="M-8 6 q 8 4 16 0" fill="none" stroke="' + H + '" stroke-width="1"/></g>';
    return s;
  }

  // Mehendi: the bride alone, seated on a gaddi in a gold henna medallion, showing her hennaed palms.
  function sceneMehendi() {
    var r = rng(43), i, mirrors = "";
    for (i = 0; i < 46; i++) {
      mirrors += '<circle cx="' + f1(52 + r() * 156) + '" cy="' + f1(134 + r() * 60) + '" r="' + f1(.7 + r() * 1.1) + '" fill="' + (i % 3 ? "#f7d774" : "#fffdf4") + '"/>';
    }
    var SKIRT = "M112 126 Q130 130 148 126 Q196 150 214 192 Q130 206 46 192 Q64 150 112 126 Z";
    return '<svg viewBox="22 18 216 200" aria-hidden="true">' +
      '<defs><clipPath id="mh-skirt"><path d="' + SKIRT + '"/></clipPath>' +
      '<radialGradient id="mh-halo"><stop offset="0" stop-color="#f7e3a1" stop-opacity=".42"/><stop offset="1" stop-color="#f7e3a1" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="130" cy="110" rx="108" ry="96" fill="url(#mh-halo)"/>' +
      // henna mandala behind her
      '<circle cx="130" cy="92" r="62" fill="none" stroke="#e8c766" stroke-width=".9" opacity=".7"/>' +
      '<circle cx="130" cy="92" r="56" fill="none" stroke="#e8c766" stroke-width=".7" stroke-dasharray="1.5 3" opacity=".7"/>' +
      Array.apply(null, Array(16)).map(function (_, k) {
        var a = k * Math.PI / 8;
        return '<path d="M' + f1(130 + Math.cos(a) * 62) + " " + f1(92 + Math.sin(a) * 62) + " Q" + f1(130 + Math.cos(a + .1) * 72) + " " + f1(92 + Math.sin(a + .1) * 72) + " " +
          f1(130 + Math.cos(a) * 76) + " " + f1(92 + Math.sin(a) * 76) + " Q" + f1(130 + Math.cos(a - .1) * 72) + " " + f1(92 + Math.sin(a - .1) * 72) + " " +
          f1(130 + Math.cos(a) * 62) + " " + f1(92 + Math.sin(a) * 62) + '" fill="none" stroke="#e8c766" stroke-width=".8" opacity=".7"/>';
      }).join("") +
      // gaddi and bolsters
      '<rect x="34" y="186" width="192" height="22" rx="8" fill="#7a1238"/><rect x="34" y="186" width="192" height="4" rx="2" fill="#f7c948"/>' +
      '<path d="M40 204 h180" stroke="#f7c948" stroke-width="1.4" stroke-dasharray="3 3"/>' +
      '<rect x="24" y="160" width="24" height="44" rx="10" fill="#c2185b" stroke="#f7c948" stroke-width="1.4"/>' +
      '<rect x="212" y="160" width="24" height="44" rx="10" fill="#e08a1e" stroke="#f7c948" stroke-width="1.4"/>' +
      // dupatta behind her shoulders
      '<path d="M114 64 Q96 96 84 170 L176 170 Q164 96 146 64 Z" fill="#f0892a" opacity=".95"/>' +
      // skirt with mirror-work
      '<path d="' + SKIRT + '" fill="#c2185b"/>' +
      '<g clip-path="url(#mh-skirt)">' + mirrors + '<path d="M46 190 Q130 204 214 190" stroke="#f7c948" stroke-width="7" fill="none"/>' +
      '<path d="M46 190 Q130 204 214 190" stroke="#7a1238" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/></g>' +
      // blouse
      '<path d="M114 122 Q130 126 146 122 L147 128 L113 128 Z" fill="' + SKIN + '"/>' +
      '<path d="M110 92 Q130 86 150 92 L146 122 Q130 126 114 122 Z" fill="#e0a92e" stroke="#f7c948" stroke-width="1"/>' +
      // arms: elbows out, forearms up, palms raised
      '<path d="M112 96 Q96 112 98 130" fill="none" stroke="' + SKIN + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M98 130 Q92 112 90 92" fill="none" stroke="' + SKIN + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<path d="M148 96 Q164 112 162 130" fill="none" stroke="' + SKIN + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M162 130 Q168 112 170 92" fill="none" stroke="' + SKIN + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<path d="M86 108 l8 1 M86 112 l8 1 M87 116 l8 1" stroke="#d6246e" stroke-width="1.8"/>' +
      '<path d="M174 108 l-8 1 M174 112 l-8 1 M173 116 l-8 1" stroke="#f7c948" stroke-width="1.8"/>' +
      hennaPalm(90, 88, false) + hennaPalm(170, 88, true) +
      // neck, head, jewellery
      '<rect x="126" y="76" width="8" height="16" fill="' + SKIN + '"/>' +
      '<circle cx="130" cy="66" r="13.5" fill="' + SKIN + '"/>' +
      '<path d="M118 88 Q130 98 142 88" fill="none" stroke="#e0a92e" stroke-width="2.6"/>' +
      '<circle cx="130" cy="96" r="2.2" fill="#d6246e" stroke="#e0a92e"/>' +
      '<path d="M116 68 Q115 50 130 50 Q145 50 144 66 Q137 58 126 59 Q119 61 118 74 Z" fill="' + HAIR + '"/>' +
      '<circle cx="117" cy="76" r="2" fill="#e0a92e"/><circle cx="143" cy="76" r="2" fill="#e0a92e"/>' +
      // dupatta over her head
      '<path d="M113 76 Q108 46 130 42 Q152 46 147 76 Q146 56 130 54 Q114 56 113 76 Z" fill="#f0892a" stroke="#f7c948" stroke-width="1.4"/>' +
      '<circle cx="130" cy="58" r="2.2" fill="#f7c948"/><circle cx="130" cy="61.5" r="1.4" fill="#d6246e"/>' +
      // a henna cone and a bowl of petals at her side
      '<g transform="translate(200 176) rotate(-24)"><path d="M0 0 L6 -24 L-6 -24 Z" fill="#6b3410"/><rect x="-6.5" y="-27" width="13" height="4" rx="1.5" fill="#d6b48a"/></g>' +
      '<ellipse cx="58" cy="184" rx="16" ry="5" fill="#c9973a"/><path d="M42 184 Q58 196 74 184" fill="#a8761f"/>' +
      marigold(52, 181, 3.4, "#f97316", "#fb923c") + marigold(61, 180, 3.2, "#f59e0b", "#fde047") + marigold(66, 183, 2.6, "#e0457b", "#f7a1c0") +
      "</svg>";
  }

  // A filigree corner: acanthus scrolls with small blossoms, champagne line.
  function filigree(tx, ty, sx, sy) {
    var C = "#c8b48f", P = "#f0b7cc";
    var g = '<g transform="translate(' + tx + " " + ty + ") scale(" + sx + " " + sy + ')" fill="none" stroke="' + C + '" stroke-linecap="round">';
    g += '<path d="M6 150 C6 80 30 40 70 22 C100 8 130 8 160 6" stroke-width="1.6"/>' +
      '<path d="M14 120 C18 80 40 54 70 42 C94 32 112 34 128 28" stroke-width="1"/>' +
      // scrolls off the main stem
      '<path d="M30 84 C44 80 52 66 46 58 C40 52 32 58 36 64" stroke-width="1.2"/>' +
      '<path d="M58 42 C64 56 80 60 86 52 C90 46 84 40 78 44" stroke-width="1.2"/>' +
      '<path d="M100 18 C104 30 118 34 124 28 C128 22 122 18 118 22" stroke-width="1.1"/>' +
      '<path d="M16 110 C26 112 34 104 32 96 C30 90 24 92 24 96" stroke-width="1.1"/>' +
      // acanthus leaves
      '<path d="M44 34 C34 26 30 14 34 6 C42 12 48 22 44 34z M24 60 C14 56 6 44 8 34 C18 40 24 50 24 60z" stroke-width="1" fill="rgba(200,180,143,.18)"/>' +
      '<path d="M140 18 C132 26 120 28 112 24 C120 16 130 14 140 18z M10 136 C4 128 4 116 8 108 C14 116 14 128 10 136z" stroke-width="1" fill="rgba(200,180,143,.18)"/>';
    // blossoms
    [[38, 22, 6], [18, 48, 5], [70, 30, 4.5], [88, 14, 4], [12, 90, 4], [54, 58, 3.5]].forEach(function (b) {
      for (var k = 0; k < 5; k++) {
        var a = k * 1.2566;
        g += '<circle cx="' + f1(b[0] + Math.cos(a) * b[2] * .55) + '" cy="' + f1(b[1] + Math.sin(a) * b[2] * .55) + '" r="' + f1(b[2] * .5) + '" fill="#fff" stroke="' + C + '" stroke-width=".8"/>';
      }
      g += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + f1(b[2] * .32) + '" fill="' + P + '" stroke="none"/>';
    });
    [[60, 12], [26, 74], [110, 40], [40, 100], [138, 8], [6, 70]].forEach(function (d) {
      g += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="1.6" fill="' + C + '" stroke="none"/>';
    });
    return g + "</g>";
  }

  // Wedding: white and champagne, like the printed card — filigree corners,
  // a fine double frame, rose sprigs and a whisper of gold.
  function decoWedding() {
    var r = rng(53), i;
    var svg = '<svg class="deco-top" viewBox="0 0 600 170" aria-hidden="true">' + filigree(14, 14, 1, 1) + filigree(586, 14, -1, 1) + "</svg>";
    var bot = '<svg class="deco-bottom" viewBox="0 0 600 170" aria-hidden="true">' + filigree(14, 156, 1, -1) + filigree(586, 156, -1, -1) + "</svg>";
    var bits = '<span class="wd-frame"></span>';
    for (i = 0; i < 30; i++) {
      bits += '<span class="glint" style="left:' + f1(6 + r() * 88) + "%;top:" + f1(3 + r() * 94) + "%;animation-delay:-" + f1(r() * 4) +
        "s;--s:" + (0.5 + r() * 0.9).toFixed(2) + '"></span>';
    }
    var pcols = ["#f6c1d4", "#fbdbe6", "#f3a9c4", "#fff0f5"];
    for (i = 0; i < 16; i++) {
      bits += '<span class="petal" style="left:' + f1(r() * 100) + "%;animation-delay:-" + f1(r() * 18) +
        "s;animation-duration:" + f1(13 + r() * 9) + "s;--s:" + (0.5 + r() * 0.6).toFixed(2) + ";--c:" + pcols[i % 4] + '"></span>';
    }
    return '<div class="deco" aria-hidden="true">' + bits + svg + bot + "</div>";
  }

  // Lord Ganesha, seated on a lotus — the blessing at the top of the card.
  function emblemGanesha() {
    var G = "url(#gn-gold)";
    return '<svg viewBox="0 0 140 150" aria-hidden="true">' +
      '<defs><linearGradient id="gn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d774"/><stop offset=".55" stop-color="#e0a92e"/><stop offset="1" stop-color="#b07a12"/></linearGradient>' +
      '<radialGradient id="gn-halo"><stop offset=".55" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>' +
      // halo with rays
      '<circle cx="70" cy="56" r="46" fill="url(#gn-halo)"/>' +
      Array.apply(null, Array(24)).map(function (_, k) {
        var a = k * Math.PI / 12;
        return '<path d="M' + f1(70 + Math.cos(a) * 34) + " " + f1(56 + Math.sin(a) * 34) + " L" + f1(70 + Math.cos(a) * 44) + " " + f1(56 + Math.sin(a) * 44) +
          '" stroke="#e0a92e" stroke-width="1" opacity=".55"/>';
      }).join("") +
      // lotus seat
      '<path d="M22 132 C34 118 52 118 70 128 C88 118 106 118 118 132 Z" fill="#e2487a"/>' +
      '<path d="M34 134 C42 116 58 112 70 126 C82 112 98 116 106 134 Z" fill="#f27aa0"/>' +
      '<path d="M52 134 C56 120 64 116 70 124 C76 116 84 120 88 134 Z" fill="#ffb3c9"/>' +
      '<path d="M18 136 H122" stroke="#b07a12" stroke-width="2.4" stroke-linecap="round"/>' +
      // crossed legs and body
      '<ellipse cx="70" cy="118" rx="34" ry="10" fill="#f08a24"/>' +
      '<path d="M40 118 Q70 108 100 118" fill="none" stroke="#f7d774" stroke-width="2"/>' +
      '<path d="M46 116 Q44 84 70 76 Q96 84 94 116 Z" fill="#f4a24a"/>' +
      '<ellipse cx="70" cy="102" rx="17" ry="14" fill="#f6b15c"/>' +
      '<circle cx="70" cy="104" r="1.8" fill="#b45309"/>' +
      '<path d="M52 92 Q70 98 88 92" fill="none" stroke="#c2185b" stroke-width="3"/>' + // sash
      // upper arms: axe and lotus
      '<path d="M50 88 Q34 82 32 68" fill="none" stroke="#f4a24a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M90 88 Q106 82 108 68" fill="none" stroke="#f4a24a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M30 70 V50 M24 52 Q30 44 36 52 Z" stroke="#b07a12" stroke-width="2" fill="' + G + '"/>' +
      '<path d="M108 66 C102 60 104 52 108 50 C112 52 114 60 108 66z" fill="#e2487a"/><path d="M108 66 C104 62 100 60 98 62 M108 66 C112 62 116 60 118 62" stroke="#e2487a" stroke-width="2.4" fill="none"/>' +
      // lower arms: blessing and modak
      '<path d="M52 96 Q42 104 46 112" fill="none" stroke="#f4a24a" stroke-width="7" stroke-linecap="round"/>' +
      '<circle cx="46" cy="113" r="4.6" fill="#f7d774" stroke="#b07a12" stroke-width=".8"/>' +
      '<path d="M88 96 Q100 96 102 86" fill="none" stroke="#f4a24a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M98 86 v-8 q4 -3 8 0 v8 z" fill="#f6b15c"/><circle cx="102" cy="82" r="1.2" fill="#c2185b"/>' +
      // ears
      '<path d="M54 46 C38 36 26 48 30 62 C34 74 46 74 56 66 Z" fill="#f6b15c" stroke="#e0a92e" stroke-width="1.2"/>' +
      '<path d="M86 46 C102 36 114 48 110 62 C106 74 94 74 84 66 Z" fill="#f6b15c" stroke="#e0a92e" stroke-width="1.2"/>' +
      '<path d="M50 50 C40 46 34 54 38 62 C42 68 48 66 52 62 Z M90 50 C100 46 106 54 102 62 C98 68 92 66 88 62 Z" fill="#f48fb1" opacity=".8"/>' +
      // head and trunk
      '<ellipse cx="70" cy="56" rx="17" ry="16" fill="#f6b15c"/>' +
      '<path d="M66 62 C62 76 60 86 66 92 C70 96 76 94 76 88 C76 84 72 84 72 88" fill="none" stroke="#c98a2e" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M66 62 C62 76 60 86 66 92 C70 96 76 94 76 88 C76 84 72 84 72 88" fill="none" stroke="#f6b15c" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M66 64 C63 76 62 84 66 90" fill="none" stroke="#e0a92e" stroke-width=".8" stroke-dasharray="1.5 2"/>' +
      '<path d="M77 64 l6 6" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="63" cy="55" r="1.8" fill="#3b2412"/><circle cx="77" cy="55" r="1.8" fill="#3b2412"/>' +
      '<path d="M66 44 Q70 52 74 44" fill="none" stroke="#c2185b" stroke-width="2"/><circle cx="70" cy="47" r="1.3" fill="#c2185b"/>' +
      // crown
      '<path d="M54 44 L56 30 Q62 26 64 22 L70 6 L76 22 Q78 26 84 30 L86 44 Z" fill="' + G + '" stroke="#b07a12" stroke-width="1"/>' +
      '<path d="M55 38 H85 M57 31 H83" stroke="#b07a12" stroke-width="1"/>' +
      '<circle cx="70" cy="34" r="3" fill="#c2185b" stroke="#f7d774"/><circle cx="62" cy="40" r="1.5" fill="#2f7d4f"/><circle cx="78" cy="40" r="1.5" fill="#2f7d4f"/>' +
      '<circle cx="70" cy="6" r="2.4" fill="#f7d774"/>' +
      "</svg>";
  }

  var EMBLEMS = { wedding: emblemGanesha };

  // Wedding: a Bengali bride and groom seated before the sacred fire,
  // tied together by the gathbandhan.
  function sceneWedding() {
    var r = rng(57), i, buti = "", sparks = "";
    for (i = 0; i < 40; i++) {
      buti += '<circle cx="' + f1(44 + r() * 100) + '" cy="' + f1(132 + r() * 60) + '" r="' + f1(.7 + r() * .8) + '" fill="#f7d774"/>';
    }
    for (i = 0; i < 10; i++) {
      sparks += '<circle class="flicker" style="animation-delay:-' + f1(r() * 2) + 's" cx="' + f1(140 + r() * 20) + '" cy="' + f1(150 + r() * 26) + '" r="' + f1(.8 + r()) + '" fill="#ffd166"/>';
    }
    var SAREE = "M78 128 Q96 132 114 128 Q150 150 156 196 Q96 210 36 196 Q42 150 78 128 Z";
    return '<svg viewBox="16 0 268 232" aria-hidden="true">' +
      '<defs><clipPath id="wd-saree"><path d="' + SAREE + '"/></clipPath>' +
      '<radialGradient id="wd-halo"><stop offset="0" stop-color="#fde4ec" stop-opacity=".95"/><stop offset=".7" stop-color="#fdeef3" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wd-fire"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#ffb020" stop-opacity=".85"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="150" cy="120" rx="140" ry="104" fill="url(#wd-halo)"/>' +
      // alpona on the floor
      '<g fill="none" stroke="#d98aa6" stroke-width="1" opacity=".8">' +
      '<ellipse cx="150" cy="210" rx="128" ry="14"/><ellipse cx="150" cy="210" rx="114" ry="10" stroke-dasharray="2 3"/>' +
      Array.apply(null, Array(18)).map(function (_, k) {
        var x = 36 + k * 13.4;
        return '<path d="M' + f1(x) + ' 204 q 5 -7 10 0"/>';
      }).join("") + "</g>" +
      // the gathbandhan: her aanchal tied to his uttariyo
      '<path d="M120 140 Q150 168 182 140" fill="none" stroke="#e8c766" stroke-width="5"/>' +
      '<path d="M120 140 Q150 168 182 140" fill="none" stroke="#c0182c" stroke-width="2.6"/>' +
      '<circle cx="151" cy="160" r="4" fill="#c0182c" stroke="#e8c766" stroke-width="1.2"/>' +

      // ---- bride (left) ----
      '<path d="M78 70 Q66 110 72 150 L118 150 Q124 108 112 70 Z" fill="#a50f22"/>' + // veil behind
      '<path d="' + SAREE + '" fill="#c0182c"/>' +
      '<g clip-path="url(#wd-saree)">' + buti +
      '<path d="M36 192 Q96 206 156 192" stroke="#e8c766" stroke-width="8" fill="none"/>' +
      '<path d="M36 192 Q96 206 156 192" stroke="#a50f22" stroke-width="1.2" stroke-dasharray="3 2" fill="none"/>' +
      '<path d="M112 130 Q130 160 126 196" stroke="#e8c766" stroke-width="5" fill="none"/></g>' +
      '<path d="M80 96 Q96 90 112 96 L114 128 Q96 132 78 128 Z" fill="#c0182c" stroke="#e8c766" stroke-width="1"/>' +
      '<path d="M80 98 Q74 120 88 136" fill="none" stroke="#e8c766" stroke-width="4"/>' + // aanchal border over shoulder
      // her hands folded in her lap
      '<path d="M84 104 Q82 128 96 140" fill="none" stroke="' + SKIN + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M110 104 Q114 128 100 140" fill="none" stroke="' + SKIN + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M86 124 l7 -1 M86 128 l7 -1 M103 127 l7 1 M103 131 l7 1" stroke="#e8c766" stroke-width="1.6"/>' +
      '<path d="M88 126 l6 -1 M104 129 l6 1" stroke="#c0182c" stroke-width="1.4"/>' + // shakha-pola
      // white rajnigandha garland
      '<path d="M84 94 Q96 128 110 94" fill="none" stroke="#fffaf0" stroke-width="4.4" stroke-dasharray="2.6 1.2"/>' +
      '<path d="M84 94 Q96 128 110 94" fill="none" stroke="#e0457b" stroke-width="1.2" stroke-dasharray="1 7"/>' +
      // head, jewellery, chandan
      '<rect x="92" y="78" width="9" height="14" fill="' + SKIN + '"/>' +
      '<circle cx="96" cy="68" r="14" fill="' + SKIN + '"/>' +
      '<path d="M84 90 Q96 100 108 90" fill="none" stroke="#e0a92e" stroke-width="3"/>' +
      '<circle cx="104" cy="74" r="4" fill="none" stroke="#e0a92e" stroke-width="1.4"/>' + // nath
      '<path d="M86 62 Q96 54 106 62" fill="none" stroke="#fffaf0" stroke-width="1.6" stroke-dasharray=".5 2.6" stroke-linecap="round"/>' +
      '<circle cx="96" cy="60" r="1.6" fill="#c0182c"/>' +
      '<path d="M82 70 Q81 52 96 51 Q111 52 110 66 Q103 58 92 59 Q85 62 84 76 Z" fill="' + HAIR + '"/>' +
      // red veil over the head
      '<path d="M78 82 Q72 48 96 42 Q120 48 114 82 Q112 58 96 56 Q80 58 78 82 Z" fill="#c0182c" stroke="#e8c766" stroke-width="1.6"/>' +
      // shola mukut (white pith crown)
      '<path d="M82 50 Q84 30 96 22 Q108 30 110 50 Q96 44 82 50 Z" fill="#fffaf0" stroke="#d9c7a0" stroke-width="1"/>' +
      '<path d="M86 44 Q96 30 106 44 M90 36 Q96 28 102 36" fill="none" stroke="#e0a92e" stroke-width=".9"/>' +
      [[84, 46], [88, 34], [96, 24], [104, 34], [108, 46]].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="#fffaf0" stroke="#d9c7a0" stroke-width=".8"/>';
      }).join("") +
      '<circle cx="96" cy="38" r="2" fill="#c0182c"/>' +

      // ---- groom (right) ----
      // dhoti, cross-legged
      '<path d="M162 196 Q164 166 188 162 L218 162 Q246 166 250 196 Q206 206 162 196 Z" fill="#fffdf6" stroke="#d9c7a0" stroke-width="1"/>' +
      '<path d="M170 190 Q206 200 244 190" fill="none" stroke="#e8c766" stroke-width="2"/>' +
      // panjabi
      '<path d="M182 92 Q204 84 226 92 L232 166 Q204 174 176 166 Z" fill="#fbf1dc" stroke="#d9c7a0" stroke-width="1"/>' +
      '<path d="M204 90 V126" stroke="#d9c7a0" stroke-width="1"/>' +
      [98, 108, 118].map(function (y) { return '<circle cx="204" cy="' + y + '" r="1.5" fill="#e0a92e"/>'; }).join("") +
      // uttariyo (shawl) over the shoulder, red-gold
      '<path d="M224 90 Q198 120 182 150 L192 152 Q206 124 230 98 Z" fill="#c0182c" stroke="#e8c766" stroke-width="1.2"/>' +
      // garland
      '<path d="M190 94 Q204 132 218 94" fill="none" stroke="#fffaf0" stroke-width="4.4" stroke-dasharray="2.6 1.2"/>' +
      '<path d="M190 94 Q204 132 218 94" fill="none" stroke="#e0457b" stroke-width="1.2" stroke-dasharray="1 7"/>' +
      // hands joined in front
      '<path d="M186 100 Q180 130 198 140" fill="none" stroke="#fbf1dc" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M222 100 Q228 130 210 140" fill="none" stroke="#fbf1dc" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M200 144 Q204 134 208 144 Z" fill="' + SKIN + '"/>' +
      // head with chandan
      '<rect x="200" y="78" width="9" height="14" fill="' + SKIN + '"/>' +
      '<circle cx="204" cy="68" r="14.5" fill="' + SKIN + '"/>' +
      '<path d="M194 62 Q204 55 214 62" fill="none" stroke="#fffaf0" stroke-width="1.6" stroke-dasharray=".5 2.6" stroke-linecap="round"/>' +
      '<path d="M190 70 Q189 54 204 53 Q219 54 218 68 Q212 60 201 61 Q194 63 191 74 Z" fill="' + HAIR + '"/>' +
      // topor (conical white crown)
      '<path d="M190 58 L204 4 L218 58 Q204 52 190 58 Z" fill="#fffaf0" stroke="#d9c7a0" stroke-width="1.2"/>' +
      '<path d="M193 48 L204 10 L215 48 M196 38 H212 M198 28 H210" fill="none" stroke="#e0a92e" stroke-width=".9"/>' +
      '<path d="M190 58 Q186 48 182 50 Q184 58 190 60 Z M218 58 Q222 48 226 50 Q224 58 218 60 Z" fill="#fffaf0" stroke="#d9c7a0" stroke-width=".8"/>' +
      '<circle cx="204" cy="44" r="2.2" fill="#c0182c"/><circle cx="204" cy="4" r="2" fill="#e0a92e"/>' +

      // ---- the sacred fire ----
      '<g transform="translate(0 12)">' +
      '<ellipse class="flicker" cx="151" cy="166" rx="26" ry="30" fill="url(#wd-fire)"/>' +
      '<path d="M140 184 C134 170 142 160 146 150 C148 160 152 162 152 154 C158 162 164 172 160 184 Z" fill="#ffb020"/>' +
      '<path d="M145 184 C142 176 146 168 150 162 C152 170 156 174 156 184 Z" fill="#fff3b0"/>' + sparks +
      '<path d="M130 184 H172 L166 200 H136 Z" fill="#c9973a" stroke="#8a5a12" stroke-width="1"/>' +
      '<path d="M128 184 H174" stroke="#8a5a12" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M138 192 H164" stroke="#8a5a12" stroke-width=".8" stroke-dasharray="2 2"/></g>' +
      "</svg>";
  }

  var SCENES = { haldi: sceneHaldi, sangeet: sceneSangeet, varmala: sceneVarmala, mehendi: sceneMehendi, wedding: sceneWedding };

  // Henna (Mehendi): cream card dressed with the marigold toran and strands from the printed card.
  function decoHenna() {
    return '<div class="deco" aria-hidden="true"><img class="hn-toran" src="assets/cards/mehendi-toran-Hc5Le2.webp" alt="">' +
      '<img class="hn-strands" src="assets/cards/mehendi-strands-Hc5Le2.webp" alt=""></div>';
  }

  var DECOR = { henna: decoHenna, haldi: decoHaldi, sangeet: decoSangeet, varmala: decoVarmala, mehendi: decoMehendi, wedding: decoWedding };

  // ?fullcard renders every card in full (used to make the downloadable images).
  var FULL = /[?&]fullcard\b/.test(location.search);
  var CARDS = {};

  function renderCard(e) {
    var c = e.card;
    var theme = c.theme && DECOR[c.theme] ? c.theme : null;
    var rsvp = (c.rsvp || []).map(function (r) {
      return (r.name ? esc(r.name) + " · " : "") +
        (r.href ? '<a href="' + esc(r.href) + '" target="_blank" rel="noopener">' + esc(r.phone) + "</a>" : "<em>" + esc(r.phone) + "</em>") +
        (r.note ? " (" + esc(r.note) + ")" : "");
    }).join("<br>");
    var actions = "";
    if (c.mapUrl) actions += '<a class="btn" href="' + esc(c.mapUrl) + '" target="_blank" rel="noopener">View on Map</a>';
    if (c.image) actions += '<button type="button" class="btn ghost" data-view-card="' + esc(e.id) + '">Download Card</button>';
    else if (c.pdf) actions += '<a class="btn ghost" href="' + esc(c.pdf) + '" download="' + esc(c.pdfName || "") +
      '" target="_blank" rel="noopener">Download Card</a>';
    CARDS[e.id] = c;
    var scene = c.sceneImage ?
      '<div class="card-scene photo' + (c.sceneCutout ? " cutout" : "") + (c.sceneClass ? " " + esc(c.sceneClass) : "") + '"><img src="' +
        esc(c.sceneImage) + '" alt="' + esc(c.sceneAlt || "") + '"></div>' :
      theme && SCENES[theme] ? '<div class="card-scene">' + SCENES[theme]() + "</div>" : "";
    // Parts shown only on the full card (the downloadable image), to keep the page version short.
    var hide = ["tagline"].concat(c.pageHide || []);
    function part(name) { return hide.indexOf(name) > -1 ? " full-only" : ""; }

    // A finished card supplied as an image: show it as is, with the buttons underneath.
    if (c.imageOnly) {
      return '<section class="panel" data-panel="' + esc(e.id) + '" role="tabpanel" hidden>' +
        '<figure class="image-card"><img src="' + esc(c.image) + '" alt="' + esc(c.imageAlt || e.title) + '"></figure>' +
        (actions ? '<p class="card-actions image-card-actions">' + actions + "</p>" : "") + "</section>";
    }

    return '<section class="panel" data-panel="' + esc(e.id) + '" role="tabpanel" hidden>' +
      '<article class="card' + (theme ? " theme-" + theme : "") + (FULL ? " full" : "") + '">' +
      (theme ? DECOR[theme]() : "") +
      '<div class="card-body">' +
      (theme && EMBLEMS[theme] ? '<div class="card-emblem">' + EMBLEMS[theme]() + "</div>" : "") +
      (c.invocation ? '<p class="card-invocation">' + esc(c.invocation) + "</p>" : "") +
      (c.hosts ? '<p class="card-hosts">' + esc(c.hosts) + "</p>" : "") +
      (c.request ? '<p class="card-request' + part("request") + '">' + esc(c.request) + "</p>" : "") +
      (c.heading ? '<h2 class="card-title"><span class="flourish">◇</span> ' + esc(c.heading) + ' <span class="flourish">◇</span></h2>' : "") +
      (c.headingSub ? '<p class="card-heading-sub"><span>' + esc(c.headingSub) + "</span></p>" : "") +
      '<p class="card-name">' + esc(c.names[0]) + "</p>" +
      (c.names[1] ? '<p class="card-amp">' + esc(c.joiner || "&") + '</p><p class="card-name">' + esc(c.names[1]) + "</p>" : "") +
      (c.afterNames ? '<p class="card-after-names">' + esc(c.afterNames) + "</p>" : "") +
      (c.tagline ? '<p class="card-tagline' + part("tagline") + '">' + esc(c.tagline) + "</p>" : "") +
      (c.scenePosition !== "bottom" ? scene : "") +
      '<div class="card-date"><span class="side">' + esc(c.weekday) + '</span>' +
      '<span class="day">' + esc(c.day) + "<small>" + esc(c.monthYear) + "</small></span>" +
      '<span class="side">' + esc(c.time) + "</span></div>" +
      '<p class="card-label">Venue</p>' +
      '<p class="card-venue">' + esc(c.venue) + "</p>" +
      (c.venueSub ? '<p class="card-venue-sub' + part("venueSub") + '">' + esc(c.venueSub) + "</p>" : "") +
      (c.address && c.address.length ? '<p class="card-address">' + c.address.map(esc).join("<br>") + "</p>" : "") +
      (actions ? '<p class="card-actions">' + actions + "</p>" : "") +
      (rsvp ? '<p class="card-label">R.S.V.P.</p><p class="card-rsvp">' + rsvp + "</p>" : "") +
      (c.scenePosition === "bottom" ? scene : "") +
      "</div></article></section>";
  }

  /* ---------- full card viewer ---------- */
  var viewer = null;
  function openCard(id) {
    var c = CARDS[id];
    if (!c || !c.image) return;
    if (!viewer) {
      viewer = document.createElement("div");
      viewer.className = "viewer";
      viewer.setAttribute("role", "dialog");
      viewer.setAttribute("aria-modal", "true");
      viewer.setAttribute("aria-label", "Invitation card");
      viewer.innerHTML = '<div class="viewer-bar"><button type="button" class="vbtn primary" data-save>Download</button>' +
        '<a class="vbtn" data-pdf target="_blank" rel="noopener">PDF Version</a>' +
        '<button type="button" class="vbtn" data-close aria-label="Close">Close</button></div>' +
        '<div class="viewer-scroll"><img alt=""></div>';
      document.body.appendChild(viewer);
      viewer.addEventListener("click", function (ev) {
        if (ev.target === viewer || ev.target.classList.contains("viewer-scroll") || ev.target.hasAttribute("data-close")) closeCard();
      });
      document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !viewer.hidden) closeCard(); });
    }
    var img = viewer.querySelector("img"), save = viewer.querySelector("[data-save]"), pdf = viewer.querySelector("[data-pdf]");
    img.src = c.image;
    img.alt = (c.heading || id) + " invitation card";
    pdf.hidden = !c.pdf;
    if (c.pdf) { pdf.href = c.pdf; pdf.setAttribute("download", c.pdfName || ""); }
    save.onclick = function () { saveCard(c); };
    viewer.hidden = false;
    viewer.querySelector(".viewer-scroll").scrollTop = 0;
    document.body.classList.add("viewer-open");
  }
  function closeCard() {
    viewer.hidden = true;
    document.body.classList.remove("viewer-open");
  }
  function saveCard(c) {
    var name = c.imageName || "invitation.jpg";
    function download() {
      var a = document.createElement("a");
      a.href = c.image; a.download = name; a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    }
    if (!(navigator.canShare && window.File)) return download();
    fetch(c.image).then(function (r) { return r.blob(); }).then(function (b) {
      var file = new File([b], name, { type: b.type || "image/jpeg" });
      if (!navigator.canShare({ files: [file] })) return download();
      return navigator.share({ files: [file], title: name.replace(/\.jpg$/, "").replace(/-/g, " ") });
    }).catch(function (err) { if (!err || err.name !== "AbortError") download(); });
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-view-card]");
    if (b) openCard(b.getAttribute("data-view-card"));
  });

  /* ---------- countdown: to the guest's next dated event ---------- */
  function startCountdown(events) {
    var label = document.getElementById("countdown-label");
    var wrap = document.getElementById("countdown");
    var d = document.getElementById("cd-days"), h = document.getElementById("cd-hours"),
        m = document.getElementById("cd-mins"), s = document.getElementById("cd-secs");
    var targets = events.filter(function (e) { return e.countdownAt; })
      .map(function (e) { return { at: new Date(e.countdownAt).getTime() }; })
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
      label.textContent = "Days to go";
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
