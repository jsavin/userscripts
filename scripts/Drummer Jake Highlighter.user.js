// ==UserScript==
// @name         Drummer Jake Highlighter
// @namespace    https://github.com/jsavin
// @version      1.5
// @description  Highlights "Jake" (case-insensitive) in read-only Drummer outlines; auto-expands the topmost month heading to reveal Jake mentions. Strips highlight marks from clipboard on copy. Toggle with Alt+J (Option+J on macOS).
// @author       jsavin
// @match        https://drummer.land/*
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/Drummer%20Jake%20Highlighter.user.js
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/Drummer%20Jake%20Highlighter.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ── Constants ──────────────────────────────────────────────────────────────────────────────
    const JAKE_RE   = /jake/gi;
    const HL_OPEN   = '<mark class="jake-hl">';
    const HL_CLOSE  = '</mark>';
    const ORIG_ATTR = 'data-jake-original';

    // Toggle state – highlighting starts ON
    let highlightEnabled = true;

    // ── Read-only check ───────────────────────────────────────────────────────────────────
    // Returns true only if the given outliner element contains a read-only outline.
    // Drummer sets class 'readonly' on the root <ol> of outlines you don't own.
    function isReadOnlyOutliner(outliner) {
        const rootOl = outliner.querySelector('ol.concord');
        return rootOl ? rootOl.classList.contains('readonly') : false;
    }

    // ── Inject CSS ─────────────────────────────────────────────────────────────────────────────────
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

    // ── Highlight a single .concord-text element ──────────────────────────────────────────────
    function highlightEl(el) {
        // Cache the original plain text so we can always restore or re-apply cleanly
        let orig = el.getAttribute(ORIG_ATTR);
        if (orig === null) {
            orig = el.textContent;
            el.setAttribute(ORIG_ATTR, orig);
        }

        if (!highlightEnabled) {
            // Restore plain text when toggled off
            if (el.innerHTML !== orig) el.innerHTML = orig;
            return;
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

    // ── Apply highlighting to every visible outliner ──────────────────────────────────────────
    function highlightAll() {
        document.querySelectorAll('.divOutliner').forEach(function (outliner) {
            if (getComputedStyle(outliner).display === 'none') return;
            if (!isReadOnlyOutliner(outliner)) return;
            outliner.querySelectorAll('.concord-text').forEach(highlightEl);
        });
    }

    // ── Fully expand an li and ALL of its descendants (one-way only) ────────────────────
    // Never collapses anything that is already expanded.
    function fullExpandSubtree(li) {
        li.classList.remove('collapsed');
        const childOl = li.querySelector(':scope > ol');
        if (childOl) {
            Array.from(childOl.children).forEach(fullExpandSubtree);
        }
    }

    // ── Recursively open the path to Jake nodes; fully expand Jake nodes ──────
    // - Nodes whose own text contains "jake": fully expanded (all children shown).
    // - Ancestors of Jake nodes: opened just enough to reveal the Jake node.
    // Never adds "collapsed" — only removes it.
    function expandToJake(li) {
        const wrapper = li.querySelector(':scope > .concord-wrapper');
        const textEl   = wrapper ? wrapper.querySelector('.concord-text') : null;
        let selfMatch = false;
        if (textEl) {
            const txt = textEl.getAttribute(ORIG_ATTR) || textEl.textContent;
            JAKE_RE.lastIndex = 0;
            selfMatch = JAKE_RE.test(txt);
            JAKE_RE.lastIndex = 0;
        }

        if (selfMatch) {
            // This heading itself contains "Jake": fully open it and all children
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
            // A descendant has "jake": open this node to reveal the path
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

    // ── Debounced highlight ─────────────────────────────────────────────────────────────────────────────────
    let hlTimer = null;
    function scheduleHighlight(delay) {
        clearTimeout(hlTimer);
        hlTimer = setTimeout(highlightAll, delay || 60);
    }

    // ── Alt/Option+J toggle ─────────────────────────────────────────────────────────────────────────────────
    // Uses e.code ('KeyJ') rather than e.key ('j') so it works correctly on
    // macOS where Option+J produces '∆' and e.key would never equal 'j'.
    document.addEventListener('keydown', function (e) {
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyJ') {
            e.preventDefault();
            e.stopPropagation();
            highlightEnabled = !highlightEnabled;
            highlightAll();
        }
    }, true); // capture phase so we see it before Drummer's handlers


    // ── Strip highlight marks from clipboard on copy ─────────────────────────────────
    // When the user copies text that contains highlighted spans, prevent the
    // <mark class="jake-hl"> tags from ending up in the clipboard. Instead write
    // the plain unwrapped text (and clean HTML) to the clipboard ourselves.
    document.addEventListener('copy', function (e) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        // Only act if the selection touches a .concord-text node that has marks
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const root = container.nodeType === 1 ? container : container.parentElement;
        if (!root) return;

        // Check whether any jake-hl mark is within (or is) the selection root
        const hasMarks = root.querySelector
            ? root.querySelector('mark.jake-hl') !== null
            : root.closest && root.closest('mark.jake-hl') !== null;
        if (!hasMarks) return;

        // Clone the range contents so we can scrub the marks without touching the DOM
        const fragment = range.cloneContents();
        const tmp = document.createElement('div');
        tmp.appendChild(fragment);

        // Unwrap every <mark class="jake-hl"> – replace with its text content
        tmp.querySelectorAll('mark.jake-hl').forEach(function (mark) {
            const text = document.createTextNode(mark.textContent);
            mark.parentNode.replaceChild(text, mark);
        });

        const cleanHTML = tmp.innerHTML;
        const cleanText = tmp.textContent;

        e.preventDefault();
        e.clipboardData.setData('text/html', cleanHTML);
        e.clipboardData.setData('text/plain', cleanText);
    }, true);

    // ── MutationObserver ───────────────────────────────────────────────────────────────────────────────────
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
                // Detect fresh outline load (children added to the root ol)
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
                if (isReadOnlyOutliner(newOutliner)) {
                    autoExpand(newOutliner);
                    highlightAll();
                }
            }, 120);
        } else if (needsHL) {
            scheduleHighlight();
        }
    });

    const outlines = document.getElementById('idOutlines');
    if (outlines) {
        observer.observe(outlines, {
            subtree:         true,
            attributes:      true,
            attributeFilter: ['class', 'style'],
            childList:       true,
            characterData:   true
        });
    }

    // ── Initial run with retry ─────────────────────────────────────────────────────────────────────────────────
    // Drummer loads outline content asynchronously. We poll until at least one
    // .concord-text element is present, then run the initial highlight + expand.
    // The MutationObserver above handles subsequent loads, but if content was
    // already in the DOM before our observer started we need this initial pass.
    let initAttempts = 0;
    const MAX_ATTEMPTS = 20;  // up to ~10 seconds total

    function tryInit() {
        const activeOutliner = Array.from(
            document.querySelectorAll('.divOutliner')
        ).find(o => getComputedStyle(o).display !== 'none');

        const hasContent = activeOutliner &&
            activeOutliner.querySelector('.concord-text') !== null;

        if (hasContent) {
            if (isReadOnlyOutliner(activeOutliner)) {
                autoExpand(activeOutliner);
                highlightAll();
            }
            return; // success
        }

        initAttempts++;
        if (initAttempts < MAX_ATTEMPTS) {
            setTimeout(tryInit, 500); // retry every 500ms
        }
    }

    // First attempt after a short delay to let Drummer's JS settle
    setTimeout(tryInit, 300);

    // Also hook into concord.onResume if available – fires when the outliner
    // becomes active/ready, which is a reliable signal that content is present.
    if (window.concord && typeof window.concord.onResume === 'function') {
        window.concord.onResume(function () {
            const activeOutliner = Array.from(
                document.querySelectorAll('.divOutliner')
            ).find(o => getComputedStyle(o).display !== 'none');
            if (activeOutliner) {
                if (isReadOnlyOutliner(activeOutliner)) {
                    autoExpand(activeOutliner);
                    highlightAll();
                }
            }
        });
    }

})();
