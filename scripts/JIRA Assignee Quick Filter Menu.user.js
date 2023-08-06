// ==UserScript==
// @name         JIRA Assignee Quick Filter Menu
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Convert assignee Quick Filters into dropdown menu with an "Any" option to clear assignee filter
// @author       Jake Savin
// @copyright    Copyright (c) 2023 Jake Savin
// @license      MIT
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Assignee%20Quick%20Filter%20Menu.user.js
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Assignee%20Quick%20Filter%20Menu.user.js
// @source       https://github.com/jsavin/userscripts/
// @match        https://*/secure/RapidBoard.jspa?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const waitUntilJiraIsLoaded = setInterval(() => {
        if (document.getElementById('js-work-quickfilters')) {
            clearInterval(waitUntilJiraIsLoaded);
            createQuickFiltersDropdown('board');
        } else if (document.getElementById('js-plan-quickfilters')) {
            clearInterval(waitUntilJiraIsLoaded);
            createQuickFiltersDropdown('backlog');
        }
    }, 500);

    function observeViewChanges() {
        const ghxPlan = document.getElementById('ghx-plan');
        if (ghxPlan) {
            const observer = new MutationObserver(() => {
                if (ghxPlan.children.length > 0) {
                    console.log("Switching to backlog view");
                    createQuickFiltersDropdown('backlog');
                    updateSelectedFilter('backlog') // TODO not working
                } else {
                    console.log("Switching to board view");
                    createQuickFiltersDropdown('board');
                    updateSelectedFilter('board') // TODO not working
                }
            });
            observer.observe(ghxPlan, { childList: true });
        }
    }

    // Select the correct menu option after switching between backlog and board views
    function updateSelectedFilter(view) {
        const filtersDivId = view === 'board' ? 'js-work-quickfilters' : 'js-plan-quickfilters';
        const filtersDiv = document.getElementById(filtersDivId);
        const activeFilter = filtersDiv.querySelector('.js-quickfilter-button.ghx-active');
        const select = document.getElementById('assigneeDropdown');

        if (activeFilter) {
            select.value = activeFilter.dataset.filterId;
        } else {
            select.value = ''; // Default to "Any"
        }
    }

    // Initial creation of the dropdown menu based on the current view
    const currentView = document.getElementById('ghx-plan').children.length > 0 ? 'backlog' : 'board';
    createQuickFiltersDropdown(currentView);

    // Set up the observer to detect view changes
    observeViewChanges();


    // Make a dropdown menu with options for all the filters that appear to be for assignees,
    // including an option at the top called "Any" to clear the assignee filter. Only one
    // assignee filter can be active at a time.
    function createQuickFiltersDropdown(view) {
        const containerId = view === 'board' ? 'js-work-quickfilters' : 'js-plan-quickfilters';
        const container = document.getElementById(containerId);
        if (!container) return; // Exit if the container is not found

        const filters = Array.from(container.querySelectorAll('.js-quickfilter-button'));

        // Create dropdown and add 'Clear' option
        const select = document.createElement('select');
        select.addEventListener('change', () => {
            clearAndSetFilter(select, view);
            select.blur(); // Remove focus from the menu
        });
        const clearOption = document.createElement('option');
        clearOption.text = 'Any';
        select.appendChild(clearOption);
        select.style.marginRight = '0.6em';

        // Create label
        const label = document.createElement('label');
        label.textContent = 'Assignee:';
        label.style.marginRight = '0.3em';

        // Add each filter to the dropdown
        let firstFilterContainer;
        filters.forEach((filter) => {
            if (/assigned|assignee/i.test(filter.title) && /[a-zA-Z]{2,}/.test(filter.innerText)) {
                const option = document.createElement('option');
                option.text = filter.textContent;
                option.value = filter.dataset.filterId;
                select.appendChild(option);

                // Hide the original filter link only, not the entire dd element
                const container = document.createElement('span');
                container.style.display = 'none';
                filter.parentNode.replaceChild(container, filter);
                container.appendChild(filter);

                // Remember the first filter and replace it with the dropdown
                if (!firstFilterContainer) {
                    firstFilterContainer = filter.parentElement;
                    let filtersParent = firstFilterContainer.parentNode;
                    filtersParent.insertBefore(label, firstFilterContainer);
                    filtersParent.insertBefore(select, firstFilterContainer);
                }
            }
        });
    }

    // Activate the selected filter and deactivate any other assignee filter that was previously active
    function clearAndSetFilter(select, view) {
        const filtersDivId = view === 'board' ? 'js-work-quickfilters' : 'js-plan-quickfilters';
        const filtersDiv = document.getElementById(filtersDivId);
        const activeFilters = Array.from(filtersDiv.querySelectorAll('.js-quickfilter-button.ghx-active'));

        // Clear active filters
        activeFilters.forEach((filter) => {
            filter.click();
        });

        // Set new filter
        const selectedFilterId = select.value;
        if (selectedFilterId) {
            const filterToClick = filtersDiv.querySelector(`.js-quickfilter-button[data-filter-id="${selectedFilterId}"]`);
            filterToClick.click();
        }
    }
})();
