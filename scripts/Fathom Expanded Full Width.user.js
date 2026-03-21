// ==UserScript==
// @name         Fathom Expanded Full Width
// @namespace    https://fathom.video/
// @version      1.1
// @description  Expands the video to full page width when in "Expanded" layout mode on fathom.video, with the notes panel stacked below
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
  const SEL_PCD        = 'page-call-detail';
  const SEL_PCD_INNER  = `${SEL_PCD} > div.flex.relative.flex-col`;
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
    const row        = document.querySelector(SEL_ROW);
    const pcd        = document.querySelector(SEL_PCD);
    const pcdInner   = document.querySelector(SEL_PCD_INNER);
    if (!left || !right || !row || left.hasAttribute(FLAG_ATTR)) return;

    // Stack the two panels vertically instead of side-by-side
    row.style.flexDirection = 'column';
    row.style.height        = 'auto';
    row.style.overflowY     = 'auto';

    // Left (video + notes) panel: full width
    left.style.maxWidth = '100%';
    left.style.width    = '100%';

    // Right (sidebar) panel: full width, natural height, stacked below
    right.style.maxWidth   = '100%';
    right.style.width      = '100%';
    right.style.height     = 'auto';
    right.style.flexShrink = '0';

    // Allow the outer containers to grow to fit the stacked content
    if (pcd)      { pcd.style.overflowY = 'auto'; pcd.style.height = 'auto'; }
    if (pcdInner) { pcdInner.style.height = 'auto'; }

    // Reset the transcript's negative left margin (used for side-panel layout)
    if (transcript) transcript.style.marginLeft = '0';

    left.setAttribute(FLAG_ATTR, 'true');
  }

  function revertFix() {
    const left       = document.querySelector(SEL_LEFT);
    const right      = document.querySelector(SEL_RIGHT);
    const transcript = document.querySelector(SEL_TRANSCRIPT);
    const row        = document.querySelector(SEL_ROW);
    const pcd        = document.querySelector(SEL_PCD);
    const pcdInner   = document.querySelector(SEL_PCD_INNER);
    if (!left || !left.hasAttribute(FLAG_ATTR)) return;

    row.style.flexDirection = '';
    row.style.height        = '';
    row.style.overflowY     = '';

    left.style.maxWidth = '';
    left.style.width    = '';

    if (right) {
      right.style.maxWidth   = '';
      right.style.width      = '';
      right.style.height     = '';
      right.style.flexShrink = '';
    }

    if (pcd)      { pcd.style.overflowY = ''; pcd.style.height = ''; }
    if (pcdInner) { pcdInner.style.height = ''; }
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
    const existing = document.querySelector(SEL_PCD);
    if (existing) { callback(existing); return; }

    const mo = new MutationObserver(() => {
      const el = document.querySelector(SEL_PCD);
      if (el) { mo.disconnect(); callback(el); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────
  waitForRoot(function () {
    // Run once on load
    update();

    // Watch for inline style changes on the left section and right panel,
    // which is what Fathom mutates when switching between Regular / Expanded.
    const observer = new MutationObserver(update);

    const row = document.querySelector(SEL_ROW);
    if (row) {
      observer.observe(row, { childList: true, subtree: true, attributes: true,
                              attributeFilter: ['style', 'class'] });
    }
  });

})();
