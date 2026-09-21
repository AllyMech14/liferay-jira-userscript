// ==UserScript==
// @name         Jira for CSEs
// @author       Ally, Rita, Dmcisneros
// @icon         https://www.liferay.com/o/classic-theme/images/favicon.ico
// @namespace    https://liferay.atlassian.net/
// @version      3.29
// @description  Jira statuses + Patcher, Account tickets and CP Link field + Internal Note highlight + Auto Expand CCC Info + colorize solution proposed + Internal Request Warning + Large File Attachment section + Entitlement markers
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
        'open': { bg: '#cc2d24', color: '#fff' },

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
            '[data-testid$="status-button.status-button"],' + // NEW: the new status button element itself
            '[data-testid*="cell-wrapper-row"][data-testid$="-status"] button,' + // NEW: queue table status button, at-rest state (no data-testid/title/aria-label until hovered/focused)
            '.css-1mh9skp,' +
            '.css-14er0c4,' +
            '.css-1ei6h1c'
        );

        // Apply base lozenge sizing & centering to ALL statuses
            elements.forEach(el => {
            let rawText = (el.innerText || el.textContent || '').trim();

            const testId = el.getAttribute('data-testid') || '';
            const isStatusButton = testId.endsWith('status-button.status-button');

            if (isStatusButton) {
                const textSpan = el.querySelector('[data-testid$="status-button--text"]');
                if (textSpan) {
                    rawText = textSpan.textContent.trim();
                } else {
                    const ariaLabel = el.getAttribute('aria-label') || '';
                    rawText = ariaLabel.replace(/-\s*Change status$/i, '').trim();
                }
            }

            const key = normalizeStatus(rawText);
            const style = statusColors[key];

            // Only force lozenge sizing on the OLD-style elements.
            if (!isStatusButton) {
                el.style.padding = '3px 0px 3px 4px';
                el.style.fontSize = '0.8rem';
                el.style.borderRadius = '4px';
                el.style.minHeight = '13px';
                el.style.minWidth = '24px';
                el.style.display = 'inline-flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'left';
                el.style.lineHeight = '1';
                el.style.boxSizing = 'border-box';
                el.style.backgroundImage = 'none';
                el.style.boxShadow = 'none';
            } else {
                // Tweaks for the button
                el.style.borderRadius = '4px';
                el.style.backgroundImage = 'none';
                el.style.boxShadow = 'none';
                el.style.setProperty('font-size', '10.5px', 'important');
                el.style.setProperty('font-weight', 'bold', 'important');
            }

            if (style) {
                el.style.setProperty("background", style.bg, "important");
                el.style.setProperty("color", style.color, "important");
                el.style.setProperty("font-weight", "bold", "important");
                el.style.setProperty("border", "none", "important");
                el.title=rawText;
            }

            el.querySelectorAll('span').forEach(span => {
                span.style.setProperty("background", "transparent", "important");
                span.style.setProperty("color", "inherit", "important");
                span.style.setProperty("font-size", "1em", "important");
                span.style.setProperty("font-weight", "inherit", "important");
            });
        });
    }
    function getTicketType() {
        const title = document.title;
        const match = title.match(/\[([A-Z]+)-\d+\]/);
        return match ? match[1] : null;
    }

    /*********** INTERNAL REQUEST TOP BAR WARNING ***********/

    function isInternalRequest() {
        const project = getTicketType();
        if (project !== 'LRHC') return false;

        const requestTypeElement = document.querySelector('[data-testid*="customfield_10010"]');
        if (!requestTypeElement) return false;

        const text = requestTypeElement.textContent || "";
        return text.includes("Internal Request");
    }

    function checkInternalRequestWarning() {
        const existingWarning = document.getElementById('internal-request-warning-bar');
        const showWarning = isInternalRequest();

        if (showWarning) {
            if (existingWarning) return;

            const warningBar = document.createElement('div');
            warningBar.id = 'internal-request-warning-bar';
            warningBar.style.cssText = `
                background-color: #FFAB00;
                color: #172B4D;
                text-align: center;
                padding: 10px;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 9999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            `;

            const linkUrl = "https://liferay.atlassian.net/wiki/spaces/SUPPORT/pages/4096557057/JSM+Agent+Overview#How-To-Publish-an-Internal-Request-to-customers";
            warningBar.innerHTML = `
                ⚠️ Manually changing the request type to General Request <b>will not publish the ticket</b>.
                To avoid issues, please use the <b>Publish to Customer automation</b>.
                <a href="${linkUrl}" target="_blank" style="color: #0052CC; text-decoration: underline; margin-left: 5px;">More info here.</a>
            `;

            document.body.prepend(warningBar);
            document.body.style.paddingTop = '40px';
        } else {
            if (existingWarning) {
                existingWarning.remove();
                document.body.style.paddingTop = '0px';
            }
        }
    }


    /*********** JIRA FILTER LINK FIELD ***********/

    // Utility function to construct the Jira JQL filter URL
    function getJiraFilterHref(accountCode) {
        if (!accountCode) return null;

        // The base JQL query string containing the <CODE> placeholder
        const jiraFilterByAccountCode = 'https://liferay.atlassian.net/issues/?jql=%22account%20code%5Bshort%20text%5D%22%20~%20%22<CODE>%22%20and%20project%20in%20(LRHC%2C%20LRFLS)%20ORDER%20BY%20created%20DESC';

        // Replace the placeholder <CODE> with the actual account code
        return jiraFilterByAccountCode.replace('<CODE>', accountCode);
    }

    function createJiraFilterLinkField({ afterFieldClass = null }) {
        const accountCode = getAccountCode();

        const callbackFn = async () => {
            const url = getJiraFilterHref(accountCode);
            return { url, name: accountCode };
        }
        const newField = { heading: 'Account Filter', class: 'jira-filter-link-field' }

        createPanelFieldLink({ newField, callbackFn, afterFieldClass })
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

    function createPatcherField({ afterFieldClass = null }) {
        const accountCode = getAccountCode();

        const callbackFn = async () => {
            const url = getPatcherPortalAccountsHREF('', { accountEntryCode: accountCode });
            return { url, name: accountCode };
        }
        const newField = { heading: 'Patcher Portal', class: 'patcher-link-field' }

        createPanelFieldLink({ newField, callbackFn, afterFieldClass })
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
    function createCustomerPortalField({ afterFieldClass = null }) {
        const issueKey = getIssueKey();
        if (!issueKey) return;

        const callbackFn = async () => {
            const externalKey = await fetchCustomerPortalData(issueKey);
            const url = externalKey ? `https://support.liferay.com/project/#/${externalKey}` : null;
            return { url, name: externalKey };
        }
        const newField = { heading: 'Customer Portal', class: 'customer-portal-link-field' }

        createPanelFieldLink({ newField, callbackFn, afterFieldClass })
    }


    /*********** INTERNAL NOTE HIGHLIGHT ***********/

    function highlightEditor() {
        // Check if the issue transition modal is being used
        const transitionModal = document.querySelector('section[data-testid="issue-transition.ui.issue-transition-modal"]');

        let editorWrapper, editor, internalNoteButton;

        if (transitionModal) {
            const commentContainer = transitionModal.querySelector('#comment-container');
            if (commentContainer) {
                editorWrapper = commentContainer.querySelector('.css-sox1a6');
                editor = commentContainer.querySelector('#ak-editor-textarea') || commentContainer.querySelector('textarea');
                internalNoteButton = document.getElementById('issue-transition-comment-editor-container-tabs-0');
            }

        } else {
            editorWrapper = document.querySelector('.css-sox1a6');
            editor = document.querySelector('#ak-editor-textarea');
            internalNoteButton = document.querySelector('#comment-editor-container-tabs-0');
        }

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


    /*********** SUPPORT ATTACHMENTS DETECTOR ***********/
    function detectSupportAttachments() {
      // 1. Target the specific SSR placeholder
      const ssrPlaceholder = document.querySelector('[data-ssr-placeholder-replace="issue-content-template-renderer-section"]');
      if (!ssrPlaceholder) return;

      // 2. Find all relevant support attachment links
      const attachmentLinks = document.querySelectorAll('a[href*="support.liferay.com/ticket-attachments/"]');
      if (attachmentLinks.length === 0) return;

      // 3. Create or find the custom container using Jira-like classes
      let customContainer = document.getElementById('userscript-attachments-container');
      if (!customContainer) {
          customContainer = document.createElement('div');
          customContainer.id = 'userscript-attachments-container';
          // Applied the classes you provided to match Jira's sidebar/content sections
          customContainer.style.marginTop = "20px";

          customContainer.innerHTML = `
              <div class="_1e0c1txw _4cvr1h6o" style="display: block !important;">
                  <h2 class="_11c81e3o _syazi7uo _1i4q1hna _1ul9idpf" style="margin-bottom: 12px;">
                      Large File Attachments
                  </h2>
                  <ul id="userscript-attachments-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                  </ul>
              </div>
          `;

          // Inject it right after the placeholder
          ssrPlaceholder.parentNode.insertBefore(customContainer, ssrPlaceholder.nextSibling);
      }

      const listContainer = document.getElementById('userscript-attachments-list');

      // 4. Process links and add them as list items (<li>)
      attachmentLinks.forEach(link => {
          const linkHref = link.href;
          const linkText = link.textContent.trim();

          if (!link.dataset.attachmentLogged) {
              link.dataset.attachmentLogged = "true";
          }

          // Append to the <ul> if the specific link is not already present
          if (!listContainer.querySelector(`a[href="${linkHref}"]`)) {
              const listItem = document.createElement('li');
              listItem.style.display = "block";

              const linkElement = document.createElement('a');
              linkElement.href = linkHref;
              linkElement.target = "_blank";
              linkElement.textContent = `${linkText}`;
              linkElement.style.cssText = `
                  color: #0052cc;
                  text-decoration: underline;
                  font-size: 14px;
                  font-weight: 500;
                  line-height: 1.5;
              `;

              listItem.appendChild(linkElement);
              listContainer.appendChild(listItem);
          }
      });
    }


     /*********** NEW FEATURE: ADD PARTNER ICON ***********/

     // Cache to prevent repeated API calls per ticket
    const partnerCache = {
        issueKey: null,
        assetInfo: null,
        hasPartner: null,
        promise: null
    };

     // Fetch customfield_12567 (User Asset)
    async function fetchUserInfo(issueKey) {
        const apiUrl = `/rest/api/3/issue/${issueKey}?fields=customfield_12567`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API failed (${res.status}) for ${apiUrl}`);
        const data = await res.json();
        const field = data.fields.customfield_12567?.[0];

        if (!field) {
            throw new Error('"User Asset" missing or empty on ticket.');
        }

        // Return only necessary IDs
        return {
            workspaceId: field.workspaceId,
            objectId: field.objectId //user object id
        };
    }

    //Check if Partner Entitlement exists
    async function checkPartnerAttribute(workspaceId, objectId) {
        const url = `/gateway/api/jsm/assets/workspace/${workspaceId}/v1/object/${objectId}?includeExtendedInfo=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Gateway API failed (${res.status}) for ${url}`);
        const data = await res.json();

        // Look for an attribute with name "Partner"
        const hasPartner = (data.attributes || []).some(attr =>(attr.objectAttributeValues || []).some(val => val.referencedObject?.name === 'Partner' || val.displayValue === 'Partner'));
        return hasPartner;
    }

    // Main function with caching/concurrency
    async function fetchPartnerInfo(issueKey) {
        // Use cache if available
        if (partnerCache.issueKey === issueKey && partnerCache.hasPartner !== null) {
            return partnerCache.hasPartner;
        }

        if (partnerCache.issueKey !== issueKey) {
            partnerCache.issueKey = issueKey;
            partnerCache.assetInfo = null;
            partnerCache.hasPartner = null;
            partnerCache.promise = null;
        }

        if (partnerCache.promise) return partnerCache.promise;

        partnerCache.promise = (async () => {
            try {
                const assetInfo = await fetchUserInfo(issueKey);
                partnerCache.assetInfo = assetInfo;

                const hasPartner = await checkPartnerAttribute(assetInfo.workspaceId, assetInfo.objectId);
                partnerCache.hasPartner = hasPartner;
                return hasPartner;
            } catch (error) {
                partnerCache.assetInfo = null;
                partnerCache.hasPartner = null;
                partnerCache.promise = null;
                return false;
            }
        })();

        return partnerCache.promise;
    }

    //Update the UI
    async function createPartnerIconField() {
        const ticketType = getTicketType();
        if (!['LRHC', 'LRFLS'].includes(ticketType)) return; // Only run for allowed tickets

        const reporterContainer = document.querySelector('[data-testid="issue.views.field.user.reporter"]');
        if (!reporterContainer || document.querySelector('.simple-p-icon')) return;

        const issueKey = getIssueKey();
        if (!issueKey) return;

        const isPartner = await fetchPartnerInfo(issueKey)
        if (!isPartner) return;

    // Find the inner span with the visible name
    const nameSpan = reporterContainer.querySelector('span._1reo15vq > span');
    if (!nameSpan) {return;}

    // Avoid adding duplicates
    if (reporterContainer.querySelector('.simple-p-icon')) {
        console.log('[SimpleP] P icon already exists, skipping.');
        return;
    }

    // Create the P icon
    const pIcon = document.createElement('span');
    pIcon.textContent = '🅿️';
    pIcon.classList.add('simple-p-icon');
    pIcon.style.cssText = `
        font-size: 16px;
        margin-left: 5px;
        font-weight: bold;
        color: #0052CC;
        vertical-align: middle;
        display: inline-block;
    `;

    // Append after the name span
    nameSpan.after(pIcon);
    }

    /*********** ENTITLEMENT BADGE BAR ***********/
    /*********** https://liferay.atlassian.net/browse/SUPOPS-2286 ***********/

    /*
      Renders colour-coded entitlement badges directly under the ticket summary on
      LRHC / LRFLS, so a CSE can read the customer's support tier and key
      entitlements without scrolling the details panel.

      Data comes from three fields on the issue, read in one authenticated REST call:
        customfield_15072  Support Tier   (select)      e.g. "Premier 24/7 Support"
        customfield_12558  Offering       (Assets ref)  e.g. "Liferay Self-Hosted"
        customfield_12718  Entitlements   (rich text)   e.g. "[DXP, TAM Services, EPS 7.3, Active Subscription]"

      The Entitlements field is the workhorse: a bracketed, comma-separated list.
      Support Tier and Offering are read from their own fields when present and
      fall back to the Entitlements list.

      Badge order is fixed by the ticket's acceptance criteria: tier first, then
      offering, then add-ons, then warnings. Flip a group off in BADGE_GROUPS to
      hide it. To add a badge, append to ADDON_BADGES / PRODUCT_BADGES below.
    */

    // Which badge groups render.
    const BADGE_GROUPS = {
        tier: true,          // Support Tier - always the first badge
        severity: true,      // <TIER> CRITICAL marker on Critical-priority tickets
        offering: true,      // Cloud vs self-hosted, with SaaS edition
        addons: true,        // EPS, TAM, Premium Security, Managed Services
        productAddons: true, // AC (Analytics Cloud), LES (Enterprise Search), Commerce
        lifecycle: true,     // Limited Support / End of Software Life
        heat: true,          // Heat Score
        region: true,        // Foreign Region when customer region != agent region
        warnings: true       // Subscription not active
    };

    /*
      "Support Tier Benefit Resources" - shown at the bottom of every Support Tier
      tooltip. Order matches the SUPOPS-2287 acceptance criteria.
    */
    const TIER_DOC_LINKS = [
        { text: 'Customer-facing Support Tiers article',   url: 'https://support.liferay.com/w/support-tiers-and-service-levels' },
        { text: 'Internal comparison of legacy and new tiers', url: 'https://liferay.atlassian.net/wiki/spaces/CPOPS/pages/4396122593/Support+Tier+Matrix#Comparison-to-Gold-and-Platinum' },
        { text: 'Definitions of Support Tier Benefits',    url: 'https://liferay.atlassian.net/wiki/spaces/CPOPS/pages/4395368852/Description+of+Support+Tier+Benefits' }
    ];

    // TAM references, called out by the SUPOPS-2287 acceptance criteria.
    /*
      TAM references shown on the tier tooltips and on the TAM / TAM Lite markers.

      The SUPOPS-2287 AC also names an additional Customer Success contact
      reference. It is deliberately excluded here - neither linked nor named - so
      the tooltips carry only documentation every CSE can reliably open. Do not
      add it back without checking with Support Ops.
    */
    const TAM_LINKS = [
        { text: 'TAM vs TAM Lite distinctions', url: 'https://support.liferay.com/w/support-tiers-and-service-levels?highlight=support%20tier#:~:text=TAM%20Services%20Benefits%C2%A0%20%C2%A0' }
    ];

    // The four Security Guidance benefits Global 24/7 and Premier 24/7 do NOT get.
    const SECURITY_GUIDANCE_EXCLUDED = [
        'Reviews of security scans',
        'DDoS and SIEM configuration / integration consultation',
        'Assistance completing security questionnaires',
        'Security Incident forensics assistance'
    ];

    // Strategic 24/7 Security Guidance, with the entitlement counts from the AC.
    const SECURITY_GUIDANCE_INCLUDED = [
        'Monthly vulnerabilities report sent from Liferay',
        'Review of up to 4 security scans per subscription year',
        "Review of customer's DDoS protection 2x per year (2hr meetings max)",
        "Assistance completing customer's security questionnaires, limited to 5hrs per year",
        'Security Incident forensics assistance, limited to 8hrs per year',
        'SIEM integration consultation, 1x per year (2hr meetings max)'
    ];

    /*
      Per-tier key points.

      The four NEW tiers are the "Individual Comment text" from the SUPOPS-2287
      acceptance criteria, reproduced as closely as a tooltip allows - that AC is
      the agreed wording, so do not paraphrase without checking the ticket.
      Because these tooltips are intended to carry the whole message, the detail
      that would otherwise go in an auto-posted internal note lives here.

      Legacy tiers are not covered by that AC; theirs are derived from the
      "Comparison to Gold and Platinum" table on the Support Tier Matrix. The AC
      calls Standard 8/5 "very similar to GOLD" and Global 24/7 "very similar to
      PLATINUM", and that hedged wording is kept on the new-tier side only - the
      legacy tooltips deliberately claim no equivalence, because the mappings are
      not exact.

      An entry in `includes` / `excludes` is either a plain string, or
      { text, sub: [...], links: [...] } for a nested list or inline references.
    */
    const SUPPORT_TIER_BADGES = {
        // Current tiers
        'standard 8/5 support': {
            label: 'STANDARD 8/5', bg: '#5E6C84', fg: '#FFFFFF',
            lead: 'This customer is on the new STANDARD 8/5 Support Tier. It is very similar to GOLD, but with some key benefit exclusions to remember.',
            includes: ['Customer Portal Access', 'Unlimited tickets'],
            excludes: [
                'No Sync Sessions (ie: calls and screenshares)',
                'No SEV 1 Prod Incident priority ticket handling (highest is SEV 2 - 2 bus. days SLA)'
            ]
        },
        'global 24/7 support': {
            label: 'GLOBAL 24/7', bg: '#0065FF', fg: '#FFFFFF',
            lead: 'This customer is on the new GLOBAL 24/7 Support Tier. It is very similar to PLATINUM, but with some key benefit exclusions to remember.',
            includes: ['Sync Sessions (calls & screenshares)', '24/7 SEV 1 Prod Incident ticket handling'],
            excludes: [
                'No Support Squads',
                'No TAM unless added-on',
                'No Prod Incident Updates (ie: War Rooms)',
                'No Prod Incident Post Mortem',
                { text: 'No Security Guidance:', sub: SECURITY_GUIDANCE_EXCLUDED }
            ]
        },
        'premier 24/7 support': {
            label: 'PREMIER 24/7', bg: '#6554C0', fg: '#FFFFFF',
            lead: 'This customer is on the new PREMIER 24/7 Support Tier. Some key benefit inclusions and exclusions to remember are listed below.',
            includes: [
                'Faster SLAs',
                'Dedicated Support Squads',
                // Not in the SUPOPS-2287 AC list, but the Support Tier Matrix marks
                // Production Incident Postmortem as a Premier 24/7 benefit.
                'Production Incident Postmortem',
                { text: 'TAM Lite', links: TAM_LINKS }
            ],
            excludes: [
                'No Production Incident Updates (ie: War Rooms)',
                { text: 'No Security Guidance:', sub: SECURITY_GUIDANCE_EXCLUDED }
            ]
        },
        'strategic 24/7 support': {
            label: 'STRATEGIC 24/7', bg: '#A5347D', fg: '#FFFFFF',
            lead: 'This customer is on the new STRATEGIC 24/7 Support Tier. This is the highest tier. Some key benefits to remember are listed below.',
            includes: [
                'Fastest SLAs',
                'All benefits',
                { text: 'Full TAM', links: TAM_LINKS },
                { text: 'Security Guidance:', sub: SECURITY_GUIDANCE_INCLUDED }
            ],
            excludes: []
        },
        /*
          Legacy tiers. Derived from the "Comparison to Gold and Platinum" table
          on the Support Tier Matrix page. Platinum and Premium share one column
          there, so they carry identical key points.
        */
        'gold subscription': {
            label: 'GOLD', bg: '#8F6C00', fg: '#FFFFFF',
            info: 'Legacy tier.',
            includes: ['Customer Portal access', 'Unlimited tickets', 'Sync sessions', '8/5 Production Incident support'],
            excludes: ['No 24/7 Production Incident support', 'No Support Squad', 'No Production Incident postmortem', 'No TAM or TAM Lite', 'No Production Incident Updates', 'No Security Guidance', 'No SEV 4 initial-response SLA']
        },
        'platinum subscription': {
            label: 'PLATINUM', bg: '#253858', fg: '#FFFFFF',
            info: 'Legacy tier.',
            includes: ['Customer Portal access', 'Unlimited tickets', 'Sync sessions', '24/7 Production Incident support'],
            excludes: ['No Support Squad', 'No Production Incident postmortem', 'No TAM or TAM Lite', 'No Production Incident Updates', 'No Security Guidance', 'No SEV 4 initial-response SLA']
        },
        'premium subscription': {
            label: 'PREMIUM', bg: '#403294', fg: '#FFFFFF',
            info: 'Legacy tier. Shares the Platinum column in the tier matrix.',
            includes: ['Customer Portal access', 'Unlimited tickets', 'Sync sessions', '24/7 Production Incident support'],
            excludes: ['No Support Squad', 'No Production Incident postmortem', 'No TAM or TAM Lite', 'No Production Incident Updates', 'No Security Guidance', 'No SEV 4 initial-response SLA']
        }
    };

    /*
      JSM severity. In LRHC/LRFLS the `priority` field carries the ESA severity
      level - the legacy "Level of Severity" (customfield_12727) and "Urgency"
      (customfield_10781) fields are unused (null on every ticket sampled).
      Definitions are verbatim from the Enterprise Service Agreement Support
      Tiers Addendum, quoted on the Support Tier Matrix page.
    */
    const SEVERITY_BADGES = {
        'Critical': { label: 'SEV 1', bg: '#BF2600', fg: '#FFFFFF', name: 'Severity 1 (Urgent)',
            info: 'Production severely impacted or completely shut down, or mission-critical applications inoperable. Worked 24/7.' },
        'High':     { label: 'SEV 2', bg: '#B65C00', fg: '#FFFFFF', name: 'Severity 2 (High)',
            info: 'System functioning with limited capabilities, unstable with periodic interruptions, or material interruptions to mission-critical applications.' },
        'Normal':   { label: 'SEV 3', outline: true, borderColor: '#5E6C84', fg: '#5E6C84', bg: 'transparent', name: 'Severity 3 (Normal)',
            info: 'System fully functional, but with observed errors that do not impact usability.' },
        'Low':      { label: 'SEV 4', outline: true, borderColor: '#8993A4', fg: '#8993A4', bg: 'transparent', name: 'Severity 4 (Low)',
            info: 'System fully functional. General questions about the service, configuration, documentation, or feature enhancements.' }
    };

    /*
      Initial-response SLA per tier and severity, verbatim from the Support Tier
      Matrix "Comparison to Gold and Platinum" table. Shown in the severity
      tooltip so the CSE sees the actual commitment for this ticket.
      "cal" = calendar time, "bus" = business time, null = no SLA at this tier.
    */
    const INITIAL_RESPONSE_SLA = {
        'standard 8/5 support':   { 'SEV 1': null,           'SEV 2': '2 days (bus)', 'SEV 3': '2 days (bus)', 'SEV 4': '3 days (bus)' },
        'gold subscription':      { 'SEV 1': '4 hours (bus)', 'SEV 2': '1 day (bus)',  'SEV 3': '2 days (bus)', 'SEV 4': null },
        'platinum subscription':  { 'SEV 1': '1 hour (cal)',  'SEV 2': '2 hours (bus)','SEV 3': '1 day (bus)',  'SEV 4': null },
        'premium subscription':   { 'SEV 1': '1 hour (cal)',  'SEV 2': '2 hours (bus)','SEV 3': '1 day (bus)',  'SEV 4': null },
        'global 24/7 support':    { 'SEV 1': '1 hour (cal)',  'SEV 2': '2 hours (bus)','SEV 3': '1 day (bus)',  'SEV 4': '2 days (bus)' },
        'premier 24/7 support':   { 'SEV 1': '1 hour (cal)',  'SEV 2': '1 hour (bus)', 'SEV 3': '4 hours (bus)','SEV 4': '1 day (bus)' },
        'strategic 24/7 support': { 'SEV 1': '30 min (cal)',  'SEV 2': '1 hour (bus)', 'SEV 3': '4 hours (bus)','SEV 4': '1 day (bus)' }
    };

    /*
      Support Region (customfield_14485) is free text, so normalise before
      mapping. Observed clean values are the eight below; three malformed rows
      exist in history ("SPAIN", " Australia,China", "Indi=-"), which the
      fallback handles by taking the first two letters.
    */
    const REGION_CODES = {
        'united states': 'US', 'hungary': 'HU', 'brazil': 'BR', 'spain': 'ES',
        'india': 'IN', 'china': 'CN', 'japan': 'JP', 'australia': 'AU'
    };

    // Heat Score (customfield_10168) is an unbounded float. Displayed as-is, no
    // banding - there is no agreed threshold to colour against.
    const HEAT_SCORE_COLOR = '#5E6C84';

    /*
      Product lifecycle, from the EOSL Guide For Support (SUPPORT space, page
      1998783040). Keys match the values of "Liferay DXP Version"
      (customfield_10169); for the "Quarterly Release" value the key comes from
      "Quarterly Release Version" (customfield_12559) instead.

      eops = End of Premium Support, eol = End of Life / EOSL. ISO dates.
      `until` overrides both: the ‡ releases are supported to 13 Mar 2027 because
      the EOL was changed after they shipped. That extension is INTERNAL - the
      guide says it is not publicly documented and should not be mentioned to
      customers, so the tooltip marks it internal-only.

      Maintenance note: these dates need refreshing whenever the EOSL guide
      changes. Guide last verified 08/SEPT/2025, page version 51 (9 Sep 2026).
    */
    const PRODUCT_LIFECYCLE = {
        // DXP and Portal - 4 years Premium, 3 years Limited
        '7.4':           { eops: '2027-09-01', eol: '2030-09-01', note: 'After 31 Aug 2025 only DXP 7.4 Update 92 receives full Premium Support - check the customer\'s update level.' },
        '7.3':           { eops: '2024-10-12', eol: '2027-10-12' },
        '7.2':           { eops: '2023-06-03', eol: '2026-06-03' },
        '7.1':           { eops: '2022-11-13', eol: '2025-11-13' },
        '7.0':           { eops: '2020-06-14', eol: '2023-06-14', note: 'Extended Premium Support for DXP 7.0 has special circumstances.' },
        '6.2':           { eops: '2017-12-01', eol: '2020-12-01', note: 'Extended Premium Support for Portal 6.2 has special circumstances.' },
        '6.1':           { eops: '2016-02-21', eol: '2016-02-21' },
        '6.0':           { eops: '2014-09-10', eol: '2017-09-10' },
        // Quarterly Releases - LTS: 3 years Premium / 2 years Limited. Non-LTS: 1 year Premium, no Limited.
        '2026.Q3':       { eops: '2027-08-18', eol: '2027-08-18' },
        '2026.Q2':       { eops: '2027-05-12', eol: '2027-05-12' },
        '2026.Q1':       { eops: '2029-03-17', eol: '2031-03-17', lts: true },
        '2025.Q4':       { eops: '2026-11-25', eol: '2026-11-25' },
        '2025.Q3':       { eops: '2026-09-02', eol: '2026-09-02' },
        '2025.Q2':       { eops: '2026-05-27', eol: '2026-05-27' },
        '2025.Q1':       { eops: '2028-02-18', eol: '2030-02-18', lts: true },
        '2024.Q4':       { eops: '2025-12-10', eol: '2025-12-10' },
        '2024.Q3':       { eops: '2025-09-11', eol: '2025-09-11', until: '2027-03-13' },
        '2024.Q2':       { eops: '2025-06-11', eol: '2025-06-11', until: '2027-03-13' },
        '2024.Q1':       { eops: '2027-03-13', eol: '2029-03-12', lts: true },
        '2023.Q4':       { eops: '2025-12-31', eol: '2025-12-31', until: '2027-03-13' },
        '2023.Q3':       { eops: '2025-12-31', eol: '2025-12-31', until: '2027-03-13' }
    };

    /*
      Offering answers "what product is THIS ticket about", so it comes only from
      the Offering field (customfield_12558) - never from Entitlements, which
      lists everything the customer's project is eligible for and may name SaaS,
      PaaS and Self-Hosted at once.

      That field is typed as a generic Assets "Entitlement" object, so it can hold
      values that are not offerings at all - "Developer Tools" (LRHC-156321) and
      "Provisioning Request" (LRHC-156447) both occur. This map therefore doubles
      as a whitelist: anything not listed here renders no offering badge rather
      than a misleading one. Add new offerings here as they appear.
    */
    const OFFERING_BADGES = {
        'liferay saas':        { label: '☁ SaaS',      bg: '#00A3BF', fg: '#FFFFFF', info: 'This ticket is for Liferay SaaS - a Liferay-hosted cloud offering.' },
        'liferay paas':        { label: '☁ PaaS',      bg: '#00758F', fg: '#FFFFFF', info: 'This ticket is for Liferay PaaS - a Liferay-hosted cloud offering.' },
        'liferay self-hosted': { label: 'SELF-HOSTED', bg: '#7A869A', fg: '#FFFFFF', info: 'This ticket is for a customer-hosted environment. Not a cloud ticket.' }
    };

    /*
      Add-ons and specialised support. `test` runs against each entitlement token.
      Observed EPS tokens: "EPS 7.1", "EPS 7.2", "EPS 7.3", "EPS Portal".
    */
    const ADDON_BADGES = [
        {
            test: t => /^eps\s+([\d.]+)/i.test(t),
            build: t => ({
                label: 'EPS ' + t.match(/^eps\s+([\d.]+)/i)[1],
                bg: '#B65C00', fg: '#FFFFFF',
                info: 'Extended Premium Support for ' + t.match(/^eps\s+([\d.]+)/i)[1] + '. Paid extension past end of standard software life.'
            })
        },
        {
            test: t => /^eps portal$/i.test(t),
            build: () => ({ label: 'EPS PORTAL', bg: '#B65C00', fg: '#FFFFFF', info: 'Extended Premium Support for Portal (pre-DXP).' })
        },
        {
            /*
              TAM Lite does not yet appear in the Entitlements field - every TAM
              token in LRHC/LRFLS history is "TAM Services". Kept so the badge
              lights up automatically if Assets starts emitting it. Jay Lee notes
              on SUPOPS-2287 that TAM Lite is a Premier 24/7 inclusion and full
              TAM a Strategic 24/7 inclusion, so the tier tooltip covers it today.
            */
            test: t => /tam\s*lite/i.test(t),
            build: () => ({
                label: 'TAM LITE', bg: '#4C9A75', fg: '#FFFFFF',
                info: 'Reduced-scope Technical Account Manager engagement. Meetings limited to 1 x 30 minutes per week.',
                links: TAM_LINKS
            })
        },
        {
            test: t => /tam\s*services/i.test(t),
            build: () => ({
                label: 'TAM', bg: '#216E4E', fg: '#FFFFFF',
                info: 'Full Technical Account Manager engagement, with a named TAM on the account. Meetings 1 x 60 minutes per week, and unlike TAM Lite it adds implementation/performance/maintenance guidance, third-party guidance, health checks, and go-live and upgrade planning.',
                links: TAM_LINKS
            })
        },
        {
            test: t => /premium security trial/i.test(t),
            build: () => ({ label: 'PREM SECURITY (TRIAL)', bg: '#9C6ADE', fg: '#FFFFFF', info: 'Premium Security on trial, not a paid entitlement. May lapse.' })
        },
        {
            // Must exclude the trial, or "Premium Security Trial" matches both entries.
            test: t => /premium security/i.test(t) && !/trial/i.test(t),
            build: () => ({ label: 'PREM SECURITY', bg: '#4A148C', fg: '#FFFFFF', info: 'Paid Premium Security add-on (hardened platform and security SLAs).' })
        },
        {
            test: t => /^managed services$/i.test(t),
            build: () => ({ label: 'MANAGED SVCS', bg: '#0747A6', fg: '#FFFFFF', info: 'Liferay operates the environment. Route infra issues to the Managed Services team.' })
        }
    ];

    // Product add-ons - lower emphasis than support entitlements.
    const PRODUCT_BADGES = [
        {
            test: t => /^liferay analytics cloud$/i.test(t),
            build: () => ({ label: 'AC', bg: '#5243AA', fg: '#FFFFFF', info: 'Liferay Analytics Cloud is licensed on this account.' })
        },
        {
            test: t => /^liferay enterprise search$/i.test(t),
            build: () => ({ label: 'LES', bg: '#206A83', fg: '#FFFFFF', info: 'Liferay Enterprise Search is licensed on this account.' })
        },
        {
            test: t => /^liferay commerce$/i.test(t),
            build: () => ({ label: 'COMMERCE', bg: '#1F845A', fg: '#FFFFFF', info: 'Liferay Commerce is licensed on this account.' })
        }
    ];

    const BADGE_BAR_ID = 'userscript-entitlement-badge-bar';
    const BADGE_TOOLTIP_ID = 'userscript-entitlement-tooltip';

    // Selectors for the ticket summary heading, most specific first. Jira renames
    // these occasionally, so we try several and bail quietly if none match.
    const SUMMARY_HEADING_SELECTORS = [
        '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
        '[data-testid="issue-view-foundation.summary.heading"]',
        '[data-component-selector="jira-issue-view-foundation-summary-heading"]',
        'h1[data-testid*="summary"]'
    ];

    const entitlementCache = {
        issueKey: null,
        data: null,
        promise: null
    };

    // Flatten an ADF rich-text document down to its plain text.
    function adfToText(doc) {
        if (!doc) return '';
        if (typeof doc === 'string') return doc;
        let out = '';
        const walk = node => {
            if (!node) return;
            if (typeof node.text === 'string') out += node.text;
            (node.content || []).forEach(walk);
        };
        walk(doc);
        return out;
    }

    // "[DXP, TAM Services, Active Subscription]" -> ["DXP", "TAM Services", "Active Subscription"]
    function parseEntitlementTokens(text) {
        if (!text) return [];
        return text
            .replace(/^\s*\[/, '')
            .replace(/\]\s*$/, '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
    }

    async function fetchEntitlementData(issueKey) {
        if (entitlementCache.issueKey === issueKey && entitlementCache.data) {
            return entitlementCache.data;
        }

        if (entitlementCache.issueKey !== issueKey) {
            entitlementCache.issueKey = issueKey;
            entitlementCache.data = null;
            entitlementCache.promise = null;
        }

        if (entitlementCache.promise) return entitlementCache.promise;

        entitlementCache.promise = (async () => {
            try {
                const fields = [
                    'priority',
                    'customfield_15072', // Support Tier
                    'customfield_12558', // Offering (Assets)
                    'customfield_12718', // Entitlements
                    'customfield_10168', // Heat Score
                    'customfield_12594', // Heat Tag
                    'customfield_14485', // Support Region (customer)
                    'customfield_12586', // Agent Support Region
                    'customfield_10169', // Liferay DXP Version
                    'customfield_12559'  // Quarterly Release Version
                ].join(',');
                const url = `/rest/api/3/issue/${issueKey}?fields=${fields}&expand=customfield_12558.cmdb.label`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`API failed (${res.status}) for ${url}`);
                const json = await res.json();
                const f = json.fields || {};

                // Heat Tag is a cascading select; join parent and child for the tooltip.
                const heatTag = f.customfield_12594
                    ? [f.customfield_12594.value, f.customfield_12594.child?.value].filter(Boolean).join(' - ')
                    : null;

                const data = {
                    supportTier: f.customfield_15072?.value || null,
                    offering: f.customfield_12558?.[0]?.label || null,
                    tokens: parseEntitlementTokens(adfToText(f.customfield_12718)),
                    priority: f.priority?.name || null,
                    heatScore: typeof f.customfield_10168 === 'number' ? f.customfield_10168 : null,
                    heatTag,
                    customerRegion: (f.customfield_14485 || '').trim() || null,
                    agentRegion: (f.customfield_12586 || '').trim() || null,
                    // "Quarterly Release" in the DXP Version field defers to the
                    // Quarterly Release Version field for the actual release.
                    productVersion: f.customfield_10169?.value === 'Quarterly Release'
                        ? (f.customfield_12559?.value || null)
                        : (f.customfield_10169?.value || null)
                };

                entitlementCache.data = data;
                return data;
            } catch (error) {
                console.error('[Entitlement badges] Failed to load entitlements:', error.message);
                entitlementCache.data = null;
                entitlementCache.promise = null;
                return null;
            }
        })();

        return entitlementCache.promise;
    }

    /*
      Turn the raw field data into an ordered badge list.
      Order is the acceptance criteria's order: tier, offering, add-ons, warnings.
    */
    function buildBadges(data) {
        const badges = [];
        const tokens = data.tokens || [];
        const lower = tokens.map(t => t.toLowerCase());

        /*
          The tier the rest of the function reasons about (SLA lookup, SEV 1
          eligibility). Entitlements is the source of truth - across 90 days and
          all seven tier values it never disagreed with the Support Tier field and
          is populated slightly more often - so it is read first here.
        */
        let tierNameUsed = null;
        const tierIdx = lower.findIndex(t => SUPPORT_TIER_BADGES[t]);
        if (tierIdx > -1) tierNameUsed = tokens[tierIdx];
        if (!tierNameUsed) tierNameUsed = data.supportTier;

        /* --- 1. Support Tier (always first) --- */
        if (BADGE_GROUPS.tier) {
            const tierName = tierNameUsed;
            if (tierName) {
                const def = SUPPORT_TIER_BADGES[tierName.toLowerCase()];
                badges.push(def
                    // Every tier tooltip carries the benefit documentation links.
                    ? { ...def, tooltipTitle: tierName, links: TIER_DOC_LINKS }
                    // Unmapped tier: still show it rather than hiding the most important badge.
                    : { label: tierName.toUpperCase(), bg: '#5E6C84', fg: '#FFFFFF', tooltipTitle: tierName, info: 'Support tier not yet mapped in the user script.', links: TIER_DOC_LINKS });
            } else {
                badges.push({ label: 'NO SUPPORT TIER', bg: '#DE350B', fg: '#FFFFFF', tooltipTitle: 'Support Tier missing', info: 'No Support Tier is set on this ticket and none was found in Entitlements.' });
            }
        }

        /* --- 1b. JSM severity, with the initial-response SLA for this tier --- */
        if (BADGE_GROUPS.severity && data.priority) {
            const sev = SEVERITY_BADGES[data.priority];
            if (sev) {
                const tierKey = (tierNameUsed || '').toLowerCase();
                const slaRow = INITIAL_RESPONSE_SLA[tierKey];
                const extra = [];

                if (slaRow) {
                    const sla = slaRow[sev.label];
                    extra.push(sla
                        ? 'Initial response SLA at ' + tierNameUsed + ': ' + sla + '.'
                        : 'No ' + sev.label + ' initial-response SLA at ' + tierNameUsed + '.');
                }
                // Standard 8/5 customers cannot submit SEV 1 at all.
                if (tierKey === 'standard 8/5 support' && sev.label === 'SEV 1') {
                    extra.push('Standard 8/5 cannot submit SEV 1 - the highest they may submit is SEV 2. Re-check the severity.');
                }

                badges.push({
                    ...sev,
                    tooltipTitle: sev.name,
                    info: [sev.info].concat(extra).join(' ')
                });
            }
        }

        /*
          --- 2. Offering: what THIS ticket is about ---
          Offering field only, whitelisted through OFFERING_BADGES. No fallback to
          Entitlements: that field lists what the project is eligible for and can
          name SaaS, PaaS and Self-Hosted together, which says nothing about the
          product this ticket was opened for. An unrecognised value (e.g.
          "Provisioning Request") renders no badge.
        */
        if (BADGE_GROUPS.offering && data.offering) {
            /*
              The Offering field sometimes names the edition itself
              ("Liferay SaaS - Enterprise", LRHC-147509) and sometimes just the
              platform ("Liferay SaaS"). Strip a trailing edition to find the
              platform, and keep the edition when it was given.
            */
            const editionMatch = data.offering.match(/^(liferay saas)\s*-\s*(.+)$/i);
            const platform = editionMatch ? editionMatch[1] : data.offering;
            let edition = editionMatch ? editionMatch[2].trim() : null;

            const def = OFFERING_BADGES[platform.toLowerCase()];
            if (def) {
                /*
                  Only when the Offering field did not name an edition, fall back to
                  Entitlements - and only if it names exactly one. More than one means
                  the project holds several SaaS editions and we cannot tell which
                  applies to this ticket.
                */
                if (!edition && def.label.includes('SaaS')) {
                    const editionTokens = tokens.filter(t => /^liferay saas\s*-\s*.+/i.test(t));
                    if (editionTokens.length === 1) {
                        edition = editionTokens[0].replace(/^liferay saas\s*-\s*/i, '').trim();
                    }
                }
                badges.push({
                    ...def,
                    label: edition ? `${def.label} · ${edition.toUpperCase()}` : def.label,
                    tooltipTitle: edition ? `${platform} - ${edition}` : platform
                });
            }
        }

        /* --- 3. Add-ons and specialised support --- */
        const runMatchers = matchers => {
            matchers.forEach(matcher => {
                const token = tokens.find(matcher.test);
                if (!token) return;
                const built = matcher.build(token);
                // TAM Lite and TAM Services are mutually exclusive in the UI.
                if (built.label === 'TAM' && badges.some(b => b.label === 'TAM LITE')) return;
                if (badges.some(b => b.label === built.label)) return;
                badges.push({ ...built, tooltipTitle: token });
            });
        };

        if (BADGE_GROUPS.addons) runMatchers(ADDON_BADGES);
        if (BADGE_GROUPS.productAddons) runMatchers(PRODUCT_BADGES);

        /* --- 3b. Product support phase / EOSL --- */
        if (BADGE_GROUPS.lifecycle && data.productVersion) {
            const life = PRODUCT_LIFECYCLE[data.productVersion];
            if (life) {
                const today = new Date().toISOString().slice(0, 10);
                /*
                  An EPS entitlement for this exact version extends full Premium
                  Support, so it takes precedence and the EPS badge already says so.
                */
                const epsCovers = tokens.some(t => new RegExp('^eps\\s+' + data.productVersion.replace('.', '\\.') + '$', 'i').test(t));

                let phase = null;
                if (life.until && today < life.until) {
                    phase = null; // Premium Support extended (internal-only extension).
                } else if (today >= life.eol) {
                    phase = {
                        label: 'END OF SOFTWARE LIFE', bg: '#BF2600', fg: '#FFFFFF',
                        tooltipTitle: data.productVersion + ' reached End of Software Life',
                        info: 'EOSL since ' + life.eol + '. Liferay Support no longer provides services for this version - advise upgrading to a version in Premium Support.'
                    };
                } else if (today >= life.eops) {
                    phase = {
                        label: 'LIMITED SUPPORT', bg: '#946F00', fg: '#FFFFFF',
                        tooltipTitle: data.productVersion + ' is in the Limited Support phase',
                        info: 'Premium Support ended ' + life.eops + '; EOSL ' + life.eol + '. Product guidance, existing documentation and existing fixes only - no new backports. Critical-severity security fixes only.'
                    };
                }

                if (phase && !epsCovers) {
                    const notes = [phase.info];
                    if (life.until) notes.push('Internal only: supported until ' + life.until + ' - do not mention this extension to the customer.');
                    if (life.note) notes.push(life.note);
                    badges.push({
                        ...phase,
                        info: notes.join(' '),
                        links: [{ text: 'EOSL Guide For Support', url: 'https://liferay.atlassian.net/wiki/spaces/SUPPORT/pages/1998783040/EOSL+Guide+For+Support' }]
                    });
                }
            }
        }

        /* --- 4. Heat Score (displayed as-is, no banding) --- */
        if (BADGE_GROUPS.heat && data.heatScore !== null) {
            badges.push({
                label: 'HEAT ' + Math.round(data.heatScore),
                outline: true, bg: 'transparent', fg: HEAT_SCORE_COLOR, borderColor: HEAT_SCORE_COLOR,
                tooltipTitle: 'Heat Score ' + Math.round(data.heatScore),
                info: 'Composite escalation-risk score' + (data.heatTag ? '. Heat Tag: ' + data.heatTag : '') + '.'
            });
        }

        /* --- 5. Foreign region --- */
        if (BADGE_GROUPS.region && data.customerRegion && data.agentRegion) {
            const norm = s => s.trim().toLowerCase();
            if (norm(data.customerRegion) !== norm(data.agentRegion)) {
                const key = norm(data.customerRegion);
                // Fall back to the first two letters for the few malformed free-text values.
                const code = REGION_CODES[key] || data.customerRegion.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
                badges.push({
                    label: 'FOREIGN REGION: ' + code,
                    outline: true, bg: 'transparent', fg: '#0065FF', borderColor: '#0065FF',
                    tooltipTitle: 'Customer region differs from yours',
                    info: 'Customer: ' + data.customerRegion + '. Agent: ' + data.agentRegion + '. Mind the timezone gap and local business hours.'
                });
            }
        }

        /* --- 6. Warnings --- */
        if (BADGE_GROUPS.warnings && tokens.length && !lower.includes('active subscription')) {
            badges.push({
                label: '⚠ SUBSCRIPTION INACTIVE',
                bg: '#DE350B', fg: '#FFFFFF',
                tooltipTitle: 'No active subscription',
                info: '"Active Subscription" is missing from this account\'s entitlements. Verify entitlement before providing support.'
            });
        }

        return badges;
    }

    /*
      One shared tooltip node, positioned on hover. Kept on document.body rather
      than inside the badge bar so no ancestor's overflow can clip it.

      It is hoverable (pointer-events: auto) because tier tooltips contain
      documentation links the CSE needs to click, so a short close delay lets the
      pointer travel from badge to tooltip without it vanishing.
    */
    let badgeTooltipHideTimer = null;

    function getBadgeTooltip() {
        let tip = document.getElementById(BADGE_TOOLTIP_ID);
        if (tip) return tip;

        tip = document.createElement('div');
        tip.id = BADGE_TOOLTIP_ID;
        tip.style.cssText = `
            position: fixed;
            z-index: 10001;
            max-width: 420px;
            max-height: min(72vh, 560px);
            overflow-y: auto;
            overscroll-behavior: contain;
            padding: 10px 12px;
            border-radius: 4px;
            background: #172B4D;
            color: #FFFFFF;
            font-size: 12px;
            line-height: 1.45;
            box-shadow: 0 4px 12px rgba(9, 30, 66, 0.35);
            opacity: 0;
            transition: opacity 0.12s ease-in-out;
            display: none;
        `;
        tip.addEventListener('mouseenter', () => clearTimeout(badgeTooltipHideTimer));
        tip.addEventListener('mouseleave', hideBadgeTooltip);
        document.body.appendChild(tip);
        return tip;
    }

    // A link, styled for the dark tooltip background.
    function buildTooltipLink(link, display) {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.text;
        a.style.cssText = `display: ${display}; color: #85B8FF; text-decoration: underline; margin: 2px 0;`;
        return a;
    }

    /*
      A labelled bullet list. An item is either a plain string or
      { text, sub: [...], links: [...] }.

      A `sub` list of three or more entries gets a click-to-collapse toggle, so a
      dense tooltip (Strategic 24/7 carries six security benefits) can be shortened
      in place. Everything starts expanded - nothing is hidden by default.
    */
    function appendTooltipList(tip, heading, items, color) {
        if (!items || !items.length) return;

        const head = document.createElement('div');
        head.textContent = heading;
        head.style.cssText = `margin-top: 8px; font-weight: 600; color: ${color};`;
        tip.appendChild(head);

        const ul = document.createElement('ul');
        ul.style.cssText = 'margin: 2px 0 0 0; padding-left: 16px;';

        items.forEach(item => {
            const li = document.createElement('li');
            li.style.cssText = 'margin: 2px 0; opacity: 0.9;';

            if (typeof item === 'string') {
                li.textContent = item;
                ul.appendChild(li);
                return;
            }

            li.textContent = item.text;

            if (item.sub && item.sub.length) {
                const subUl = document.createElement('ul');
                subUl.style.cssText = 'margin: 2px 0 0 0; padding-left: 16px; opacity: 0.92;';
                item.sub.forEach(s => {
                    const subLi = document.createElement('li');
                    subLi.textContent = s;
                    subLi.style.margin = '1px 0';
                    subUl.appendChild(subLi);
                });

                if (item.sub.length >= 3) {
                    const toggle = document.createElement('span');
                    toggle.textContent = ' [hide]';
                    toggle.style.cssText = 'cursor: pointer; color: #85B8FF; font-size: 11px;';
                    toggle.addEventListener('click', e => {
                        e.stopPropagation();
                        subUl.hidden = !subUl.hidden;
                        toggle.textContent = subUl.hidden ? ` [show ${item.sub.length}]` : ' [hide]';
                    });
                    li.appendChild(toggle);
                }

                li.appendChild(subUl);
            }

            (item.links || []).forEach(link => li.appendChild(buildTooltipLink(link, 'block')));
            ul.appendChild(li);
        });

        tip.appendChild(ul);
    }

    function showBadgeTooltip(badgeEl, badge) {
        clearTimeout(badgeTooltipHideTimer);
        const tip = getBadgeTooltip();
        tip.innerHTML = '';

        const title = document.createElement('div');
        title.textContent = badge.tooltipTitle || badge.label;
        title.style.cssText = 'font-weight: 600; margin-bottom: 2px;';
        tip.appendChild(title);

        // The tier lead-in sentence, where the AC defines one.
        if (badge.lead) {
            const lead = document.createElement('div');
            lead.textContent = badge.lead;
            lead.style.cssText = 'opacity: 0.9; margin-top: 2px;';
            tip.appendChild(lead);
        }

        if (badge.info) {
            const body = document.createElement('div');
            body.textContent = badge.info;
            body.style.cssText = 'opacity: 0.85;';
            tip.appendChild(body);
        }

        appendTooltipList(tip, 'Includes', badge.includes, '#79F2C0');
        appendTooltipList(tip, 'Key exclusions', badge.excludes, '#FF9C8F');

        if (badge.links && badge.links.length) {
            const linkWrap = document.createElement('div');
            linkWrap.style.cssText = 'margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2);';
            badge.links.forEach(link => linkWrap.appendChild(buildTooltipLink(link, 'block')));
            tip.appendChild(linkWrap);
        }

        tip.style.display = 'block';
        tip.style.opacity = '0';
        tip.scrollTop = 0; // A previous, longer tooltip may have been scrolled.

        // Measure, then clamp inside the viewport.
        const rect = badgeEl.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 6;

        if (left + tipRect.width > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - tipRect.width - 8);
        }
        if (top + tipRect.height > window.innerHeight - 8) {
            top = Math.max(8, rect.top - tipRect.height - 6);
        }

        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
        tip.style.opacity = '1';
    }

    function scheduleHideBadgeTooltip() {
        clearTimeout(badgeTooltipHideTimer);
        badgeTooltipHideTimer = setTimeout(hideBadgeTooltip, 180);
    }

    function hideBadgeTooltip() {
        clearTimeout(badgeTooltipHideTimer);
        const tip = document.getElementById(BADGE_TOOLTIP_ID);
        if (!tip) return;
        tip.style.opacity = '0';
        tip.style.display = 'none';
    }

    function renderBadgeBar(anchor, issueKey, badges) {
        // A signature lets us skip the DOM write when nothing changed - important
        // because the global MutationObserver re-runs updateUI constantly.
        const signature = issueKey + '|' + badges.map(b => b.label).join('|');

        let bar = document.getElementById(BADGE_BAR_ID);
        if (bar && bar.dataset.signature === signature && bar.isConnected) {
            // Jira may have re-rendered the heading and orphaned the bar; re-seat it.
            if (bar.previousElementSibling !== anchor) {
                anchor.parentNode.insertBefore(bar, anchor.nextSibling);
            }
            return;
        }

        if (!bar) {
            bar = document.createElement('div');
            bar.id = BADGE_BAR_ID;
        }
        bar.dataset.signature = signature;
        bar.innerHTML = '';
        bar.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            align-items: center;
            margin: 8px 0 4px 0;
        `;

        badges.forEach(badge => {
            const el = document.createElement('span');
            el.className = 'userscript-entitlement-badge';
            el.textContent = badge.label;
            /*
              Two visual styles on purpose: solid pills are account entitlements
              (tier, offering, add-ons), outlined pills are ticket-state markers
              (heat, foreign region). Keeps the two kinds of information apart
              without needing yet more distinct hues.
            */
            el.style.cssText = `
                display: inline-flex;
                align-items: center;
                border-radius: 4px;
                background: ${badge.bg};
                color: ${badge.fg};
                border: ${badge.outline ? `1.5px solid ${badge.borderColor}` : 'none'};
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.4px;
                white-space: nowrap;
                cursor: default;
                box-sizing: border-box;
            `;
            /*
              Padding, line-height and min-height are set with `important` rather
              than through cssText above: Jira ships `!important` rules that match
              bare spans in the issue header, which otherwise flatten the pill and
              push the text against the border. The outline variant subtracts its
              1.5px border so both variants end up the same outer size.
            */
            el.style.setProperty('padding', badge.outline ? '5px 12px' : '6px 13px', 'important');
            el.style.setProperty('line-height', '1.45', 'important');
            el.style.setProperty('min-height', '24px', 'important');
            el.style.setProperty('height', 'auto', 'important');
            /*
              Deliberately NOT a `title` attribute. applyColors() above selects
              `span[title]` to catch status lozenges, and these markers are spans -
              a title here makes them match, and applyColors then overwrites the
              padding with `3px 0px 3px 4px`, pushing the text flat against the
              right border. aria-label carries the same text for screen readers
              without colliding with that selector.
            */
            const detail = badge.lead || badge.info;
            el.setAttribute('aria-label', detail
                ? `${badge.tooltipTitle || badge.label} - ${detail}`
                : (badge.tooltipTitle || badge.label));
            el.addEventListener('mouseenter', () => showBadgeTooltip(el, badge));
            el.addEventListener('mouseleave', scheduleHideBadgeTooltip);
            bar.appendChild(el);
        });

        if (bar.previousElementSibling !== anchor || !bar.isConnected) {
            anchor.parentNode.insertBefore(bar, anchor.nextSibling);
        }
    }

    /*
      Find the node to insert after: the ticket summary heading, climbing out of
      any wrapper that contains nothing but the heading, so the badges land
      between the title block and Key Details rather than inside the title row.
    */
    function resolveBadgeBarAnchor() {
        for (const selector of SUMMARY_HEADING_SELECTORS) {
            const heading = document.querySelector(selector);
            if (!heading) continue;

            let node = heading;
            while (node.parentElement
                && node.parentElement !== document.body
                && node.parentElement.childElementCount === 1) {
                node = node.parentElement;
            }
            return node.parentElement ? node : null;
        }
        return null;
    }

    async function createEntitlementBadgeBar() {
        const ticketType = getTicketType();
        if (!['LRHC', 'LRFLS'].includes(ticketType)) {
            document.getElementById(BADGE_BAR_ID)?.remove();
            return;
        }

        const issueKey = getIssueKey();
        if (!issueKey) return;

        const anchor = resolveBadgeBarAnchor();
        if (!anchor) return;

        const data = await fetchEntitlementData(issueKey);
        if (!data) return;

        // Guard against a slow fetch resolving after the user navigated away.
        if (getIssueKey() !== issueKey) return;

        const badges = buildBadges(data);
        if (!badges.length) {
            document.getElementById(BADGE_BAR_ID)?.remove();
            return;
        }

        const liveAnchor = resolveBadgeBarAnchor();
        if (!liveAnchor) return;

        renderBadgeBar(liveAnchor, issueKey, badges);
    }

    /*********** NEW FEATURE: HIGH PRIORITY FLAME ICON ***********/
    function addFlameIconToHighPriority() {
        // Selector for the specific High Priority image URLs
        const highPrioritySelectors = [
             //'img[src*="high_new.svg"]', // Matches the high tickets
            'img[src*="critical.svg"]', // Matches the high tickets
            'img[src*="avatar/10635"]'  // Matches the critical tickets
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
    /*********** https://liferay.atlassian.net/browse/LRSUPPORT-47251 ***********/
   function expandCCCInfo() {
        // 1. Define the headers we want to target
        const targetHeaders = [
            "CCC Account Info",
            "CCC Infrastructure Info",
            "CCC SaaS Maintenance Info"
        ];

        // 2. Find all card headers (class 'css-x0ppza' seems to be the most accurate way currently, April '26)
        // and all Object Cards on the page
        const allCardHeaders = Array.from(document.querySelectorAll('.css-x0ppza'));
        const allCards = document.querySelectorAll('[data-testid="issue-field-cmdb-object-lazy.ui.card.cmdb-object-card"]');

        // 3. Iterate through every card found
        allCards.forEach(card => {

            // Find the header that this card belongs to.
            // We do this by filtering headers that appear BEFORE this specific card,
            // and taking the last one (the nearest one).
            const precedingHeaders = allCardHeaders.filter(h =>
                (h.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)
            );

            const nearestHeader = precedingHeaders.length > 0 ? precedingHeaders[precedingHeaders.length - 1] : null;

            if (nearestHeader) {

                const headerText = nearestHeader.textContent.trim();

                // 4. Check if the nearest header is one of our targets
                const matchesTarget = targetHeaders.some(target => headerText.startsWith(target));

                if (matchesTarget) {
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
        GM_registerMenuCommand(
            `Set up Custom Menu/Notes`,
            () => openCustomMenuConfigPopup()
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

    /*********** CUSTOM MENU ***********/
    function openCustomMenuConfigPopup() {
        if (document.querySelector(".jsm-custommenu-settings-popup")) return;
        const popup = document.createElement("div");
        popup.className = "jsm-custommenu-settings-popup";
        popup.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;background:#222;padding:1rem;border-radius:8px;z-index:10000;box-shadow:0 0 15px rgba(0,0,0,0.6);";
        const help = document.createElement("div");
        help.textContent = "Enter menu/button title and html content. Changes are saved automatically (page reload is required).";
        help.style.cssText = "margin-bottom:10px;font-size:12px;color:#aaa;";
        // Name
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Menu Name";
        input.value = GM_getValue("customMenuName", "");
        input.style.cssText = "width:100%;margin-bottom:8px;padding-top:4px;padding-bottom:4px;border-radius:4px;border:1px solid #444;background:#111;color:#0f0;";
        input.addEventListener("input", () => GM_setValue("customMenuName", input.value));
        // HTML
        const textarea = document.createElement("textarea");
        textarea.placeholder = "Paste any HTML";
        textarea.value = GM_getValue("customMenuHtml", "");
        textarea.style.cssText = "min-width:300px;width:100%;height:240px;border-radius:4px;border:1px solid #444;background:#111;color:#0f0;resize:vertical;margin-bottom:8px;";
        textarea.addEventListener("input", () => GM_setValue("customMenuHtml", textarea.value));
        // Enable Notes
        const checkboxWrapper = document.createElement("label");
        checkboxWrapper.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:8px;color:#fff;font-family:sans-serif;cursor:pointer;";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = GM_getValue("customMenuEnableNotes", false);
        checkbox.addEventListener("change", () => {GM_setValue("customMenuEnableNotes", checkbox.checked);});
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(document.createTextNode("Enable NOTES"));
        //Close Button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.marginTop = "10px";
        closeButton.onclick = () => {popup.remove();};
        // Create menu
        popup.appendChild(help);
        popup.appendChild(input);
        popup.appendChild(textarea);
        popup.appendChild(checkboxWrapper);
        popup.appendChild(closeButton);
        document.body.appendChild(popup);
    }

    function addCustomHeaderMenu() {
        const name = GM_getValue("customMenuName", "");
        const html = GM_getValue("customMenuHtml", "");
        const enableNotes = GM_getValue("customMenuEnableNotes", "");
        if (!(name && (html || enableNotes))) return;
        const header = document.querySelector("header div");
        if (!header || header.querySelector(".jsm-custommenu-header-btn")) return;
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.className = "jsm-custommenu-header-btn";
        btn.style.cssText = "margin-left:8px;padding:4px 8px;border-radius:4px;cursor:pointer;";
        const menu = document.createElement("div");
        menu.innerHTML = html;
        menu.style.cssText = "display:none;position:absolute;background:#fff;border:1px solid #ccc;padding: 8px;border-radius:6px;box-shadow:0 4px 8px rgba(0,0,0,0.1);z-index:10000;";
        document.body.appendChild(menu);
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const rect = btn.getBoundingClientRect();
            menu.style.left = rect.left + window.scrollX + "px";
            menu.style.top = rect.bottom + window.scrollY + "px";
            menu.style.display = menu.style.display === "block" ? "none" : "block";
        });
        document.addEventListener("click", () => menu.style.display = "none");
        menu.addEventListener("click", e => e.stopPropagation());

        if (enableNotes) {
            const notesLabel = document.createElement("label");
            notesLabel.textContent = "Notes";
            notesLabel.htmlFor = "jsm-custommenu-notes";
            const notesTextarea = document.createElement("textarea");
            notesTextarea.id = "jsm-custommenu-notes";
            notesTextarea.value = GM_getValue("customMenuNotes", "");
            notesTextarea.style.cssText = "min-height:150px;min-width:95%;resize:both;";
            notesTextarea.addEventListener("input", () => {GM_setValue("customMenuNotes", notesTextarea.value);});
            if (html) menu.appendChild(document.createElement("hr"));
            menu.appendChild(notesLabel);
            menu.appendChild(notesTextarea);
        }
        header.appendChild(btn);
    }

    /**
    * Creates and inserts a new custom panel link field.
    *
    * @param {Object} config - Configuration object used to create the custom panel field.
    * @param {Object} config.newField - Defines the visual properties of the new field.
    * @param {string} config.newField.heading - The display heading of the field. Ex: `'Example Link'`
    * @param {string} config.newField.class - The CSS class applied to the field. Ex: `'example-link-field'`
    * @param {Function} config.callbackFn - Async callback executed to generate the link.
    * @param {string} [options.afterFieldClass=null] - Optional. The CSS class of the field below which the new element should be placed. If omitted, it defaults to the "Assignee" field.
    *   Must resolve to an object with the following shape:
    *   `{ url: string, name: string }`
    *   Ex: `{ url: "https://www.liferay.com/", name: "Link" }`
    *
    * @returns {void}
    */
    async function createPanelFieldLink({ newField, callbackFn, afterFieldClass = null }) {
        // Determine the target selector: use the provided class or default to Jira's "Assignee" field selector
        const targetSelector = afterFieldClass
            ? `.${afterFieldClass}`
            : '[data-testid="issue.issue-view-layout.issue-view-assignee-field.assignee"]';

        const originalField = document.querySelector(targetSelector);
        if (!originalField || document.querySelector(`.${newField.class}`)) return;

        // --- UI Setup ---
        const clone = originalField.cloneNode(true);

        // Remove duplicated "Assign to Me"
        clone.querySelector('[data-testid="issue-view-layout-assignee-field.ui.assign-to-me"]')?.remove();
        clone.classList.add(newField.class);

        // Update field heading
        const span = clone.querySelector('span');
        if (span) span.textContent = newField.heading;

        // Get content container
        const contentContainer = clone.querySelector('[data-testid="issue-field-inline-edit-read-view-container.ui.container"]');
        if (contentContainer) contentContainer.innerHTML = '';

        // Placeholder while fetching
        const statusText = document.createElement('span');
        statusText.textContent = 'Loading Link...';
        statusText.style.color = '#FFA500'; // Orange for loading
        contentContainer?.appendChild(statusText);

        // Insert the cloned field *before* fetching to provide immediate feedback
        await originalField.parentNode.insertBefore(clone, originalField.nextSibling);

        // --- Data Fetch and Link Creation ---
        try {
            const { url, name } = await callbackFn()

            if (url && name) {
                contentContainer.innerHTML = ''; // Clear loading text
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.textContent = name;
                link.style.cssText = 'display: block; margin-top: 5px; text-decoration: underline;';
                contentContainer.appendChild(link);
            } else {
                statusText.textContent = 'Link Not Found (Missing Key)';
                statusText.style.color = '#DC143C'; // Red for error
            }
        } catch (error) {
            contentContainer.innerHTML = '';
            const errorText = document.createElement('span');
            errorText.textContent = `Error: ${error.message}`;
            errorText.style.color = '#DC143C';
            contentContainer.appendChild(errorText);
        }
    }

    function createProvisioningPortalFields({ afterFieldClass = null }) {
        const issueKey = getIssueKey();
        if (!issueKey) return;

        const callbackFn = async () => {
            const externalKey = await fetchCustomerPortalData(issueKey);
            const url = externalKey ? `https://provisioning.liferay.com/group/guest/~/control_panel/manage?p_p_id=com_liferay_osb_provisioning_web_portlet_AccountsPortlet&p_p_lifecycle=0&p_p_state=maximized&p_p_mode=view&_com_liferay_osb_provisioning_web_portlet_AccountsPortlet_mvcRenderCommandName=%2Faccounts%2Fview_account&_com_liferay_osb_provisioning_web_portlet_AccountsPortlet_accountKey=${externalKey}` : null
            return { url, name: externalKey };
        }
        const newField = { heading: 'Raysource', class: 'raysource-link-field' }

        createPanelFieldLink({ newField, callbackFn, afterFieldClass })
    }

    /**
     * Initializes and renders custom fields within the Jira issue side panel if the ticket matches
     * allowed types ('LRHC' or 'LRFLS')
     *
     * @returns {void}
     */
    function createCustomSidePanelFields() {
        const ticketType = getTicketType();
        if (!['LRHC', 'LRFLS'].includes(ticketType)) return; // Only run for allowed types

        createCustomerPortalField({});
        createProvisioningPortalFields({ afterFieldClass: 'customer-portal-link-field' });
        createPatcherField({ afterFieldClass: 'raysource-link-field' });
        createJiraFilterLinkField({ afterFieldClass: 'patcher-link-field' });
    }


    /*********** INITIAL RUN + OBSERVERS ***********/
    async function updateUI() {
        applyColors();
        createCustomSidePanelFields();
        highlightEditor();
        checkInternalRequestWarning();
       // removeSignatureFromInternalNote();
        addFlameIconToHighPriority();
        expandCCCInfo();
        addColorToProposedSolution();
        await createPartnerIconField();
        await createEntitlementBadgeBar();
        await detectSupportAttachments();
        addCustomHeaderMenu();
    }
        function watchStatusButton() {
        // Re-color instantly on click, before the dropdown/re-render even settles
        document.addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('[data-testid$="status-button.status-button"]');
            if (btn) requestAnimationFrame(applyColors);
        }, true);

        // Also catch the moment Jira flips aria-expanded (covers keyboard-triggered opens too)
        const statusObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'aria-expanded') {
                    applyColors();
                    return;
                }
            }
        });

        // Observe the whole body for aria-expanded changes on any status button
        statusObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['aria-expanded'],
            subtree: true
        });
    }

    await updateUI();
    registerMenu();
    disableShortcuts();
    backgroundTabLinks();
    watchStatusButton();

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

    const throttledUpdateUI = createThrottler(() => updateUI(), 150);
    const observer = new MutationObserver(throttledUpdateUI);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

})();
