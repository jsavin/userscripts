# userscripts

I use Tampermonkey userscripts to add or modify features on websites I use often, to fine-tune them for my personal needs. The scripts here are ones that I've found particularly useful and that might be valuable for others.

To use them, you'll need to install the Tampermonkey browser plugin, which you can find at https://www.tampermonkey.net/


## JIRA Assignee Quick Filter Menu

Direct Link: https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Assignee%20Quick%20Filter%20Menu.user.js

Modifies the QuickFilters on JIRA agile boards and backlogs by moving assignee filters into a dropdown menu for filtering to a single assignee. For people who use Quick Filters for assignees, the Quick Filters list can get quite long, and putting assignee filters in a menu saves space while making it easy to see which filter is active. Other filters are left in their normal place, and can be multi-selected along with assignee as needed.

The dropdown menu includes an "Any" option to clear the assignee filter, but does not change the state of any non-assignee filters.

Assignee filters are detected via the filter's Description as set in the Quick Filters configuration for the board. Any filter whose description contains the words "assignee" or "assigned" will be included in the dropdown menu. (By default if no description is provided, JIRA uses the JQL for the filter as the description, which will contain the keyword "assignee".)
