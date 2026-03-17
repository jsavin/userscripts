// ==UserScript==
// @name         Drummer Numpad Expand/Collapse
// @namespace    https://github.com/jsavin
// @version      1.1
// @description  Map numpad + to expand, numpad - to collapse, and numpad * to expand all outline headings in Drummer
// @author       jsavin
// @match        https://drummer.land/*
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/Drummer%20Numpad%20Expand%20Collapse.user.js
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/Drummer%20Numpad%20Expand%20Collapse.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    document.addEventListener('keydown', function (event) {
        if (event.code === 'NumpadAdd') {
            event.preventDefault();
            event.stopPropagation();
            if (typeof opExpand === 'function') {
                opExpand();
            }
        } else if (event.code === 'NumpadSubtract') {
            event.preventDefault();
            event.stopPropagation();
            if (typeof opCollapse === 'function') {
                opCollapse();
            }
        } else if (event.code === 'NumpadMultiply') {
            event.preventDefault();
            event.stopPropagation();
            if (typeof opExpandAllLevels === 'function') {
                opExpandAllLevels();
            }
        }
    }, true); // capture phase so we intercept before Drummer's own handlers
})();
