# userscripts

I use Tampermonkey userscripts to add or modify features on websites I use often, to fine-tune them for my personal needs. The scripts here are ones that I've found particularly useful and that might be valuable for others.

To use them, you'll need to install the Tampermonkey browser plugin, which you can find at https://www.tampermonkey.net/

**How to install**: Once you have the Tampermonkey plugin installed, click the Direct Link to any of these scripts, and Tampermonkey will offer to install them for you. When I make updates, Tampermonkey will be able to detect the update and load the latest version.

## JIRA Assignee Quick Filter Menu

**Direct Link**: https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Assignee%20Quick%20Filter%20Menu.user.js

Modifies the QuickFilters on JIRA agile boards and backlogs by moving assignee filters into a dropdown menu for filtering to a single assignee. For people who use Quick Filters for assignees, the Quick Filters list can get quite long, and putting assignee filters in a menu saves space while making it easy to see which filter is active. Other filters are left in their normal place, and can be multi-selected along with assignee as needed.

The dropdown menu includes an "Any" option to clear the assignee filter, but does not change the state of any non-assignee filters.

Assignee filters are detected via the filter's Description as set in the Quick Filters configuration for the board. Any filter whose description contains the words "assignee" or "assigned" will be included in the dropdown menu. (By default if no description is provided, JIRA uses the JQL for the filter as the description, which will contain the keyword "assignee".)


## JIRA Epics and Versions Hotkeys

**Direct Link**: https://github.com/jsavin/userscripts/raw/main/scripts/JIRA%20Epics%20and%20Versions%20Hotkeys.user.js

Adds hotkey support for toggling JIRA's Epics and Versions panels on agile backlog pages using Ctrl-E and Ctrl-V.

## MLB.TV Custom Skip Duration and Jump Command

**Direct Link**:
https://github.com/jsavin/userscripts/raw/main/scripts/MLB.TV%20Custom%20Skip%20Duration.user.js

Adds hotkeys to the player in MLB.TV: Comma (,) skips back 1 minute, and Period (.) skips forward 1 minute. The J key shows a Jump To pop-up, and you type minutes (1 or 2 digits) or hour and minutes (3 digits) and Enter to jump to a specific time. You can also jump forward or back by N minutes using '[' and ']'.
