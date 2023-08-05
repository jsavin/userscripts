// ==UserScript==
// @name         JIRA Assignee Quick Filter Menu
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Convert assignee Quick Filters into dropdown menu with an "Any" option to clear assignee filter
// @author       Jake Savin
// @license 	 MIT
// @match        https://*/secure/RapidBoard.jspa?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const waitUntilJiraIsLoaded = setInterval(() => {
        if(document.querySelector('.ghx-controls-filters')) {
            clearInterval(waitUntilJiraIsLoaded);
            createQuickFiltersDropdown();
        }
    }, 500);

    // Make a dropdown menu with options for all the filters that appear to be for assignees,
    // including an option at the top called "Any" to clear the assignee filter. Only one
    // assignee filter can be active at a time.
    function createQuickFiltersDropdown() {
        const filtersDiv = document.querySelector('.ghx-controls-filters');
        const filters = Array.from(filtersDiv.querySelectorAll('.js-quickfilter-button'));

        // Create dropdown and add 'Clear' option
        const select = document.createElement('select');
        select.addEventListener('change', () => clearAndSetFilter(select));
        const clearOption = document.createElement('option');
        clearOption.text = 'Any';
        select.appendChild(clearOption);

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
    function clearAndSetFilter(select) {
        const filtersDiv = document.querySelector('.ghx-controls-filters');
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
