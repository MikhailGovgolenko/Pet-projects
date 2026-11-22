# MathJax

Vendored copy of MathJax **3.2.2** used by the `/lens/notes` page.

- Source: <https://www.npmjs.com/package/mathjax/v/3.2.2>
- File: `es5/tex-svg-full.js`
- License: Apache-2.0 (see `LICENSE`)

The page loads MathJax from this folder instead of a CDN so typesetting does not
wait for an external network round-trip. To upgrade, download a newer
`es5/tex-svg-full.js` from the `mathjax` npm package and replace the file here.
