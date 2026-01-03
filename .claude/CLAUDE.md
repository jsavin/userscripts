# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of Tampermonkey userscripts that add or modify features on websites. Each script is a standalone `.user.js` file that enhances functionality on specific sites (JIRA, GitHub, MLB.TV, etc.).

All scripts are published to GitHub and distributed via direct download links. Tampermonkey automatically detects updates and loads the latest version when users have the scripts installed.

## Script Structure

Each userscript follows the Tampermonkey header format:
- `@name`: The user-visible name for the script
- `@version`: Semantic versioning (major.minor.patch)
- `@description`: Brief description of functionality
- `@match`: URL patterns where the script runs
- `@grant`: Required permissions (typically `none` for minimal DOM manipulation)
- `@author`: Attribution

## Development Workflow

When creating or modifying scripts:

1. **Update version numbers** in the `@version` header when making changes - users will see updates automatically
2. **Test in Tampermonkey** by installing the script locally before publishing
3. **Update README.md** when adding new scripts or significantly changing functionality - follow the existing format with Direct Link, description, and specific hotkey/feature details
4. **Consider text input detection** - userscripts that use keyboard shortcuts should detect when users are typing (in input fields, textareas, or contenteditable elements) and pass keys through rather than intercepting them
5. **Use keyboard modifiers wisely** - if a script uses hotkeys that could interfere with browser shortcuts (like Cmd/Ctrl+number), consider detecting and respecting those modifiers

## README Guidelines

The README lists all available scripts with:
- A Direct Link for easy Tampermonkey installation (GitHub raw content URL with URL-encoded spaces)
- A description of what the script does
- Specific hotkeys or features it adds

Scripts are listed in alphabetical order by their `@name`.

## Publishing

To publish updates:
1. Commit changes to the script and README with descriptive messages
2. Push to `main` branch - this is the source of truth for all users
3. Include the new version number in commit messages when bumping versions

Users with scripts installed will automatically receive updates from the `main` branch.
