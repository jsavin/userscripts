// ==UserScript==
// @name         LinkedIn Messaging Full Width
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Full width messaging - hide right sidebar, keep message list
// @match        https://www.linkedin.com/messaging/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const style = `
        /* HIDE RIGHT SIDEBAR (ADS AND FOOTER) */
        aside.scaffold-layout__aside {
            display: none !important;
        }

        /* EXPAND MAIN CONTENT TO FULL WIDTH */
        main {
            max-width: 100% !important;
            width: 100% !important;
            flex: 1 !important;
        }

        /* REMOVE GRID COLUMNS FOR RIGHT SIDEBAR */
        .scaffold-layout__row.scaffold-layout__content {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            width: 100% !important;
        }

        /* FULL WIDTH CONTAINERS */
        .scaffold-layout__inner {
            width: 100% !important;
            max-width: 100% !important;
        }

        .scaffold-layout-container {
            width: 100% !important;
            max-width: 100% !important;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);

    console.log('LinkedIn full width messaging activated');
})();
