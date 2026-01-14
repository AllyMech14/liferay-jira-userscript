// ==UserScript==
// @name         Jira For CSEs
// @author       Ally, Rita, Dmcisneros
// @icon         https://www.liferay.com/o/classic-theme/images/favicon.ico
// @namespace    https://liferay.atlassian.net/
// @version      3.14
// @description  Jira statuses + Patcher, Account tickets and CP Link field + Internal Note highlight + Auto Expand CCC Info + colorize solution proposed
// @match        https://liferay.atlassian.net/*
// @match        https://liferay-sandbox-424.atlassian.net/*
// @updateURL    https://github.com/AllyMech14/liferay-jira-userscript/raw/refs/heads/main/userscript.js
// @downloadURL  https://github.com/AllyMech14/liferay-jira-userscript/raw/refs/heads/main/userscript.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// ==/UserScript==

(async function () {
    'use strict';

    // Map of colors by normalized status (all lowercase, spaces removed)
    const statusColors = {
        'pending': { bg: '#1378d0', color: '#e6f2fb' },
        'awaitinghelp': { bg: '#7c29a4', color: '#fff' },
        'withproductteam': { bg: '#7c29a4', color: '#fff' },
        'withsre': { bg: '#7c29a4', color: '#fff' },
        'inprogress': { bg: '#cc2d24', color: '#fff' },

        // unchanged statuses below
        'solutionproposed': { bg: '#7d868e', color: '#fff' },
        'solutionaccepted': { bg: '#28a745', color: '#fff' },
        'closed': { bg: '#dddee1', color: '#000' },
        'inactive': { bg: '#FFEB3B', color: '#000' },
        'new': { bg: '#FFEB3B', color: '#000' }
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
        const elements = document.querySelectorAll(
            '._bfhk1ymo,' +
            '.jira-issue-status-lozenge,' +
            '[data-testid*="status-lozenge"],' +
            'span[title],' +
            'div[aria-label*="Status"],' +
            '[data-testid*="issue-status"] span,' +
            '.css-1mh9skp,' +
            '.css-14er0c4,' +
            '.css-1ei6h1c'
        );

        // Apply base lozenge sizing & centering to ALL statuses
        elements.forEach(el => {
            const rawText = (el.innerText || el.textContent || '').trim();
            const key = normalizeStatus(rawText);
            const style = statusColors[key];

            // Base lozenge styling for all statuses
            el.style.padding = '3px 4px';       // space inside the badge
            el.style.fontSize = '1em';          // default font size
            el.style.borderRadius = '4px';      // rounded corners
            el.style.minHeight = '13px';        // minimum height
            el.style.minWidth = '24px';         // minimum width
            el.style.display = 'inline-flex';   // flex container for centering
            el.style.alignItems = 'center';     // vertical centering
            el.style.justifyContent = 'center'; // horizontal centering
            el.style.lineHeight = '1';          // line height inside badge
            el.style.boxSizing = 'border-box';  // include padding in size
            el.style.backgroundImage = 'none';  // remove any background image
            el.style.boxShadow = 'none';


            // Apply custom colors if status matched
            if (style) {

                el.style.setProperty("background", style.bg, "important"); // background color
                el.style.setProperty("color", style.color, "important");   // text color
                el.style.setProperty("font-weight", "bold", "important");  // bold text
                el.style.setProperty("border", "none", "important");       // remove border


            }
            // Ensure nested spans don’t override main badge styles
            el.querySelectorAll('span').forEach(span => {
                span.style.setProperty("background", "transparent", "important"); // transparent bg
                span.style.setProperty("color", "inherit", "important");          // inherit badge text color
                span.style.setProperty("font-size", "1em", "important");          // force font size
            });
        });
    }

    function getTicketType() {
        const title = document.title;
        const match = title.match(/\[([A-Z]+)-\d+\]/);
        return match ? match[1] : null;
    }


    /*********** JIRA FILTER LINK FIELD ***********/

    // Utility function to construct the Jira JQL filter URL
    function getJiraFilterHref(accountCode) {
        if (!accountCode) return null;

        // The base JQL query string containing the <CODE> placeholder
        const jiraFilterByAccountCode = 'https://liferay.atlassian.net/issues/?jql=%22account%20code%5Bshort%20text%5D%22%20~%20%22<CODE>%22%20and%20project%20%3D%20LRHC%20ORDER%20BY%20created%20DESC';

        // Replace the placeholder <CODE> with the actual account code
        return jiraFilterByAccountCode.replace('<CODE>', accountCode);
    }

    function createJiraFilterLinkField() {
        // Select the original field wrapper to clone its structure
        const originalField = document.querySelector('[data-component-selector="jira-issue-field-heading-field-wrapper"]');
        if (!originalField) return;

        // We insert the new field after the original Patcher Link field
        const referenceField = document.querySelector('.patcher-link-field');
        if (!referenceField) return; // Ensure the Patcher field exists first

        // Prevent duplicates
        if (document.querySelector('.jira-filter-link-field')) return;

        const accountCode = getAccountCode();
        const clone = originalField.cloneNode(true);

        // Cleanup: Remove the duplicated "Assign to Me" button
        clone.querySelector('[data-testid="issue-view-layout-assignee-field.ui.assign-to-me"]')?.remove();

        // UNIQUE CLASS AND HEADING
        clone.classList.add('jira-filter-link-field');
        const heading = clone.querySelector('h3');
        if (heading) heading.textContent = 'Account Filter'; // Descriptive Title

        const contentContainer = clone.querySelector('[data-testid="issue-field-inline-edit-read-view-container.ui.container"]');
        if (contentContainer) contentContainer.innerHTML = '';

        // LINK CREATION
        const link = document.createElement('a');
        if (accountCode) {
            // Use the new function to generate the Jira filter URL
            link.href = getJiraFilterHref(accountCode);
            link.target = '_blank';
            link.textContent = accountCode;
        } else {
            // Handle case where Account Code is missing
            link.textContent = 'Account Code Missing';
            link.style.color = '#999';
        }

        // Styles
        link.style.display = 'block';
        link.style.marginTop = '5px';
        link.style.textDecoration = 'underline';
        contentContainer?.appendChild(link);

        // Insert the new field after the Patcher Link field
        referenceField.parentNode.insertBefore(clone, referenceField.nextSibling);
    }

     /*********** ADD COLOR TO PROPOSED SOLUTION ***********/
    function addColorToProposedSolution() {
               const proposedSolutionDiv = document.querySelector('[data-testid="issue.views.field.rich-text.customfield_10278"]');
        
        if (!proposedSolutionDiv) return;

        const textContent = proposedSolutionDiv.textContent.trim();

        if (textContent === "None") return;
    
        const colorMode = document.documentElement.dataset.colorMode;
        const bgColor = (colorMode === 'dark') 
            ? '#1C3329' 
            : 'var(--ds-background-accent-green-subtlest, #E3FCEF)';
    
        proposedSolutionDiv.style.setProperty('background-color', bgColor, 'important');
        proposedSolutionDiv.style.setProperty('padding', '10px', 'important');
        proposedSolutionDiv.style.setProperty('margin', '10px', 'important'); // Corregido 'marging'
        proposedSolutionDiv.style.setProperty('border-radius', '4px'); // Opcional: para que se vea mejor
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
        const ticketType = getTicketType();
        if (!['LRHC', 'LRFLS'].includes(ticketType)) return; // Only run for allowed types

        const originalField = document.querySelector('[data-component-selector="jira-issue-field-heading-field-wrapper"]');
        if (!originalField) return;
        if (document.querySelector('.patcher-link-field')) return;

        const accountCode = getAccountCode();
        const clone = originalField.cloneNode(true);
        // Remove the Assign to Me, which is duplicated
        const assignToMe = clone.querySelector('[data-testid="issue-view-layout-assignee-field.ui.assign-to-me"]');
        if (assignToMe) {
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

    /*********** CUSTOMER PORTAL LINK FIELD ***********/

    // Cache for fetched data (more contained than unsafeWindow)
    const customerPortalCache = {
        issueKey: null,
        assetInfo: null,
        externalKey: null,
        promise: null // To prevent concurrent fetches
    };

    // 1. Utility function to get Issue Key
    function getIssueKey() {
        const url = window.location.href;
        const match = url.match(/[A-Z]+-\d+/g);
        // Return the last match (the most specific one, e.g., the current ticket)
        return match ? match[match.length - 1] : null;
    }

    // 2. Fetch customfield_12557 (Organization Asset)
    async function fetchAssetInfo(issueKey) {
        const apiUrl = `/rest/api/3/issue/${issueKey}?fields=customfield_12557`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API failed (${res.status}) for ${apiUrl}`);
        const data = await res.json();
        const field = data.fields.customfield_12557?.[0];

        if (!field) {
            throw new Error('"Organization Asset" missing or empty on ticket.');
        }

        // Return only necessary IDs
        return {
            workspaceId: field.workspaceId,
            objectId: field.objectId
        };
    }

    // 3. Fetch object from gateway API and extract External Key
    async function fetchExternalKey(workspaceId, objectId) {
        const url = `/gateway/api/jsm/assets/workspace/${workspaceId}/v1/object/${objectId}?includeExtendedInfo=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Gateway API failed (${res.status}) for ${url}`);
        const data = await res.json();

        const extAttr = data.attributes.find(attr => attr.objectTypeAttribute.name === 'External Key');
        if (!extAttr || !extAttr.objectAttributeValues.length) {
            throw new Error('External Key not found in asset attributes.');
        }
        return extAttr.objectAttributeValues[0].value;
    }

    // 4. Main function to fetch all data, with caching and concurrency control
    async function fetchCustomerPortalData(issueKey) {
        // Check cache first
        if (customerPortalCache.issueKey === issueKey && customerPortalCache.externalKey) {
            return customerPortalCache.externalKey;
        }

        // Clear cache if issue key changes
        if (customerPortalCache.issueKey !== issueKey) {
            customerPortalCache.issueKey = issueKey;
            customerPortalCache.assetInfo = null;
            customerPortalCache.externalKey = null;
            customerPortalCache.promise = null; // Clear previous promise
        }

        // Return existing fetch promise to avoid concurrent requests
        if (customerPortalCache.promise) {
            return customerPortalCache.promise;
        }

        // Start a new fetch sequence
        customerPortalCache.promise = (async () => {
            try {
                const assetInfo = await fetchAssetInfo(issueKey);
                customerPortalCache.assetInfo = assetInfo;

                const externalKey = await fetchExternalKey(assetInfo.workspaceId, assetInfo.objectId);
                customerPortalCache.externalKey = externalKey;

                return externalKey;
            } catch (error) {
                console.error('Failed to get Customer Portal Data:', error.message);
                // Clear cache/promise on failure to allow retry
                customerPortalCache.assetInfo = null;
                customerPortalCache.externalKey = null;
                customerPortalCache.promise = null;
                throw error; // Propagate error
            }
        })();

        return customerPortalCache.promise;
    }

    // 5. Build the customer portal URL
    function getCustomerPortalHref(externalKey) {
        return externalKey ? `https://support.liferay.com/project/#/${externalKey}` : null;
    }


    // 6. Main function to create and insert the field (handles UI updates only)
    async function createCustomerPortalField() {
        const ticketType = getTicketType();
        if (!['LRHC', 'LRFLS'].includes(ticketType)) return; // Only run for allowed types

        const originalField = document.querySelector('[data-component-selector="jira-issue-field-heading-field-wrapper"]');
        if (!originalField || document.querySelector('.customer-portal-link-field')) return;

        const issueKey = getIssueKey();
        if (!issueKey) return;

        // --- UI Setup ---
        const clone = originalField.cloneNode(true);
        // Remove duplicated "Assign to Me"
        clone.querySelector('[data-testid="issue-view-layout-assignee-field.ui.assign-to-me"]')?.remove();
        clone.classList.add('customer-portal-link-field');

        // Update field heading
        const heading = clone.querySelector('h3');
        if (heading) heading.textContent = 'Customer Portal';

        // Get content container
        const contentContainer = clone.querySelector('[data-testid="issue-field-inline-edit-read-view-container.ui.container"]');
        if (contentContainer) contentContainer.innerHTML = '';

        // Placeholder while fetching
        const statusText = document.createElement('span');
        statusText.textContent = 'Loading Portal Link...';
        statusText.style.color = '#FFA500'; // Orange for loading
        contentContainer?.appendChild(statusText);

        // Insert the cloned field *before* fetching to provide immediate feedback
        originalField.parentNode.insertBefore(clone, originalField.nextSibling);

        // --- Data Fetch and Link Creation ---
        try {
            const externalKey = await fetchCustomerPortalData(issueKey);
            const url = getCustomerPortalHref(externalKey);

            if (url && externalKey) {
                contentContainer.innerHTML = ''; // Clear loading text
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.textContent = externalKey;
                link.style.cssText = 'display: block; margin-top: 5px; text-decoration: underline;';
                contentContainer.appendChild(link);
            } else {
                statusText.textContent = 'Link Not Found (Missing Key)';
                statusText.style.color = '#DC143C'; // Red for error
            }
        } catch (error) {
            contentContainer.innerHTML = ''; // Clear loading text
            const errorText = document.createElement('span');
            errorText.textContent = `Error: ${error.message}`;
            errorText.style.color = '#DC143C'; // Red for error
            contentContainer.appendChild(errorText);
            // Note: The original error is already logged by fetchCustomerPortalData
        }
    }

    /*********** INTERNAL NOTE HIGHLIGHT ***********/

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

                //Added back color font for Internal Note on Dark Mode
                editorWrapper.style.setProperty('color', '#000000', 'important'); // back color font
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
                editorWrapper.style.removeProperty('color');
            }
            if (editor) {
                editor.style.removeProperty('background-color');
            }
        }
    }
    /*********** INTERNAL NOTE - REMOVE SIGNATURE ***********/

    // Select the "Add internal note" button
    function removeSignatureFromInternalNote() {
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

    /*********** NEW FEATURE: HIGH PRIORITY FLAME ICON ***********/
    function addFlameIconToHighPriority() {
        // Selector for the specific High Priority image URLs
        const highPrioritySelectors = [
            'img[src*="high_new.svg"]', // Matches the first URL
            'img[src*="avatar/10635"]'  // Matches the second URL
        ].join(', ');

        const highPriorityIcons = document.querySelectorAll(highPrioritySelectors);

        highPriorityIcons.forEach(icon => {
            // Check if the flame icon has already been added to avoid duplicates
            if (icon.closest('.flame-icon-wrapper')) {
                return;
            }

            // Create the flame icon element
            const flameIcon = document.createElement('span');
            flameIcon.textContent = '🔥'; // The flame emoji
            flameIcon.style.cssText = 'font-size: 16px; margin-left: 5px; vertical-align: middle; display: inline-block;';

            // Wrap the original icon and the new flame icon in a container
            const wrapper = document.createElement('span');
            wrapper.classList.add('flame-icon-wrapper');
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';

            // Check if the icon is already wrapped, and if so, unwrap it first
            // to place the new wrapper correctly (optional defensive coding)
            const parent = icon.parentNode;

            // Move the original icon into the wrapper
            wrapper.appendChild(icon.cloneNode(true)); // Clone the icon to move it

            // Add the flame icon to the wrapper
            wrapper.appendChild(flameIcon);

            // Replace the original icon with the new wrapper
            parent.replaceChild(wrapper, icon);
        });
    }

    /*********** https://liferay.atlassian.net/browse/LRSUPPORT-47251 ***********/
   function expandCCCInfo() {
        // 1. Define the headers we want to target
        const targetHeaders = [
            "CCC Account Info",
            "CCC Infrastructure Info",
            "CCC SaaS Maintenance Info"
        ];

        // 2. Find all headers (h3) and all Object Cards on the page
        const allHeaders = Array.from(document.querySelectorAll('h3'));
        const allCards = document.querySelectorAll('[data-testid="issue-field-cmdb-object-lazy.ui.card.cmdb-object-card"]');

        // 3. Iterate through every card found
        allCards.forEach(card => {
            // Find the header that this card belongs to.
            // We do this by filtering headers that appear BEFORE this specific card,
            // and taking the last one (the nearest one).
            const precedingHeaders = allHeaders.filter(h =>
                (h.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)
            );

            const nearestHeader = precedingHeaders.length > 0 ? precedingHeaders[precedingHeaders.length - 1] : null;

            // 4. Check if the nearest header is one of our targets
            if (nearestHeader && targetHeaders.includes(nearestHeader.textContent.trim())) {

                // 5. Find the Expand Button inside this specific card
                const buttons = card.querySelectorAll('button');
                let expandBtn = null;

                buttons.forEach(btn => {
                    const testId = btn.getAttribute('data-testid') || "";
                    // Select the button that is NOT "View Details" or "Edit"
                    if (!testId.includes('button-view-details') && !testId.includes('button-edit')) {
                        expandBtn = btn;
                    }
                });

                // 6. Click logic with Mutation Guard
                if (expandBtn && !expandBtn.hasAttribute('data-userscript-auto-expanded')) {
                    expandBtn.click();
                    expandBtn.setAttribute('data-userscript-auto-expanded', 'true');
                }
            }
        });
        setTimeout(transformLinks, 500); //Convert links elements
    }

    // Converts plain text URLs into clickable hyperlinks. 
    // For Liferay Jira links, shows the Issue ID.
    function transformLinks() {
        const divSelector = 'div[data-testid="insight-attribute-list-text-attribute-text"]';
        const targetDiv = document.querySelector(divSelector);
    
        // Process only once
        if (!targetDiv || targetDiv.dataset.linksProcessed) return;
    
        targetDiv.style.whiteSpace = 'pre-wrap';
        const originalText = targetDiv.textContent;
    
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    
        const linkedHtml = originalText.replace(urlRegex, (capturedUrl) => {
            let cleanUrl = capturedUrl;
            let trailingPunctuation = '';
    
            // Clean trailing characters
            while (cleanUrl.length > 0 && /[).,;:?!]$/.test(cleanUrl)) {
                const lastChar = cleanUrl.slice(-1);
                cleanUrl = cleanUrl.slice(0, -1);
                trailingPunctuation = lastChar + trailingPunctuation;
            }
    
            if (cleanUrl.length < 4) return capturedUrl;
    
            let href = cleanUrl;
            if (!cleanUrl.match(/^https?:\/\//i)) {
                href = 'http://' + cleanUrl;
            }
    
            let linkText = cleanUrl;
            // if it is a link to a Jira issue, use its ID instead
            if (cleanUrl.startsWith('https://liferay.atlassian.net')) {
                const jiraIdMatch = cleanUrl.match(/\/([A-Z]+-\d+)$/);
                if (jiraIdMatch) {
                    linkText = jiraIdMatch[1]; // Ej: "LPP-1234"
                }
            }
    
            return `<a href="${href}" target="_blank">${linkText}</a>${trailingPunctuation}`;
        });
    
        targetDiv.innerHTML = linkedHtml;
        targetDiv.dataset.linksProcessed = "true";
    }

    /*
      OPTIONAL FEATURES
      1. Disable JIRA Shortcuts
      2. Open Tickets In a New Tab

      How to Use:
      1. Go to TamperMonkey Icon in the browser
      2. Enable/Disable Features
      3. Refresh Jira for changes to change affect

      Note: The features are disabled by default.

        ===============================================================================
        */
    /*********** TOGGLE MENU ***********/
    const DEFAULTS = {
        disableShortcuts: false,
        bgTabOpen: false
    };

    const S = {
        disableShortcuts: GM_getValue("disableShortcuts", DEFAULTS.disableShortcuts),
        bgTabOpen: GM_getValue("bgTabOpen", DEFAULTS.bgTabOpen),
    };

    function registerMenu() {
        GM_registerMenuCommand(
            `Disable Jira Shortcuts: ${S.disableShortcuts ? "ON" : "OFF"}`,
            () => toggleSetting("disableShortcuts")
        );
        GM_registerMenuCommand(
            `Open Tickets in New Tab: ${S.bgTabOpen ? "ON" : "OFF"}`,
            () => toggleSetting("bgTabOpen")
        );
    }

    function toggleSetting(key) {
        S[key] = !S[key];
        GM_setValue(key, S[key]);
        alert(`Toggled ${key} → ${S[key] ? "ON" : "OFF"}.\nReload Jira for full effect.`);
    }

    /*********** OPEN TICKETS IN A NEW TAB ***********/
    function backgroundTabLinks() {
        if (!S.bgTabOpen) return;
        document.addEventListener("click", backgroundTabHandler, true);
    }

    function backgroundTabHandler(e) {
        const link = e.target.closest("a");
        if (!link?.href) return;

        const issueLinkPattern = /^https:\/\/[^/]+\/browse\/[A-Z0-9]+-\d+$/i;
        if (!issueLinkPattern.test(link.href)) return;
        
        if (e.ctrlKey || e.metaKey || e.button !== 0) return;

        e.stopImmediatePropagation();
        e.preventDefault();
        window.open(link.href, "_blank");
    }

    /*********** DISABLE JIRA SHORTCUTS ***********/
    function disableShortcuts() {
        if (!S.disableShortcuts) return;

        window.addEventListener('keydown', blockShortcuts, true);
        window.addEventListener('keypress', stopEventPropagation, true);
        window.addEventListener('keyup', stopEventPropagation, true);
    }

    function blockShortcuts(e) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
        e.stopImmediatePropagation();
    }

    function stopEventPropagation(e) {
        e.stopImmediatePropagation();
    }

    /*********** INITIAL RUN + OBSERVERS ***********/
    async function updateUI() {
        applyColors();
        createPatcherField();
        createJiraFilterLinkField();
        highlightEditor();
        await createCustomerPortalField();
       // removeSignatureFromInternalNote();
        addFlameIconToHighPriority();
        expandCCCInfo();
        addColorToProposedSolution();
    }

    await updateUI();
    registerMenu();
    disableShortcuts();
    backgroundTabLinks();

    const createThrottler = (callback, delay) => {
        let pending = false;
        let queued = false;
        return function throttle() {
            if (pending) {
                queued = true;
                return;
            }
            callback();
            pending = true;
            setTimeout(() => {
                pending = false;
                if (queued) {
                    queued = false;
                    throttle();
                }
            }, delay);
        };
    };

    const throttledUpdateUI = createThrottler(() => updateUI(), 1000); // Max 1 execution / second
    const observer = new MutationObserver(throttledUpdateUI);
    observer.observe(document.body, { childList: true, subtree: true });

})();
