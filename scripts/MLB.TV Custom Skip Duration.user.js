// ==UserScript==
// @name         MLB.TV Custom Skip Duration
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Modify MLB.TV skip buttons, keyboard shortcuts, time jump, and relative jumps
// @author       jsavin
// @match        https://www.mlb.com/tv/*
// @updateURL    https://github.com/jsavin/userscripts/raw/main/scripts/MLB.TV%20Custom%20Skip%20Duration.user.js
// @downloadURL  https://github.com/jsavin/userscripts/raw/main/scripts/MLB.TV%20Custom%20Skip%20Duration.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configure your preferred skip duration here (in seconds)
    const SKIP_DURATION = 30; // Change to 60 for 1 minute

    console.log('[MLB Skip] Script starting...');

    let timeJumpMode = false;
    let timeJumpInput = '';
    let timeJumpOverlay = null;

    let relativeJumpMode = false;
    let relativeJumpDirection = null; // 'forward' or 'backward'
    let relativeJumpInput = '';

    function setupCustomSkip() {
        const video = document.querySelector('video');
        if (!video) {
            console.log('[MLB Skip] Video not found, retrying...');
            setTimeout(setupCustomSkip, 500);
            return;
        }

        const forwardBtn = document.querySelector('.quick-fastforward-control');
        const rewindBtn = document.querySelector('.quick-rewind-control');

        if (!forwardBtn || !rewindBtn) {
            console.log('[MLB Skip] Buttons not found, retrying...');
            setTimeout(setupCustomSkip, 500);
            return;
        }

        console.log('[MLB Skip] Found buttons, setting up custom skip...');

        // Clone buttons to remove all existing event listeners
        const newForwardBtn = forwardBtn.cloneNode(true);
        const newRewindBtn = rewindBtn.cloneNode(true);

        forwardBtn.parentNode.replaceChild(newForwardBtn, forwardBtn);
        rewindBtn.parentNode.replaceChild(newRewindBtn, rewindBtn);

        // Add our custom event listeners
        newForwardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            video.currentTime += SKIP_DURATION;
            console.log(`[MLB Skip] Skipped forward ${SKIP_DURATION} seconds`);
        });

        newRewindBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            video.currentTime -= SKIP_DURATION;
            console.log(`[MLB Skip] Skipped backward ${SKIP_DURATION} seconds`);
        });

        // Update aria-labels to reflect new duration
        newForwardBtn.setAttribute('aria-label', `Fast forward ${SKIP_DURATION} seconds`);
        newRewindBtn.setAttribute('aria-label', `Rewind ${SKIP_DURATION} seconds`);

        console.log('[MLB Skip] Custom skip installed successfully!');
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px 50px;
            border-radius: 10px;
            font-size: 32px;
            font-family: monospace;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function parseTimeInput(input) {
        // Remove any colons
        const digits = input.replace(':', '');

        if (digits.length === 0) return null;

        let hours = 0;
        let minutes = 0;

        if (digits.length === 1 || digits.length === 2) {
            // 1 or 2 digits = minutes
            minutes = parseInt(digits, 10);
        } else if (digits.length === 3) {
            // 3 digits = H:MM
            hours = parseInt(digits[0], 10);
            minutes = parseInt(digits.substring(1), 10);
        }

        return hours * 3600 + minutes * 60;
    }

    function updateTimeJumpOverlay() {
        if (!timeJumpOverlay) return;

        let displayText = 'Jump to: ';
        if (timeJumpInput.length === 0) {
            displayText += '_';
        } else if (timeJumpInput.length === 1 || timeJumpInput.length === 2) {
            displayText += `0:${timeJumpInput.padStart(2, '0')}`;
        } else if (timeJumpInput.length === 3) {
            displayText += `${timeJumpInput[0]}:${timeJumpInput.substring(1)}`;
        }

        timeJumpOverlay.textContent = displayText;
    }

    function updateRelativeJumpOverlay() {
        if (!timeJumpOverlay) return;

        const direction = relativeJumpDirection === 'forward' ? '+' : '-';
        const minutes = relativeJumpInput || '_';
        timeJumpOverlay.textContent = `Jump ${direction}${minutes} min`;
    }

    function setupKeyboardShortcuts() {
        const video = document.querySelector('video');
        if (!video) {
            setTimeout(setupKeyboardShortcuts, 500);
            return;
        }

        document.addEventListener('keydown', (e) => {
            // Don't interfere if user is typing in an input field (unless in jump mode)
            if (!timeJumpMode && !relativeJumpMode && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                return;
            }

            // Relative jump mode active
            if (relativeJumpMode) {
                if (e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    relativeJumpInput += e.key;
                    updateRelativeJumpOverlay();
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    relativeJumpInput = relativeJumpInput.slice(0, -1);
                    updateRelativeJumpOverlay();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const minutes = parseInt(relativeJumpInput, 10);
                    if (!isNaN(minutes) && minutes > 0) {
                        const seconds = minutes * 60;
                        if (relativeJumpDirection === 'forward') {
                            video.currentTime += seconds;
                            console.log(`[MLB Skip] Jumped forward ${minutes} minutes`);
                        } else {
                            video.currentTime -= seconds;
                            console.log(`[MLB Skip] Jumped backward ${minutes} minutes`);
                        }
                    }
                    relativeJumpMode = false;
                    relativeJumpInput = '';
                    relativeJumpDirection = null;
                    if (timeJumpOverlay) {
                        timeJumpOverlay.remove();
                        timeJumpOverlay = null;
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    relativeJumpMode = false;
                    relativeJumpInput = '';
                    relativeJumpDirection = null;
                    if (timeJumpOverlay) {
                        timeJumpOverlay.remove();
                        timeJumpOverlay = null;
                    }
                }
                return;
            }

            // Time jump mode active
            if (timeJumpMode) {
                if (e.key >= '0' && e.key <= '9' && timeJumpInput.length < 3) {
                    e.preventDefault();
                    timeJumpInput += e.key;
                    updateTimeJumpOverlay();
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    timeJumpInput = timeJumpInput.slice(0, -1);
                    updateTimeJumpOverlay();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const seconds = parseTimeInput(timeJumpInput);
                    if (seconds !== null) {
                        video.currentTime = seconds;
                        console.log(`[MLB Skip] Jumped to ${Math.floor(seconds / 3600)}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}`);
                    }
                    timeJumpMode = false;
                    timeJumpInput = '';
                    if (timeJumpOverlay) {
                        timeJumpOverlay.remove();
                        timeJumpOverlay = null;
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    timeJumpMode = false;
                    timeJumpInput = '';
                    if (timeJumpOverlay) {
                        timeJumpOverlay.remove();
                        timeJumpOverlay = null;
                    }
                }
                return;
            }

            // Normal keyboard shortcuts
            if (e.key === '.') {
                e.preventDefault();
                video.currentTime += SKIP_DURATION;
                console.log(`[MLB Skip] Keyboard: Skipped forward ${SKIP_DURATION} seconds`);
            } else if (e.key === ',') {
                e.preventDefault();
                video.currentTime -= SKIP_DURATION;
                console.log(`[MLB Skip] Keyboard: Skipped backward ${SKIP_DURATION} seconds`);
            } else if (e.key === 'j' || e.key === 'J') {
                e.preventDefault();
                timeJumpMode = true;
                timeJumpInput = '';
                timeJumpOverlay = createOverlay();
                updateTimeJumpOverlay();
                console.log('[MLB Skip] Time jump mode activated');
            } else if (e.key === ']') {
                e.preventDefault();
                relativeJumpMode = true;
                relativeJumpDirection = 'forward';
                relativeJumpInput = '';
                timeJumpOverlay = createOverlay();
                updateRelativeJumpOverlay();
                console.log('[MLB Skip] Relative jump forward mode activated');
            } else if (e.key === '[') {
                e.preventDefault();
                relativeJumpMode = true;
                relativeJumpDirection = 'backward';
                relativeJumpInput = '';
                timeJumpOverlay = createOverlay();
                updateRelativeJumpOverlay();
                console.log('[MLB Skip] Relative jump backward mode activated');
            }
        });

        console.log('[MLB Skip] Keyboard shortcuts installed');
        console.log('[MLB Skip] . = forward, , = backward');
        console.log('[MLB Skip] J = jump to time, ] = jump forward N min, [ = jump back N min');
    }

    // Wait for the page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupCustomSkip();
            setupKeyboardShortcuts();
        });
    } else {
        setupCustomSkip();
        setupKeyboardShortcuts();
    }
})();