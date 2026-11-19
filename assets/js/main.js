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

  var SCENES = { haldi: sceneHaldi, sangeet: sceneSangeet };

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
    if (c.pdf) actions += '<a class="btn ghost" href="' + esc(c.pdf) + '" download="' + esc(c.downloadName || "") +
      '" target="_blank" rel="noopener">Download Card</a>';

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
      (theme && SCENES[theme] ? '<div class="card-scene">' + SCENES[theme]() + "</div>" : "") +
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
