# The Grand Wedding · Seersha & Siddhant

Wedding website for **Seersha Saha** and **Siddhant Haldar** — Kolkata, January 2027.

| Celebration | Date |
|---|---|
| Henna Soirée (Mehendi) | Sun, 24 Jan 2027 · 3:30 PM · JVV Lawn – Salt Lake |
| Varmala | Mon, 25 Jan 2027 · 12:00 PM · Nalban Park, Saltlake |
| Jashn-e-Ishq (Sangeet) | Mon, 25 Jan 2027 · 6:30 PM · Nalban Park, Saltlake |
| Gaye Holud (Haldi) | Wed, 27 Jan 2027 · 10:30 AM · Orchid Banquet, East Topsia |
| Wedding | Wed, 27 Jan 2027 · 6:30 PM · Orchid Banquet, East Topsia |
| Reception | Fri, 29 Jan 2027 · 6:30 PM · The Meadows, P. C. Chandra Garden |

## How invitations work

The site is the invitation. Each group of guests gets **one link** with a code in it,
for example `https://thegrandwedding.github.io/?invite=TiPpV4tp`. The code decides
which celebrations that guest sees.

- **With a valid code:** the guest sees a Welcome tab plus only their events (tabs,
  the event list and the countdown all adapt).
- **With no code or an unknown code:** a landing page with just the couple's names,
  "January 2027 · Kolkata" and a note to use the link from the invitation.

Only the files listed in a guest's invite are ever downloaded by their browser, so
uninvited events, family details and phone numbers never reach anyone without a code.

> ⚠️ While this repo is **public**, anyone browsing GitHub can read every file,
> including all codes. That's fine for testing; see *Hosting on Cloudflare Pages* below.

### Current invite links

Every invite comes in two versions: **with plus-one** (the R.S.V.P. form has an "I will be bringing a plus-one" box) and **no plus-one** (the box is hidden).

| Group | Events | With plus-one | No plus-one |
|---|---|---|---|
| Mehendi to Wedding | Mehendi, Varmala, Sangeet, Haldi, Wedding | https://thegrandwedding.github.io/?invite=wrLqlpHU | https://thegrandwedding.github.io/?invite=6MCzXY20 |
| Varmala to Wedding | Varmala, Sangeet, Haldi, Wedding | https://thegrandwedding.github.io/?invite=1ZtLN6fx | https://thegrandwedding.github.io/?invite=g2ehra99 |
| Varmala, Sangeet, Wedding | Varmala, Sangeet, Wedding | https://thegrandwedding.github.io/?invite=ys24rR8U | https://thegrandwedding.github.io/?invite=xujRDH50 |
| Sangeet & Wedding | Sangeet, Wedding | https://thegrandwedding.github.io/?invite=cJc4bTMC | https://thegrandwedding.github.io/?invite=rqX3LENi |
| Everything | Mehendi, Varmala, Sangeet, Haldi, Wedding, Reception | https://thegrandwedding.github.io/?invite=nyjfC74C | https://thegrandwedding.github.io/?invite=JWvDopwI |
| Varmala onwards | Varmala, Sangeet, Haldi, Wedding, Reception | https://thegrandwedding.github.io/?invite=rAYNyYhF | https://thegrandwedding.github.io/?invite=IudwlMbK |
| Sangeet onwards | Sangeet, Wedding, Reception | https://thegrandwedding.github.io/?invite=QjW4MvHW | https://thegrandwedding.github.io/?invite=014oPucA |
| Wedding & Reception | Wedding, Reception | https://thegrandwedding.github.io/?invite=TiPpV4tp | https://thegrandwedding.github.io/?invite=Lwi0HwMW |
| Reception only | Reception | https://thegrandwedding.github.io/?invite=IzKg8MW7 | https://thegrandwedding.github.io/?invite=nJCwafub |

Individual tabs can be linked by adding `#<event>`, e.g. `…?invite=TiPpV4tp#reception`.

### Making a new invite link

```sh
python3 tools/new-invite.py "Sharma family" sangeet wedding reception --greeting "Dear Sharma family"
# -> Created data/invites/Ab12Cd34.json
# -> Link: https://thegrandwedding.github.io/?invite=Ab12Cd34
git add data/invites && git commit -m "Add invite" && git push
```

Use `all` for every event, `--no-families` to hide the parents' names, and `--no-plus-one` to hide the plus-one option on the R.S.V.P. form.
To revoke a link, delete its file in `data/invites/` and push.

## Structure

A plain static site — no build step.

```
index.html                    # page shell: countdown, hero, tab bar, landing message
assets/css/style.css          # styling (oxblood / antique gold / ivory)
assets/js/main.js             # reads ?invite=, loads that invite's files, builds tabs + countdown
assets/cards/                 # printable cards (random file names so they can't be guessed)
data/invites/<code>.json      # one per invitation group: which events + families file
data/events/<random>.json     # one per celebration: title, date, time, venue, countdown time
data/families-<random>.json   # parents' names
tools/new-invite.py           # creates a new invite code + link
```

Event files have random names on purpose. To find one, search by id:
`grep -l '"id": "sangeet"' data/events/*.json`

## Preview locally

The page loads its data with `fetch`, so it needs a web server — opening `index.html`
directly from Finder will only show "Opening your invitation…".

```sh
python3 -m http.server 8000
# open http://localhost:8000/?invite=nyjfC74C
```

## Updating an event

Edit its file in `data/events/` (date, time, venue, description). Set `countdownAt`
(ISO time with `+05:30`) to include it in the countdown; `null` leaves it out.

## R.S.V.P.

Every invite has an **R.S.V.P.** tab (and a button on the Welcome page). Guests enter their name,
phone, email, accept or decline **each event on their invite**, add a plus-one and an optional note.
Each reply becomes a row in the couple's private Google Sheet (tab **RSVPs**), with the invite's
**Category** (its `group`) filled in automatically.

The form posts to a Google Apps Script web app — the script is in `tools/rsvp-apps-script.gs`, and its
URL is `RSVP_URL` in `assets/js/main.js`. The script looks the invite code up on the live site, so a
reply with a made-up code is rejected and the category can't be faked. The sheet itself is never shared.
After editing the script: Apps Script → Deploy → Manage deployments → edit → Version: **New version**
(the URL stays the same).

## Event cards

Each event tab shows a compact card (same height ballpark as the reception card). Every card has
**Download Card**, which opens the complete card image (`card.image`) full-screen with a **Download**
button (on phones this opens the share sheet — Save Image / WhatsApp — where supported, otherwise a
plain download). The reception viewer also offers the original PDF (`card.pdf`) as **PDF Version**.

The full images are snapshots of the cards rendered with `?fullcard` in the URL, which shows every
card in full (tagline and any `card.pageHide` parts included). Re-make an image whenever that card's
details change, and give the new image a new file name (browsers cache images by name), e.g. open `http://localhost:8000/?invite=nyjfC74C&fullcard#sangeet` and capture the card.

## Hosting on Cloudflare Pages (later)

**Why:** GitHub Pages serves from a public repo on the free plan, so every invite code
and event file can be read on GitHub. Cloudflare Pages is free, publishes from a
**private** repo, and redeploys on every push. The site itself stays public, but files
can only be reached by someone who already knows their exact address — which is what
makes the invite links meaningful.

**Steps:**
1. On GitHub, make this repo private (Settings → General → Danger Zone → Change visibility).
2. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git, and pick this repo.
3. Build settings: framework preset **None**, build command *(empty)*, output directory **`/`**.
4. Deploy. The site appears at `<project-name>.pages.dev`; optionally add a custom domain under the project's Custom domains tab.
5. Update `SITE` in `tools/new-invite.py` to the new address, regenerate any links already sent (or keep both hosts up during the switch), then turn off GitHub Pages.
6. Optional: since the old codes were public, rotate them (create new invites, delete the old files).

For real access control later (a password per event, or guest sign-in), a small
Cloudflare Worker in front of the site can check a code before serving each file.

## To-do

- [ ] Move hosting to Cloudflare Pages with a private repo (see above), and rotate the test invite codes.
- [ ] Per-household invites with a personal greeting ("Dear Sharma family") — the script already supports `--greeting`.
- [x] RSVP form (per invite, so we know who is coming to which event) — see *R.S.V.P.* above.
- [ ] Custom domain.
- [ ] Link preview image (Open Graph) so the link shows a picture on WhatsApp.
- [ ] Bengali version of the site.
- [x] Themed cards for every event. Cards use `"layout": "card"` with `"theme"` — see `DECOR` in `assets/js/main.js`.
