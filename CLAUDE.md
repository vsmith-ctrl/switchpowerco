# switchpowerco.com

Static site, no build. See README.md for everything else.

## Privacy is a hard constraint

`privacy.html` states that the site has no forms, cookies, storage, analytics or third-party
requests, and lists exactly what people are invited to email us. California law (CalOPPA, and
the CCPA if Switch ever meets its thresholds) makes that page a binding statement.

- Any change that adds a form, embed, script, font, image or link that loads from another
  origin, or any browser storage or network call, must update `privacy.html` in the same change
  and bump its "Last updated" date. Better: don't add it.
- Any new call to action that asks people to send personal information (a photo, a document, a
  phone number) must be added to the "What you might send us" section and get a notice beside it.
- Run `bash scripts/privacy-check.sh` before pushing. CI runs it too, and it must stay green.
