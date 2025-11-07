// ==UserScript==
// @name         Jira For CSEs
// @author       Ally, Rita
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

    /*********** STATUS COLORs ***********/
    const statusColors = {
        'New':               { bg: '#FFC0CB', text: '#800000' },
        'New (FLS)':         { bg: '#FFC0CB', text: '#800000' },
        'In Progress':       { bg: '#FFD6D6', text: '#B22222' },
        'In Progress (FLS)': { bg: '#FFD6D6', text: '#B22222' },
        'With Product Team': { bg: '#D6E4FF', text: '#1E40AF' },
        'With SRE':          { bg: '#FFE0B2', text: '#BF5700' },
        'Pending':           { bg: '#FFF3B0', text: '#A67C00' },
        'Pending (FLS)':     { bg: '#FFF3B0', text: '#A67C00' },
        'Solution Proposed': { bg: '#C8FACC', text: '#1F7A3D' },
        'Solution Proposed (FLS)': { bg: '#C8FACC', text: '#1F7A3D' },
        'Solution Accepted': { bg: '#C8FACC', text: '#1F7A3D' },
        'Solution Accepted (FLS)': { bg: '#C8FACC', text: '#1F7A3D' },
        'Closed (FLS)':      { bg: '#C8FACC', text: '#1F7A3D' },
        'Closed':            { bg: '#C8FACC', text: '#1F7A3D' },
        'Inactive':          { bg: '#C8FACC', text: '#1F7A3D' },
        'Solved':            { bg: '#C8FACC', text: '#1F7A3D' },
        'Resolved':          { bg: '#C8FACC', text: '#1F7A3D' },
        'Completed':         { bg: '#C8FACC', text: '#1F7A3D' },
        'Awaiting Help':     { bg: '#E2D6FF', text: '#5B2CA6' },
        'Open':              { bg: '#A0E7E5', text: '#05696B' },
    };

    function styleStatuses() {
        ['_bfhk1ymo', '_bfhk1fkg', '_bfhk3uhp'].forEach(cls => {
            document.querySelectorAll(`.${cls}`).forEach(el => {
                el.style.setProperty('background', 'transparent', 'important');
            });
        });

        document.querySelectorAll('span.jira-issue-status-lozenge').forEach(el => {
            const statusText = el.textContent.trim();
            const style = statusColors[statusText];
            if (style) {
                el.style.setProperty('background-color', style.bg, 'important');
                el.style.setProperty('color', style.text, 'important');
                el.style.border = 'none';
                el.style.fontWeight = '600';
                el.style.borderRadius = '12px';
                el.style.padding = '3px 10px';
                el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                el.style.fontFamily = '';
            }
        });

        document.querySelectorAll('div._4cvr1h6o._1e0c1bgi').forEach(el => {
            const statusText = el.childNodes[0]?.nodeValue?.trim();
            const style = statusColors[statusText];
            if (style) {
                el.style.display = 'block';
                el.style.width = '100%';
                el.style.height = '100%';
                el.style.boxSizing = 'border-box';
                el.style.backgroundColor = style.bg;
                el.style.color = style.text;
                el.style.borderRadius = '4px';
                el.style.padding = '3px 10px';
                el.style.fontWeight = '600';
                el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                const parentButton = el.closest('button');
                if (parentButton) parentButton.style.setProperty('background', 'transparent', 'important');
            }
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
    function highlightEditor() {
        const editorWrapper = document.querySelector('.css-1pd6fdd');
        const editor = document.querySelector('#ak-editor-textarea');

        // Check if this is an internal comment
        const isInternalComment = document.querySelector(
            '[data-testid="issue-comment-base.ui.comment.comment-visibility.comment-visibility-wrapper"]'
        );

        if (isInternalComment) {
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
            // If not internal comment, remove highlight
            if (editorWrapper) {
                editorWrapper.style.removeProperty('background-color');
                editorWrapper.style.removeProperty('border');
            }
            if (editor) {
                editor.style.removeProperty('background-color');
            }
        }
    }

    // Add event listeners to buttons
    function attachButtonListeners() {
        // Select buttons
        const internalNoteButton = document.querySelector('span._19pkidpf._2hwxidpf._otyridpf._18u0idpf._1i4qfg65._11c82smr._1reo15vq._18m915vq._1e0ccj1k._sudp1e54._1nmz9jpi._k48p1wq8[style*="Add internal note"]');
        const replyCustomerButton = document.querySelector('span._19pkidpf._2hwxidpf._otyridpf._18u0idpf._1i4qfg65._11c82smr._1reo15vq._18m915vq._1e0ccj1k._sudp1e54._1nmz9jpi._k48p1wq8[style*="Reply to customer"]');

        if (internalNoteButton) {
            internalNoteButton.addEventListener('click', () => {
                setTimeout(highlightEditor, 100); // slight delay to let editor load
            });
        }

        if (replyCustomerButton) {
            replyCustomerButton.addEventListener('click', () => {
                setTimeout(highlightEditor, 100); // remove highlight if internal note not present
            });
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
    styleStatuses();
    createPatcherField();
    highlightEditor();
    removeSignatureFromInternalNote();

    const observer = new MutationObserver(() => {
        styleStatuses();
        createPatcherField();
        highlightEditor();
        attachButtonListeners();
        removeSignatureFromInternalNote();
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();