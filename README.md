# switchpowerco.com

Marketing site for **Switch Power Co** — a door-to-door solar and storage sales team in
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

- [ ] **Phone number.** `tel:+15550123456` is a dummy number and appears on both pages.
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

- [ ] **Who Continuum is.** Two or three sentences, used in two places: the partner section on
      `index.html` and the "Who Switch Power Co is" section on `homeowners.html`.
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
