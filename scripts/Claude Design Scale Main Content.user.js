// ==UserScript==
// @name         Claude Design – Scale Main Content
// @namespace    https://claude.ai/
// @version      1.0
// @description  Keeps the left sidebar at native scale; zooms the main content panel. Edit ZOOM_LEVEL to taste: 1.5 = 150%, 1.75 = 175%.
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

   // Claude's design tool uses styled-components. The sc-* class names are the
   // stable component identifiers; the second (hash) class regenerates on style
   // changes, so we target only the sc-* names here.
   //
   // Layout (flex row, rendered below the 40px top nav bar):
   //   .sc-eirsSv  – sidebar wrapper  (flex: 0 0 auto, ~400px)
   //   .sc-FRnNS   – drag-resize handle (8px)
   //   .sc-dvXVLn  – main content panel (flex: 1 1 0%, takes remaining width)

   GM_addStyle(`
       /* Scale up the main content panel */
           .sc-dvXVLn {
                 zoom: ${ZOOM_LEVEL} !important;
                     }

                         /* Ensure the sidebar never flex-shrinks into the zoomed panel */
                             .sc-eirsSv {
                                   flex-shrink: 0 !important;
                                       }
                                         `);

})();
