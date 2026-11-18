# The Grand Wedding · Seersha & Siddhant

Wedding website for **Seersha Saha** and **Siddhant Haldar** — Kolkata, January 2027.

| Celebration | Date |
|---|---|
| Mehendi | TBA |
| Sangeet | Mon, 25 Jan 2027 |
| Haldi | TBA |
| Varmala | TBA |
| Wedding | Wed, 27 Jan 2027 |
| Reception | Fri, 29 Jan 2027 · 6:30 PM · The Meadows, P. C. Chandra Garden |

## Structure

A plain static site — no build step. Served by GitHub Pages from `main`.

```
index.html            # all content; each celebration is a tab (#mehendi, #sangeet, …)
assets/css/style.css  # styling (oxblood / antique gold / ivory)
assets/js/main.js     # countdown timer + tab routing
assets/cards/         # printable invitation cards
```

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Updating an event

Edit the matching `<section data-panel="…">` in `index.html` (date / time / venue),
and the row in the "Order of Celebrations" list on the Welcome tab.
