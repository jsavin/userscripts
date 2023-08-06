// ==UserScript==
// @name         JIRA Epics and Versions Hotkeys
// @namespace    http://jakesav.in/
// @version      0.1.0
// @description  Toggle JIRA's Epics and Versions panels in agile backlog view using Ctrl-E and Ctrl-V hotkeys
// @author       Jake Savin
// @copyright    Copyright (c) 2023 Jake Savin
// @license      MIT
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Epics%20and%20Versions%20Hotkeys.user.js
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Epics%20and%20Versions%20Hotkeys.user.js
// @source       https://github.com/jsavin/userscripts/
// @match        https://*/secure/RapidBoard.jspa?*
// @grant        none
// ==/UserScript==

$(document).keydown(function(e) {

    var epicsToggleButton = document.querySelector("#ghx-classification-menu > li.js-epic-toggle.ghx-epic-toggle");
    var versionsToggleButton = document.querySelector("#ghx-classification-menu > li.js-release-toggle.ghx-release-toggle");

    if (e.ctrlKey) {
        if (e.which == 69) { // 'E'
            epicsToggleButton.click();
            e.preventDefault();
        }
        if (e.which == 86) { // 'E'
            versionsToggleButton.click();
            e.preventDefault();
        }
    }

});
