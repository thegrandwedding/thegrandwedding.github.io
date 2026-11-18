(function () {
  "use strict";

  /* ---------- Countdown ----------
     Counts down to the wedding day (27 Jan 2027, Kolkata time). Once it has
     passed, it switches to the reception, and afterwards shows a closing note. */
  var TARGETS = [
    { label: "Until we say “I do”", at: new Date("2027-01-27T00:00:00+05:30") },
    { label: "Until the Reception",           at: new Date("2027-01-29T18:30:00+05:30") }
  ];

  var el = {
    label: document.getElementById("countdown-label"),
    wrap:  document.getElementById("countdown"),
    d: document.getElementById("cd-days"),
    h: document.getElementById("cd-hours"),
    m: document.getElementById("cd-mins"),
    s: document.getElementById("cd-secs")
  };

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    var now = Date.now();
    var target = null;
    for (var i = 0; i < TARGETS.length; i++) {
      if (TARGETS[i].at.getTime() > now) { target = TARGETS[i]; break; }
    }
    if (!target) {
      el.label.textContent = "Happily ever after — thank you for celebrating with us";
      el.wrap.hidden = true;
      return false;
    }
    var diff = Math.floor((target.at.getTime() - now) / 1000);
    el.label.textContent = target.label;
    el.d.textContent = Math.floor(diff / 86400);
    el.h.textContent = pad(Math.floor((diff % 86400) / 3600));
    el.m.textContent = pad(Math.floor((diff % 3600) / 60));
    el.s.textContent = pad(diff % 60);
    return true;
  }

  if (tick()) {
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }

  /* ---------- Keep the tab bar tucked under the countdown bar ---------- */
  var bar = document.querySelector(".countdown-bar");
  var tabs = document.querySelector(".tabs");
  function syncOffset() { tabs.style.top = bar.offsetHeight + "px"; }
  syncOffset();
  window.addEventListener("resize", syncOffset);

  /* ---------- Tabs (hash routed so each event has a shareable link) ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".tabs a[data-tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel[data-panel]"));
  var names = panels.map(function (p) { return p.getAttribute("data-panel"); });

  function show(name, scroll) {
    if (names.indexOf(name) === -1) name = "home";
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
    links.forEach(function (a) {
      var on = a.getAttribute("data-tab") === name;
      a.setAttribute("aria-selected", on ? "true" : "false");
      if (on && a.scrollIntoView) a.scrollIntoView({ block: "nearest", inline: "center" });
    });
    if (scroll) {
      var y = tabs.getBoundingClientRect().top + window.pageYOffset - bar.offsetHeight;
      if (window.pageYOffset > y || name !== "home") window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  window.addEventListener("hashchange", function () {
    show(location.hash.replace("#", ""), true);
  });
  show(location.hash.replace("#", ""), false);
})();
