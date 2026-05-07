// ==UserScript==
// @name         Claude Design – Scale Preview
// @namespace    https://claude.ai/
// @version      2.0
// @description  Zooms only the artboard preview iframes on claude.ai/design pages. All surrounding UI (sidebar, headers, buttons, lists) stays at native size. Edit ZOOM_LEVEL to taste: 1.5 = 150%, 1.75 = 175%.
// @author       jsavin
// @match        https://claude.ai/design/*
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/Claude%20Design%20Scale%20Main%20Content.user.js
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/Claude%20Design%20Scale%20Main%20Content.user.js
// ==/UserScript==

(function () {
      'use strict';

   // ── Adjust this value: 1.5 = 150%, 1.75 = 175% ──────────────────────────
   const ZOOM_LEVEL = 1.5;
      // ─────────────────────────────────────────────────────────────────────────

   // Structure (for future maintainers):
   //
   // Each expanded artboard row contains:
   //   .sc-hXDLcI.jIBNYx   – expanded section
   //     .sc-dMEBWj.freQxK  – outer header (title, Looks good / Needs work)  ← NOT zoomed
   //     .sc-jEQrAf          – preview grid
   //       DIV > DIV
   //         .sc-hsxRXz      – iframe clip wrapper (overflow: hidden)
   //           DIV
   //             iframe[src*="claudeusercontent.com"]  ← zoomed here
   //
   // Zooming the iframe element directly scales only the rendered preview
   // content. The clip wrapper (.sc-hsxRXz) gets overflow: visible so the
   // larger iframe isn't cropped, and its height expands via a MutationObserver
   // that sets a CSS custom property from the iframe's natural height.
   //
   // The "Sign in / Shop / Quickview" tab bar lives *inside* the iframe
   // (part of the rendered app), so it zooms with the preview naturally.

   GM_addStyle(`
       /* Zoom only the preview iframes */
           iframe[src*="claudeusercontent.com"] {
                 zoom: ${ZOOM_LEVEL} !important;
                     }

                         /* Let the zoomed iframe overflow its clip wrapper instead of being cut off */
                             .sc-hsxRXz {
                                   overflow: visible !important;
                                         height: calc(var(--iframe-natural-h, 100%) * ${ZOOM_LEVEL}) !important;
                                             }
                                               `);

   // Read each iframe's natural height and expose it as a CSS var on its
   // wrapper so the calc() above can expand the wrapper to match the zoom.
   function syncHeights() {
           document.querySelectorAll('iframe[src*="claudeusercontent.com"]').forEach(iframe => {
                     const wrapper = iframe.closest('.sc-hsxRXz');
                     if (!wrapper) return;
                     const h = iframe.offsetHeight || parseFloat(iframe.getAttribute('height'));
                     if (h) wrapper.style.setProperty('--iframe-natural-h', h + 'px');
           });
   }

   syncHeights();

   // Re-run whenever the DOM changes (artboards load lazily)
   const observer = new MutationObserver(syncHeights);
      observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['height', 'style', 'src']
      });

})();
