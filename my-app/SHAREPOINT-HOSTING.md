# Hosting the Cascading Intake Form on SharePoint (SPFx)

The React form reads the **Discipline → ProjectCategory → Baseline** cascade from
three SharePoint lists on `AmazonProjectsPK` and submits to `IntakeList`. The
SharePoint data provider calls the SharePoint REST API with the signed-in user's
auth. That only works when the app runs **inside a SharePoint-authenticated,
same-origin context** — it cannot authenticate from the standalone Vite dev
server (`npm run dev` on localhost), which is why `VITE_DATA_SOURCE=mock` is the
default for local work.

To run the form against the **live lists in the browser**, host it as a
**SharePoint Framework (SPFx) web part** on the site. SPFx runs your code on the
SharePoint page itself, so REST calls carry the user's auth automatically — no
CORS or token wrangling.

---

## Prerequisites

- Node.js LTS (already installed) and the SPFx toolchain:
  ```
  npm install --global yo @microsoft/generator-sharepoint gulp-cli
  ```
  SPFx is version-sensitive to Node — check the current support matrix before
  installing, and use the Node version SPFx requires if it differs from your
  global LTS (nvm-windows makes switching easy).
- Permission to upload to your tenant **App Catalog** (or ask an admin to deploy
  the package).

---

## Option A — Wrap the existing React app in an SPFx web part

This reuses the components and services in `src/` with minimal changes.

1. **Scaffold an SPFx web part** in a new folder (not inside `my-app`):
   ```
   md spfx-intake && cd spfx-intake
   yo @microsoft/sharepoint
   ```
   Choose: **WebPart**, framework **React**, name e.g. `IntakeForm`.

2. **Copy the reusable code** from `my-app/src` into the web part's `src`:
   - `components/CascadingIntakeForm.tsx`
   - `services/types.ts`, `services/cascadeData.ts`,
     `services/sharepointConfig.ts`, `services/sharepointCascade.ts`
   - You can drop `services/provider.ts` and import `sharepointCascadeProvider`
     directly in the web part (SPFx is always the SharePoint context), or keep
     the factory and hardwire it to SharePoint.

3. **Render the form** from the web part's React root:
   ```tsx
   import { CascadingIntakeForm } from './components/CascadingIntakeForm';
   import { sharepointCascadeProvider } from './services/sharepointCascade';
   // ...
   <CascadingIntakeForm provider={sharepointCascadeProvider} />
   ```

4. **Point config at the current site.** In `services/sharepointConfig.ts` the
   `siteUrl` is hardcoded to the absolute AmazonProjectsPK URL, which is fine
   since the lists live there. If you ever host the web part on a *different*
   site but read the same lists, keep the absolute URL. (If the lists were
   local to the hosting site, you'd switch to the SPFx context's
   `this.context.pageContext.web.absoluteUrl` instead.)

5. **Prefer the SPFx HTTP client (recommended).** The provider currently uses
   `fetch(..., { credentials: 'include' })`, which works on-page. The more
   idiomatic SPFx approach is `SPHttpClient`, which handles the request digest
   for writes for you. If you adopt it, replace the `fetch`/`getRequestDigest`
   calls in `sharepointCascade.ts` with `this.context.spHttpClient` passed into
   the provider. Either works; `SPHttpClient` is cleaner for the POST.

6. **Test in the workbench** against the real site:
   ```
   gulp serve --nobrowser
   ```
   then open:
   `https://amazon.sharepoint.com/sites/AmazonProjectsPK/_layouts/15/workbench.aspx`
   Add the web part — the dropdowns load live Discipline/Category/Baseline data
   and Submit writes to IntakeList.

7. **Package and deploy:**
   ```
   gulp bundle --ship
   gulp package-solution --ship
   ```
   Upload the generated `.sppkg` (in `sharepoint/solution/`) to the tenant
   **App Catalog**, approve it, then add the app to the site and drop the web
   part on a page.

---

## Option B — Keep the standalone Vite app, host elsewhere with delegated auth

If you'd rather keep the Vite build as-is, it must run somewhere that can obtain
a SharePoint access token for the user (e.g. an app registered in Entra ID with
`Sites.ReadWrite.All` delegated, using MSAL to get a token and calling the
SharePoint/Graph API with a Bearer header instead of cookies). This is more
setup than SPFx and is only worth it if the form must live outside SharePoint.
For a form that lives *on* the site, Option A is the straightforward path.

---

## Which to choose

- **Form lives on the SharePoint site** → **Option A (SPFx)**. Auth is free,
  deployment is a package upload.
- **Form must be a standalone web app / Power Apps Code App** → use delegated
  auth (Option B) or, for the Code App path, the Dataverse/connector route
  described in `DATAVERSE-SETUP.md` rather than direct SharePoint REST.

The provider abstraction (`CascadeDataProvider`) means the UI and cascade logic
don't change between any of these — only which provider is wired in.
