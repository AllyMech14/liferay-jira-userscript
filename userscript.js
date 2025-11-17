// ==UserScript==
// @name         Jira For CSEs
// @author       Ally, Rita, Dmcisneros
// @icon         https://www.liferay.com/o/classic-theme/images/favicon.ico
// @namespace    https://liferay.atlassian.net/
// @version      3.3
// @description  Pastel Jira statuses + Patcher Link field + Internal Note highlight
// @match        https://liferay.atlassian.net/*
// @updateURL    https://github.com/AllyMech14/liferay-jira-userscript/raw/refs/heads/main/userscript.js
// @downloadURL  https://github.com/AllyMech14/liferay-jira-userscript/raw/refs/heads/main/userscript.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Map of colors by normalized status (all lowercase, spaces removed)
    const statusColors = {
        'pending': '#8fb8f6',
        'awaitinghelp': '#d8a0f7',
        'withproductteam': '#d8a0f7',
        'withsre': '#d8a0f7',
        'inprogress': '#fd9891',
        'solutionproposed': '#FFEB3B',
        'solutionaccepted': '#FFEB3B',
        'closed': '#dddee1',
        'inactive': '#FFEB3B',
        'new': '#FFEB3B'
    };

    // Normalize any status text (remove spaces, punctuation, lowercase)
    function normalizeStatus(text) {
        return text
            .replace(/\s+/g, '')
            .replace(/[^a-zA-Z]/g, '')
            .toLowerCase();
    }

    // Apply colors dynamically
    function applyColors() {
        // Select both types of elements: dynamic class + data-testid containing "status"
        const elements = document.querySelectorAll('._bfhk1ymo,.jira-issue-status-lozenge, [data-testid*="issue.fields.status.common.ui.status-lozenge.3"]');

        elements.forEach(el => {
            const rawText = (el.innerText || el.textContent || '').trim();
            const key = normalizeStatus(rawText);
            const color = statusColors[key];
            if (color) {
                el.style.backgroundColor = color;
                el.style.color = '#000'; // dark text for contrast
                el.style.border = 'none';
                el.style.padding = '2px 6px';
                el.style.borderRadius = '4px';
                el.style.transition = 'background-color 0.3s ease';
            }
            el.querySelectorAll('span').forEach(span => {
                span.style.background = 'transparent';
            });
        });
    }

    /*********** PATCHER LINK FIELD ***********/
    function getPatcherPortalAccountsHREF(path, params) {
        const portletId = '1_WAR_osbpatcherportlet';
        const ns = '_' + portletId + '_';
        const queryString = Object.keys(params)
        .map(key => (key.startsWith('p_p_') ? key : ns + key) + '=' + encodeURIComponent(params[key]))
        .join('&');
        return 'https://patcher.liferay.com/group/guest/patching/-/osb_patcher/accounts' + path + '?p_p_id=' + portletId + '&' + queryString;
    }

    function getAccountCode() {
        const accountDiv = document.querySelector('[data-testid="issue.views.field.single-line-text.read-view.customfield_12570"]');
        return accountDiv ? accountDiv.textContent.trim() : null;
    }

    function createPatcherField() {
        const originalField = document.querySelector('[data-component-selector="jira-issue-field-heading-field-wrapper"]');
        if (!originalField) return;
        if (document.querySelector('.patcher-link-field')) return;

        const accountCode = getAccountCode();
        const clone = originalField.cloneNode(true);
        // Remove the Assign to Me, which is duplicated
        const assignToMe = clone.querySelector('[data-testid="issue-view-layout-assignee-field.ui.assign-to-me"]');
        if(assignToMe){
            assignToMe.remove();
        }
        clone.classList.add('patcher-link-field');

        const heading = clone.querySelector('h3');
        if (heading) heading.textContent = 'Patcher Link';

        const contentContainer = clone.querySelector('[data-testid="issue-field-inline-edit-read-view-container.ui.container"]');
        if (contentContainer) contentContainer.innerHTML = '';

        const link = document.createElement('a');
        if (accountCode) {
            link.href = getPatcherPortalAccountsHREF('', { accountEntryCode: accountCode });
            link.target = '_blank';
            link.textContent = accountCode;
        } else {
            link.textContent = 'Account Code Missing';
            link.style.color = '#999';
        }

        link.style.display = 'block';
        link.style.marginTop = '5px';
        link.style.textDecoration = 'underline';
        contentContainer && contentContainer.appendChild(link);

        originalField.parentNode.insertBefore(clone, originalField.nextSibling);
    }


    /*********** INTERNAL NOTE HIGHLIGHT ***********/ 
    //written by @allymech13
    
    function highlightEditor() {
        const editorWrapper = document.querySelector('.css-sox1a6');
        const editor = document.querySelector('#ak-editor-textarea');
        const internalNoteButton = document.querySelector('#comment-editor-container-tabs-0');

        const isInternalSelected = internalNoteButton && internalNoteButton.getAttribute('aria-selected') === 'true';

        if (isInternalSelected) {
            if (editorWrapper) {
                editorWrapper.style.setProperty('background-color', '#FFFACD', 'important'); // pale yellow
                editorWrapper.style.setProperty('border', '2px solid #FFD700', 'important'); // golden border
                editorWrapper.style.setProperty('transition', 'background-color 0.3s, border 0.3s', 'important');
            }
            if (editor) {
                editor.style.setProperty('background-color', '#FFFACD', 'important'); // pale yellow
                editor.style.setProperty('transition', 'background-color 0.3s, border 0.3s', 'important');
            }
        } else {
            //If not internal note Remove highlight
            if (editorWrapper) {
                editorWrapper.style.removeProperty('background-color');
                editorWrapper.style.removeProperty('border');
            }
            if (editor) {
                editor.style.removeProperty('background-color');
            }
        }
    }
    /*********** INTERNAL NOTE - REMOVE SIGNATURE ***********/

    // Select the "Add internal note" button
    function removeSignatureFromInternalNote(){
        const addNoteButton = document.querySelector('button.css-yfvug5');

        if (addNoteButton) {
            addNoteButton.addEventListener('click', () => {
                // Create a MutationObserver to watch for the target paragraph appearing
                const observer = new MutationObserver((mutations, obs) => {
                    const targetParagraph = document.querySelector(
                        'p[data-prosemirror-node-name="paragraph"][data-prosemirror-node-block="true"]'
                    );

                    if (targetParagraph && targetParagraph.innerHTML.includes('Best regards')) {
                        // Remove the paragraph
                        targetParagraph.remove();
                    }
                });

                // Observe the whole document (you can narrow to a specific container if you know it)
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                });
            });
        } else {
            console.warn('Add internal note button not found.');
        }
    }

    /*********** INITIAL RUN + OBSERVERS ***********/
    applyColors();
    createPatcherField();
    highlightEditor();
    removeSignatureFromInternalNote();

    const observer = new MutationObserver(() => {
        applyColors();
        createPatcherField();
        highlightEditor();
        attachButtonListeners();
        removeSignatureFromInternalNote();
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
