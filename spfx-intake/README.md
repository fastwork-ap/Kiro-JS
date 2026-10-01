# spfx-intake — Project Intake Form (SPFx web part)

A SharePoint Framework (SPFx) web part that renders the cascading
**Discipline → Project Category → Baseline** intake form on a SharePoint page
and submits requests to **IntakeList**. Because it runs on the page as the
signed-in user, its REST calls to the lists are authenticated automatically
(no CORS/token setup) — this is the piece the standalone `my-app` build could
not do.

Target site: `https://amazon.sharepoint.com/sites/AmazonProjectsPK`
Lists used: `Discipline`, `ProjectCategory`, `Baseline`, `IntakeList`

---

## Project layout

```
spfx-intake/
├── config/                      # SPFx build config (bundles, package-solution, serve)
├── src/webparts/intakeForm/
│   ├── IntakeFormWebPart.ts     # web part entry; builds the provider from SPFx context
│   ├── IntakeFormWebPart.manifest.json
│   ├── components/
│   │   ├── CascadingIntakeForm.tsx        # the form (cascading dropdowns + submit)
│   │   └── CascadingIntakeForm.module.scss
│   ├── services/
│   │   ├── types.ts             # models + CascadeDataProvider interface
│   │   └── sharepointCascade.ts # SPHttpClient implementation
│   └── loc/                     # localized strings
├── package.json                 # SPFx 1.21.1 deps, React 17
├── tsconfig.json
└── gulpfile.js
```

---

## Prerequisites (one-time)

SPFx is **Node-version-sensitive**. SPFx 1.21.x / 1.22.x build on **Node.js 22 LTS**.
Your machine's global Node is 24, which the gulp toolchain will reject — install
Node 22 and switch to it for SPFx work (nvm-windows makes this painless):

```powershell
# with nvm-windows
nvm install 22.14.0
nvm use 22.14.0
node -v   # should print v22.x
```

Install the SPFx toolchain globally (once):

```powershell
npm install --global gulp-cli yo @microsoft/generator-sharepoint
```

---

## Editor-only note: $schema keys

The files under `config/` and the manifest were authored without the
`"$schema"` property (it is purely for editor IntelliSense and is not required
to build). If you want red-squiggle validation in VS Code, you may add the
standard SPFx `$schema` URLs back to `config/config.json`,
`config/package-solution.json`, `config/serve.json`,
`config/write-manifests.json`, and `*.manifest.json`. Building does not need them.

---

## Install dependencies

From this folder (on Node 22):

```powershell
npm install
```

---

## Run against the live site (debug)

```powershell
gulp serve --nobrowser
```

Then open the hosted workbench (serve.json already points at it):

```
https://amazon.sharepoint.com/sites/AmazonProjectsPK/_layouts/workbench.aspx
```

Add the **Project Intake Form** web part. The dropdowns load live
Discipline/ProjectCategory/Baseline data; **Submit** writes a row to IntakeList
(Title, Discipline, ProjectCategory, Baseline, RequestStatus, Description).

> First-time debugging on a site may prompt you to **"Load debug scripts."** Accept it.

---

## Package and deploy to production

```powershell
gulp bundle --ship
gulp package-solution --ship
```

This produces `sharepoint/solution/spfx-intake.sppkg`. Then:

1. Go to your **tenant App Catalog**
   (e.g. `https://amazon.sharepoint.com/sites/appcatalog` — ask your admin if unsure).
2. Upload `spfx-intake.sppkg` to **Apps for SharePoint**.
3. When prompted, choose to make it available (and **Deploy**). Approving the
   package may require **tenant admin** rights.
4. On the AmazonProjectsPK site: **Site contents → New → App → add "spfx-intake"**.
5. Edit a page → add the **Project Intake Form** web part → publish.

---

## Permissions

The web part calls SharePoint REST as the signed-in user, so each user needs at
least:
- **Read** on `Discipline`, `ProjectCategory`, `Baseline` (to load the cascade)
- **Contribute** (add items) on `IntakeList` (to submit)

No app-only permissions or API approval are required for this list-level REST
access.

---

## Changing the target site or lists

- Site URL is taken at runtime from the SPFx context
  (`this.context.pageContext.web.absoluteUrl`), so the web part reads lists on
  **whichever site it's placed on**. The three cascade lists must exist on that
  site with the same titles and columns. To read lists from a *fixed* site
  regardless of host page, hardcode the URL where the provider is constructed in
  `IntakeFormWebPart.ts`.
- List titles and the Active-only filter are constants at the top of
  `services/sharepointCascade.ts`.
