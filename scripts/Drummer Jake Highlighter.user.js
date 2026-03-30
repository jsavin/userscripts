// ==UserScript==
// @name         Drummer Jake Highlighter
// @namespace    https://github.com/jsavin
// @version      1.10
// @description  Highlights "Jake" (case-insensitive) in read-only Drummer outlines; auto-expands the topmost month heading to reveal Jake mentions. Strips highlight marks from both the system clipboard and Drummer's internal clipboard when copying. Toggle with Alt+J (Option+J on macOS).
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
    // Drummer copies nodes via two mechanisms that both need cleaning:
    //
    // 1. SYSTEM CLIPBOARD (for paste into external apps):
    //    Drummer writes OPML text into a hidden <pre> inside .pasteBin and lets
    //    the browser do a native copy. Our <mark> wrappers end up HTML-escaped
    //    in the <pre> as literal text: &lt;mark class="jake-hl"&gt;jake&lt;/mark&gt;
    //    We strip those escaped tags before the browser reads the content.
    //
    // 2. INTERNAL CLIPBOARD (for Cmd+V paste within Drummer):
    //    Drummer stores a deep DOM clone in jQuery.cache under the key "clipboard"
    //    on the concord root element. That clone contains our actual
    //    <mark class="jake-hl"> DOM nodes. We scan jQuery.cache and unwrap them.
    document.addEventListener('copy', function (e) {
        // Part 1: clean the pasteBin <pre> for the system clipboard
        var pre = e.target;
        if (pre && pre.tagName === 'PRE' && pre.closest && pre.closest('.pasteBin')) {
            var html = pre.innerHTML;
            if (html.includes('jake-hl')) {
                var cleaned = html.replace(
                    /&lt;mark\b[^&]*&gt;(.*?)&lt;\/mark&gt;/g, '$1'
                );
                if (cleaned !== html) pre.innerHTML = cleaned;
            }
        }

    }, true);

    document.addEventListener('copy', function (e) {
        // Part 2: clean window.concordClipboard (Drummer's global cross-outliner clipboard)
        // ConcordEvents sets concordClipboard = {text: opmlText, data: jQueryClonedLI}
        // before the 'copy' event fires, so we can clean it here.
        if (typeof concordClipboard !== 'undefined' && concordClipboard) {
            // Clean the DOM clipboard (.data) - unwrap any mark.jake-hl elements
            if (concordClipboard.data && concordClipboard.data.find) {
                concordClipboard.data.find('mark.jake-hl').each(function () {
                    jQuery(this).replaceWith(document.createTextNode(this.textContent));
                });
            }
            // Clean the OPML text clipboard (.text) - strip raw HTML mark tags
            if (typeof concordClipboard.text === 'string' && concordClipboard.text.indexOf('jake-hl') !== -1) {
                concordClipboard.text = concordClipboard.text.replace(
                    /<mark\b[^>]*>(.*?)<\/mark>/g, '$1'
                );
            }
        }
    }, false); // bubble: runs after pasteBin.on('copy') re-sets concordClipboard

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
