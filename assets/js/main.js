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

  function renderCard(e) {
    var c = e.card;
    var rsvp = (c.rsvp || []).map(function (r) {
      return esc(r.name) + ' · <a href="' + esc(r.href) + '" target="_blank" rel="noopener">' + esc(r.phone) + "</a>" +
        (r.note ? " (" + esc(r.note) + ")" : "");
    }).join("<br>");
    var actions = "";
    if (c.mapUrl) actions += '<a class="btn" href="' + esc(c.mapUrl) + '" target="_blank" rel="noopener">View on Map</a>';
    if (c.pdf) actions += '<a class="btn ghost" href="' + esc(c.pdf) + '" target="_blank" rel="noopener">Download Card</a>';

    return '<section class="panel" data-panel="' + esc(e.id) + '" role="tabpanel" hidden>' +
      '<article class="card">' +
      '<p class="card-invocation">' + esc(c.invocation) + "</p>" +
      '<p class="card-hosts">' + esc(c.hosts) + "</p>" +
      '<p class="card-request">' + esc(c.request) + "</p>" +
      '<h2 class="card-title"><span class="flourish">◇</span> ' + esc(c.heading) + ' <span class="flourish">◇</span></h2>' +
      '<p class="card-name">' + esc(c.names[0]) + "</p>" +
      '<p class="card-amp">&amp;</p>' +
      '<p class="card-name">' + esc(c.names[1]) + "</p>" +
      '<div class="card-date"><span class="side">' + esc(c.weekday) + '</span>' +
      '<span class="day">' + esc(c.day) + "<small>" + esc(c.monthYear) + "</small></span>" +
      '<span class="side">' + esc(c.time) + "</span></div>" +
      '<p class="card-label">Venue</p>' +
      '<p class="card-venue">' + esc(c.venue) + "</p>" +
      '<p class="card-venue-sub">' + esc(c.venueSub) + "</p>" +
      '<p class="card-address">' + c.address.map(esc).join("<br>") + "</p>" +
      (actions ? '<p class="card-actions">' + actions + "</p>" : "") +
      (rsvp ? '<p class="card-label">R.S.V.P.</p><p class="card-rsvp">' + rsvp + "</p>" : "") +
      "</article></section>";
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
