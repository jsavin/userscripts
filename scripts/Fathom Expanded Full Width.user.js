// ==UserScript==
// @name         Fathom Expanded Full Width
// @namespace    https://fathom.video/
// @version      1.0
// @description  Expands the video to full page width when in "Expanded" layout mode on fathom.video
// @author       jsavin
// @match        https://fathom.video/share/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

   // ─── Selectors ────────────────────────────────────────────────────────────
   const SEL_ROW        = 'page-call-detail > div:nth-child(2) > div';
    const SEL_LEFT       = `${SEL_ROW} > section`;
    const SEL_RIGHT      = 'page-call-detail-notes';
    const SEL_TRANSCRIPT = 'page-call-detail-transcript';
    const FLAG_ATTR      = 'data-fathom-expanded-fix';

   // ─── Mode detection ───────────────────────────────────────────────────────
   // "Expanded" mode = right notes panel is visible AND left section has no
   // inline max-width (i.e. its style attribute is empty or lacks max-width).
   function isExpandedMode() {
         const left  = document.querySelector(SEL_LEFT);
         const right = document.querySelector(SEL_RIGHT);
         if (!left || !right) return false;
         const rightVisible      = window.getComputedStyle(right).display !== 'none';
         const leftHasNoMaxWidth = !left.style.maxWidth;
         return rightVisible && leftHasNoMaxWidth;
   }

   // ─── Apply / revert ───────────────────────────────────────────────────────
   function applyFix() {
         const left       = document.querySelector(SEL_LEFT);
         const right      = document.querySelector(SEL_RIGHT);
         const transcript = document.querySelector(SEL_TRANSCRIPT);
         if (!left || !right || left.hasAttribute(FLAG_ATTR)) return;

      left.style.maxWidth = '100%';
         right.style.setProperty('display', 'none', 'important');
         if (transcript) transcript.style.marginLeft = '0';

      left.setAttribute(FLAG_ATTR, 'true');
   }

   function revertFix() {
         const left       = document.querySelector(SEL_LEFT);
         const right      = document.querySelector(SEL_RIGHT);
         const transcript = document.querySelector(SEL_TRANSCRIPT);
         if (!left || !left.hasAttribute(FLAG_ATTR)) return;

      left.style.maxWidth = '';
         if (right) right.style.removeProperty('display');
         if (transcript) transcript.style.marginLeft = '';

      left.removeAttribute(FLAG_ATTR);
   }

   // ─── React to mode changes ────────────────────────────────────────────────
   function update() {
         if (isExpandedMode()) {
                 applyFix();
         } else {
                 revertFix();
         }
   }

   // ─── Wait for the page-call-detail element to exist ───────────────────────
   function waitForRoot(callback) {
         const existing = document.querySelector('page-call-detail');
         if (existing) { callback(existing); return; }

      const mo = new MutationObserver(() => {
              const el = document.querySelector('page-call-detail');
              if (el) { mo.disconnect(); callback(el); }
      });
         mo.observe(document.body, { childList: true, subtree: true });
   }

   // ─── Boot ─────────────────────────────────────────────────────────────────
   waitForRoot(function (root) {
         // Run once on load
                   update();

                   // Watch for inline style changes on the left section and right panel,
                   // which is what Fathom mutates when switching between Regular / Expanded.
                   const observer = new MutationObserver(update);

                   // Observe the flex-row container so we catch child additions/removals too
                   const row = document.querySelector(SEL_ROW);
         if (row) {
                 observer.observe(row, { childList: true, subtree: true, attributes: true,
                                                                      attributeFilter: ['style', 'class'] });
         }
   });

})();
