# Little Log

A static baby-tracking web app designed for GitHub Pages, using a Google Apps Script web app as its data endpoint.

## Deploy on GitHub Pages

1. Upload all files in this repository to the repository root.
2. In GitHub, open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and `/ (root)`, then save.
5. Open the Pages URL shown by GitHub. Do not open the raw HTML file URL.

The app is preconfigured for this endpoint:

`https://script.google.com/macros/s/AKfycbzvo2Vn5_0jld4hxNyKyNyeT6mjWiOtlgNxNvU77wpi5f7W3tuRWO2M_j7R2TzTJ6TsLA/exec`

## Reliability features

- `index.html` works as the repository root entry point.
- Writes are stored locally before network transmission.
- A persistent outbox survives reloads and temporary connection failures.
- Server and local records are merged by `id` and `updatedAt`.
- Requests time out instead of hanging indefinitely.
- The app shell is cached for offline loading after the first successful visit.
- Sync and offline status are visible in the interface.

## Google Apps Script requirements

Deploy the script as a Web App with access available to the intended users. The endpoint must support GET and POST and return JSON with `result: "success"`.


## If an older version remains cached

After deploying, open the Pages site with `?v=20260715-2` once. If needed, remove the existing home-screen shortcut, clear the site's browser data, and reopen the Pages address before adding it to the home screen again.


## Build 2026-07-15.3 fix

This build fixes a startup error when the local cache contains records but every record is marked deleted. Open the deployed site once with `?v=20260715-3` after uploading the replacement files.
