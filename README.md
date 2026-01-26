# Jira for CSEs – Userscript

**Version:** 3.15
**Author:** Allison McGill, Rita Schaff, Daniel Martínez Cisneros

---

## Overview

This userscript adds quality of life updates to Jira interface for Customer Support Engineers (CSEs) by:

1. Adding Status Colors for easier readability.  
2. Inserting a link to Patcher portal, Customer portal and link to tickets in the ticket details.  
3. Highlighting the editor when writing internal notes for quick visual distinction.
4. Inserting a Link to Customer Portal in the ticket details.
5. Optional Features controlled by Toggles (via the user script menu).
6. Colorize solution proposed section.
7. **Displaying a warning top bar for Internal Requests.**

---

## Features

### 1. Status Colors
- Different statuses now have different color backgrounds. 
<img width="624" height="1050" alt="image" src="https://github.com/user-attachments/assets/beaa9362-9e09-4392-b8dd-44a5b911c0f7" />


### 2. Patcher Link Field
- Automatically adds a Patcher portal link in the details field.  
<img width="578" height="299" alt="image" src="https://github.com/user-attachments/assets/b981c349-0f10-4783-b36a-9863d6a2e184" />

### 3. Internal Note Highlight
- Highlights the editor yellow when writing internal notes.
<img width="1023" height="319" alt="image" src="https://github.com/user-attachments/assets/e71499ec-f1cd-476d-ba06-19a1b1b95bc6" />

### 4. Customer Portal Link
- Automatically adds a Customer portal link in the details field. 
<img width="583" height="99" alt="image" src="https://github.com/user-attachments/assets/1b2d8d10-e8f0-4900-b48c-fd3631f196ab" />


### 5. Account tickets Link
- Automatically adds a link to tickets for the account in the details field. 
<img width="647" height="595" alt="image" src="https://github.com/user-attachments/assets/945e1560-8ee0-439d-82d3-601dfa838f9a" />

### 6. Account notes in description
- Automatically adds internal notes in the details field. 
<img width="546" height="797" alt="image" src="https://github.com/user-attachments/assets/d004ded0-3abd-4c6f-ad72-6fca5693da64" />


### 7. Colorize solution proposed
- Automatically add color to solution proposed section. 
<img width="1399" height="603" alt="image" src="https://github.com/user-attachments/assets/8d947745-9a4b-4f7f-86ff-376cd066d9b2" />

### 8. Internal Request Warning
- Displays a yellow warning bar at the top of the screen if the ticket is an **Internal Request**.
- Reminds the agent that manually changing the request type will not publish the ticket and provides a link to the correct automation procedure.

---

## Optional Features can be toggled on or off using the userscript menu accessible via your userscript manager
- **Disable Jira Shortcuts**: Prevents Jira’s keyboard shortcuts from triggering while typing.  
- **Open Tickets in Background Tab**: Opens Jira issue links in a new browser tab without navigating away from your current tab.

<img width="825" height="765" alt="image" src="https://github.com/user-attachments/assets/bad62af9-6162-4a59-bbce-e7ab9c5db630" />

---

## Installation

1. Install a userscript manager like TamperMonkey:
- chrome: https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en
- firefox: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/
2. Create a new userscript and paste the code from `Jira for CSEs.user.js`.  
3. Save and reload Jira pages.