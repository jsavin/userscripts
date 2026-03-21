// ==UserScript==
// @name         GitHub Tab Navigator
// @namespace    http://tampermonkey.net/
// @version      2.0.3
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/GitHub%20Tab%20Navigator.user.js
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/GitHub%20Tab%20Navigator.user.js
// @description  Navigate GitHub repository tabs with number keys (1-0)
// @author       jsavin
// @match        https://github.com/*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keydown', function(e) {
        // If Cmd is held, let the browser handle tab switching
        if (e.metaKey) {
            return;
        }

        // Check if it's a digit (0-9)
        if (/[0-9]/.test(e.key)) {
            // Get the active element
            const activeElement = document.activeElement;

            // Check if we're in a text input, textarea, or contenteditable element
            const isTextInput = activeElement.tagName === 'INPUT' ||
                                activeElement.tagName === 'TEXTAREA' ||
                                activeElement.contentEditable === 'true';

            // If we're typing in a text field, don't intercept the key
            if (isTextInput) {
                return;
            }

            e.preventDefault();

            // Find the repository navigation menu
            const navList = document.querySelector('nav[aria-label="Repository"] ul');
            if (navList) {
                // Target only the direct <li> children (the 10 main tabs)
                const listItems = navList.querySelectorAll(':scope > li');
                // Convert key to index: 1-9 map to 0-8, 0 maps to 9
                const tabIndex = e.key === '0' ? 9 : parseInt(e.key) - 1;

                if (tabIndex < listItems.length) {
                    const tabLink = listItems[tabIndex].querySelector('a');
                    if (tabLink) {
                        const tabName = tabLink.textContent.trim().split('\\n')[0];
                        tabLink.click();
                        console.log(`✓ Navigated to: ${tabName}`);
                    } else {
                        console.warn(`No link found in tab ${tabIndex}`);
                    }
                } else {
                    console.warn(`Tab index ${tabIndex} out of range (found ${listItems.length} tabs)`);
                }
            }
        }
    });

    console.log('🚀 GitHub Tab Navigator loaded - Use number keys 1-0 to navigate tabs');
})();
