// ==UserScript==
// @name         Drummer Jake Highlighter
// @namespace    https://github.com/jsavin
// @version      1.1
// @description  Highlights "Jake" (case-insensitive) in Drummer outlines; auto-expands the topmost month heading to reveal Jake mentions on outline load.
// @author       jsavin
// @match        https://drummer.land/*
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/Drummer%20Jake%20Highlighter.user.js
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/Drummer%20Jake%20Highlighter.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ── Constants ─────────────────────────────────────────────────────────────
    const JAKE_RE  = /jake/gi;
    const HL_OPEN  = '<mark class="jake-hl">';
    const HL_CLOSE = '</mark>';
    const ORIG_ATTR = 'data-jake-original';

    // ── Inject CSS ────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        mark.jake-hl {
            background: #ffff00;
            color: #333333;
            border-radius: 2px;
            padding: 0 1px;
        }
    `;
    document.head.appendChild(style);

    // ── Highlight a single .concord-text element ──────────────────────────────
    function highlightEl(el) {
        // Use stored original to avoid re-processing already-marked HTML
        let orig = el.getAttribute(ORIG_ATTR);
        if (orig === null) {
            orig = el.textContent;           // first visit: cache plain text
            el.setAttribute(ORIG_ATTR, orig);
        }

        JAKE_RE.lastIndex = 0;
        if (!JAKE_RE.test(orig)) {
            if (el.innerHTML !== orig) el.innerHTML = orig;
            return;
        }

        JAKE_RE.lastIndex = 0;
        const newHTML = orig.replace(JAKE_RE, (m) => HL_OPEN + m + HL_CLOSE);
        if (el.innerHTML !== newHTML) el.innerHTML = newHTML;
    }

    // ── Apply highlighting to every visible outliner ──────────────────────────
    function highlightAll() {
        document.querySelectorAll('.divOutliner').forEach(function (outliner) {
            if (getComputedStyle(outliner).display === 'none') return;
            outliner.querySelectorAll('.concord-text').forEach(highlightEl);
        });
    }

    // ── Fully expand an li and ALL of its descendants (one-way only) ──────────
    // Never collapses anything that is already expanded.
    function fullExpandSubtree(li) {
        li.classList.remove('collapsed');
        const childOl = li.querySelector(':scope > ol');
        if (childOl) {
            Array.from(childOl.children).forEach(fullExpandSubtree);
        }
    }

    // ── Recursively open the path to Jake nodes; fully expand Jake nodes ──────
    // Returns true if this li (or any descendant) contains "jake".
    // - Ancestors of Jake nodes: expanded just enough to make the Jake node visible.
    // - Nodes whose own text contains "jake": fully expanded (all descendants shown).
    // Never removes an already-absent "collapsed" class (no-op) and never adds one.
    function expandToJake(li) {
        // Check this node's own text
        const wrapper = li.querySelector(':scope > .concord-wrapper');
        const textEl  = wrapper ? wrapper.querySelector('.concord-text') : null;
        let selfMatch = false;
        if (textEl) {
            const txt = textEl.getAttribute(ORIG_ATTR) || textEl.textContent;
            JAKE_RE.lastIndex = 0;
            selfMatch = JAKE_RE.test(txt);
            JAKE_RE.lastIndex = 0;
        }

        if (selfMatch) {
            // This heading itself contains "Jake": fully expand it and all its
            // descendants so every child is visible.
            fullExpandSubtree(li);
            return true;
        }

        // Recurse into children to find Jake deeper in the tree
        const childOl = li.querySelector(':scope > ol');
        let childMatch = false;
        if (childOl) {
            childMatch = Array.from(childOl.children).some(expandToJake);
        }

        if (childMatch) {
            // A descendant has "jake": expand this node just enough to reveal
            // the path, but leave unrelated sibling subtrees as-is.
            li.classList.remove('collapsed');
        }

        return childMatch;
    }

    // ── Auto-expand topmost month heading in an outliner ──────────────────────
    function autoExpand(outliner) {
        const rootOl = outliner.querySelector('ol.concord');
        if (!rootOl) return;
        const firstMonth = rootOl.firstElementChild;
        if (firstMonth) expandToJake(firstMonth);
    }

    // ── Debounced highlight ───────────────────────────────────────────────────
    let hlTimer = null;
    function scheduleHighlight(delay) {
        clearTimeout(hlTimer);
        hlTimer = setTimeout(highlightAll, delay || 60);
    }

    // ── MutationObserver ──────────────────────────────────────────────────────
    const observer = new MutationObserver(function (mutations) {
        let needsHL = false;
        let newOutliner = null;

        for (const mut of mutations) {
            if (mut.type === 'attributes') {
                const t = mut.target;

                // Tab switch: outliner style toggled to visible
                if (t.classList && t.classList.contains('divOutliner') &&
                    mut.attributeName === 'style') {
                    if (getComputedStyle(t).display !== 'none') {
                        newOutliner = t;
                    }
                }

                // Expand / collapse on a list node
                if (t.classList && t.classList.contains('concord-node') &&
                    mut.attributeName === 'class') {
                    needsHL = true;
                }
            }

            if (mut.type === 'childList' && mut.addedNodes.length > 0) {
                needsHL = true;
                // Detect fresh outline load (added directly to root ol)
                const parentOl = mut.target;
                if (parentOl.classList &&
                    parentOl.classList.contains('concord') &&
                    parentOl.classList.contains('concord-root')) {
                    const outliner = parentOl.closest('.divOutliner');
                    if (outliner && getComputedStyle(outliner).display !== 'none') {
                        newOutliner = outliner;
                    }
                }
            }

            if (mut.type === 'characterData') {
                const p = mut.target.parentElement;
                if (p && p.classList && p.classList.contains('concord-text')) {
                    p.removeAttribute(ORIG_ATTR);   // stale cache – reset
                    needsHL = true;
                }
            }
        }

        if (newOutliner) {
            setTimeout(function () {
                autoExpand(newOutliner);
                highlightAll();
            }, 120);
        } else if (needsHL) {
            scheduleHighlight();
        }
    });

    const outlines = document.getElementById('idOutlines');
    if (outlines) {
        observer.observe(outlines, {
            subtree:          true,
            attributes:       true,
            attributeFilter:  ['class', 'style'],
            childList:        true,
            characterData:    true
        });
    }

    // ── Initial run ───────────────────────────────────────────────────────────
    setTimeout(function () {
        document.querySelectorAll('.divOutliner').forEach(function (outliner) {
            if (getComputedStyle(outliner).display !== 'none') {
                autoExpand(outliner);
            }
        });
        highlightAll();
    }, 600);

})();
