# switchpowerco.com

Marketing site for **Switch** — a door-to-door solar and storage sales team in
California, and a sales partner of Continuum.

Two audiences, one page each:

| Page | Audience | Job |
| --- | --- | --- |
| `index.html` | Prospective sales reps | Show the culture, get them to reach out |
| `homeowners.html` | California homeowners | Explain who we are, NEM 3.0, batteries and financing |

Static HTML, CSS and one small JS file. No build step, no dependencies, no framework.

---

## Before this goes live

These are the placeholders left in the code. Search for `TODO` to find them all in place.

### Must fix — the site is wrong without these

- [ ] **Phone number.** There is no number yet, so the "Text us" / "Call or text" buttons
      have been removed rather than left as dead links. A commented-out button sits in the
      call-to-action block on each page — uncomment and fill in the number when there is one.
- [x] **Email addresses.** `careers@switchpowerco.com` for people who want to sell for us
      (recruiting page), `info@switchpowerco.com` for everything else (homeowners page).
      Both mailboxes need to exist at the domain and be monitored.
- [ ] **Federal and state incentives paragraph** in `homeowners.html` (financing section).
      Incentive rules changed at the end of 2025 and continue to move. Have someone at
      Continuum confirm the current position for both homeowner-owned and third-party-owned
      systems, then rewrite that paragraph with specifics and a date. Do not publish a number
      you cannot substantiate.
- [ ] **Contractor licence line**, if your role requires one to be displayed. Placeholder is in
      the homeowners page footer block.

### Should fix — makes it yours rather than generic

- [x] **Who Continuum is.** Written into both pages, each with a side-by-side block making the
      two-company split explicit: Switch sells, Continuum engineers, permits, installs and
      services. Continuum is described as a California-based solar and storage EPC with more
      than twenty years of code-compliant work.

      Continuum's own brand palette (from their brand guide) is PMS 381c `#CCFF00`,
      PMS 301c `#1C4E7B`, PMS 403c `#787F84` and PMS Black `#231F20`, set in Circular.
      Their positioning line is "Take Back Your Power." None of it is used on this site —
      Switch keeps its own identity — but it is recorded here in case co-branded material
      is ever needed.
- [ ] **Your weekly ritual** in the "What a week looks like" section on `index.html` — team
      dinner, competition, awards night, whatever you actually do.
- [ ] **Comp structure and promotion criteria.** The site deliberately points reps to a
      conversation rather than publishing figures. If you want numbers on the page, get them
      reviewed first — published earnings claims for a commission role carry real legal risk.
- [ ] **Team photos.** The strongest thing you could add. Real faces on doors beats any copy on
      this page for recruiting. There is no image section yet; say the word and one gets built.
- [ ] **Markets.** The site says "California" throughout. Naming your actual cities would
      convert better.

---

## Privacy and compliance

### What the site actually does

Audited, not assumed. This site is static HTML and:

- has **no forms** — no name, email, address, bill upload or quote request field anywhere
- sets **no cookies** and uses no `localStorage`, `sessionStorage` or `indexedDB`
- runs **no analytics or tracking** — no Google Analytics, Meta pixel, ad tags or session recording
- makes **no third-party requests at all**. The typeface is self-hosted (`assets/fonts/`)
  specifically so that no visitor request reaches Google or anyone else.

The only JavaScript is `main.js`: it toggles the hero switch and writes the current year.
It touches no storage and sends no network request.

`privacy.html` states all of this publicly, and is linked from every footer.

Two things are honestly disclosed there rather than glossed over: GitHub Pages keeps standard
server logs (GitHub's data, not ours), and an email someone chooses to send us is personal
information we then hold in a mailbox.

**If anyone later adds a form, a chat widget, an embedded map or video, a tracking pixel or
an analytics tag, the privacy page stops being accurate.** Update it in the same change.

### Still needs a lawyer

The website's data handling is clean. These are separate questions about operating a
door-to-door solar sales business in California, and they are flagged here because the site
touches them. **This is not legal advice — get it reviewed.**

- [ ] **CSLB licence number in advertising.** California requires contractors to display
      their licence number in advertising. Switch is the sales partner and Continuum holds
      the licence, so confirm whether this site needs a licence number shown, and whose.
- [ ] **Home Improvement Salesperson registration.** California generally requires people
      selling home improvement contracts door to door to be registered with CSLB. This
      affects how you recruit and onboard, and what the recruiting page can promise.
- [ ] **Pay scale in job postings.** California requires employers over a certain headcount
      to include a pay scale in job postings. The recruiting page deliberately carries no
      figures and routes people to a call — confirm that is sufficient at your headcount.
- [ ] **Worker classification.** Whether reps are employees or contractors drives much of the
      above. Worth settling before scaling the team.
- [ ] **Solar contract disclosures.** California requires a specific disclosure document for
      residential solar contracts. That lives in Continuum's paperwork, not on this site, but
      make sure nothing the site says contradicts it.
- [ ] **The copyright line** says "Switch". Confirm the registered legal entity name and use
      that if it differs.

### Continuum brand rules

Continuum's brand guide forbids stretching, recolouring, recreating or otherwise modifying
their logo. The artwork in `assets/continuum-*.png` is extracted from that guide unaltered.

- `continuum-light.png` — approved Color/Reverse, for dark backgrounds
- `continuum-dark.png` — for light backgrounds

Their mark is deliberately held **smaller than the Switch wordmark** everywhere it appears
(footer: 128×23 against Switch at 176×46). Keep it that way.

"Powered by Continuum" appears as real text in every footer. The words are inside Continuum's
lock-up too, but at any size that stays under the Switch wordmark they render about 3px tall,
so the text credit is what actually satisfies the requirement. Do not remove it.

## Local preview

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>.

## Deploying

**Live on GitHub Pages.** Repo is public, Pages serves from the root of `main`, and every
push to `main` redeploys automatically within about a minute.

- Build status: <https://github.com/vsmith-ctrl/switchpowerco/deployments>
- `CNAME` sets the custom domain to `switchpowerco.com`
- `.nojekyll` stops Pages running the files through Jekyll

### Remaining step: point the GoDaddy domain at GitHub

`switchpowerco.com` is registered at GoDaddy and still on GoDaddy nameservers
(`ns45/ns46.domaincontrol.com`), so DNS is edited in the GoDaddy DNS panel — nameservers do
not need to change.

Go to **GoDaddy → My Products → switchpowerco.com → DNS → Manage Zones**, then:

1. **Delete the existing parking records.** There are currently two `A` records on `@`
   pointing at `76.223.105.230` and `13.248.243.5` (GoDaddy parking), and a `CNAME` on `www`.
   Remove all three. If the domain has Domain Forwarding turned on, turn that off too —
   it silently re-creates the parking records.

2. **Add four A records** on `@`, all with TTL 600:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |

3. **Add one CNAME** so `www` works:

   | Type | Name | Value |
   | --- | --- | --- |
   | CNAME | `www` | `vsmith-ctrl.github.io` |

   GoDaddy may require a trailing dot: `vsmith-ctrl.github.io.`

4. **Wait for propagation** (usually 10–60 minutes, up to a few hours), then check:

   ```bash
   dig +short switchpowerco.com A
   ```

   Once that returns the four `185.199.x.x` addresses, go to
   **GitHub → repo → Settings → Pages** and tick **Enforce HTTPS**. The certificate is issued
   automatically and can take a few minutes to appear; the tickbox stays greyed out until
   it is ready.

### Email

`careers@` and `info@switchpowerco.com` are mailboxes, not DNS records GitHub touches. They
need `MX` records, which are separate from everything above — adding the `A` records does not
affect mail. If email is already working on this domain, leave the existing `MX` and `TXT`
records alone.

## Structure

```
index.html        Recruiting page
homeowners.html   Homeowner guide
styles.css        All styles, one file
main.js           The hero switch, and the footer year
assets/
  logo-light.png  White wordmark, transparent — for black backgrounds
  logo-dark.png   Black wordmark, transparent — for white and lime backgrounds
  favicon.svg
  og.png          Social share card
```

## Design notes

The palette comes from the wordmark and nothing else: true black `#000000`, true white
`#FFFFFF`, volt lime `#D5FD52`. Pages are built as alternating full-bleed black and white
slabs, which is the same construction as the logo itself.

Lime is deliberately rare — the hero switch, the closing call to action, and the full stop
that echoes the dot on the *i*. If you add more of it, it stops meaning anything.

One typeface, Figtree, worked across weights rather than paired with a display face.

The hero switch on `index.html` is the one interactive moment on the site. It is a real
`role="switch"` button, keyboard operable, and it respects `prefers-reduced-motion`.
