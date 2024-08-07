// State management
const state = {
    lastHighlightedElement: null,
    pageName: '',
    functionalAreas: [],
    isCtrlPressed: false
};

// Utility functions
/**
 * Log a message with an optional data object
 * @param {string} message - The message to log
 * @param {any} [data] - Optional data to log
 */
const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${message}`, data || '');
};

// UI functions
/**
 * Highlight the given element
 * @param {HTMLElement} element - The element to highlight
 */
const highlightElement = (element) => {
    if (!state.isCtrlPressed) return;

    // Check if the element or its ancestors have the class 'extension-ui'
    if (element.closest('.extension-ui')) return;

    if (state.lastHighlightedElement) {
        state.lastHighlightedElement.style.outline = '';
    }
    element.style.outline = '2px solid yellow';
    state.lastHighlightedElement = element;
};

/**
 * Remove highlight from the given element
 * @param {HTMLElement} element - The element to remove highlight from
 */
const removeHighlight = (element) => {
    if (!state.isCtrlPressed) return;

    if (element === state.lastHighlightedElement) {
        element.style.outline = '';
        state.lastHighlightedElement = null;
        // log('Highlight removed from element', element);
    }
};

/**
 * Create HTML content for labeling functional areas and sub-functional areas
 * @returns {string} The HTML content for the form, including inline JavaScript
 */
const createLabelForm = () => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Label Functional Area</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                input, textarea { width: 100%; margin-bottom: 10px; }
                button { margin-right: 10px; }
            </style>
        </head>
        <body>
            <h3>Label Functional Area</h3>
            <label for="faLabel">Functional Area Label:</label><br>
            <input type="text" id="faLabel" required><br><br>
            <label for="subFAList">Sub-Functional Areas (comma or new line separated):</label><br>
            <textarea id="subFAList" rows="4"></textarea><br><br>
            <button id="submitLabel">Submit</button>
            <button id="cancelLabel">Cancel</button>
            <script>
                console.log('Form script is running');

                // Handle submit button click
                document.getElementById('submitLabel').onclick = () => {
                    console.log('Submit button clicked');
                    const faLabel = document.getElementById('faLabel').value.trim();
                    const subFAList = document.getElementById('subFAList').value;
                    if (faLabel) {
                        const subAreas = subFAList.split(/[,\\n]/).map(item => item.trim()).filter(Boolean);
                        console.log('Submitting label:', { faLabel, subAreas });
                        window.opener.postMessage({
                            action: 'submitLabel',
                            data: { faLabel, subAreas }
                        }, '*');
                        window.close();
                    } else {
                        console.log('No label entered');
                        alert('Please enter a Functional Area label.');
                    }
                };

                // Handle cancel button click
                document.getElementById('cancelLabel').onclick = () => {
                    console.log('Cancel button clicked');
                    window.close();
                };

                // Set focus to the FA input field when the window opens
                document.getElementById('faLabel').focus();
                console.log('Focus set to faLabel');
            </script>
        </body>
        </html>
    `;
};

/**
 * Show an overlay with all labeled FA and sub-FA areas
 */
const showLabels = () => {
    log('Showing all labels');
    let labelsHTML = `<h2>Functional Areas for ${state.pageName || 'this page'}:</h2>`;

    if (state.functionalAreas.length > 0) {
        labelsHTML += '<ul>' + state.functionalAreas.map(area => `
            <li>${area.label}
                ${area.subAreas.length > 0 ? `
                    <ul>${area.subAreas.map(subArea => `<li>${subArea}</li>`).join('')}</ul>
                ` : ''}
            </li>
        `).join('') + '</ul>';
    } else {
        labelsHTML += '<p>No functional areas have been labeled yet.</p>';
    }

    const overlay = document.createElement('div');
    overlay.className = 'extension-ui';
    overlay.style.cssText = `
        position: fixed; top: 10px; right: 10px; 
        background: white; border: 1px solid black; 
        padding: 10px; z-index: 9999; max-height: 80%; 
        overflow-y: auto;
    `;
    overlay.innerHTML = labelsHTML + '<button id="closeLabels">Close</button>';
    document.body.appendChild(overlay);

    document.getElementById('closeLabels').onclick = () => {
        overlay.remove();
        log('Labels overlay closed');
    };
};

// Data management functions
/**
 * Prompt user for page name
 */
const promptForPageName = () => {
    if (!state.pageName) {
        state.pageName = prompt('Enter a name for this page:');
        if (state.pageName) {
            log('Page name set', state.pageName);
            saveToStorage();
        } else {
            log('Page name prompt cancelled');
        }
    }
};

/**
 * Label the currently highlighted element by opening a new window with a form
 */
const labelElement = () => {
    if (state.lastHighlightedElement) {
        log('Attempting to label element', state.lastHighlightedElement);

        chrome.runtime.sendMessage({
            action: 'openLabelForm'
        }, (response) => {
            if (chrome.runtime.lastError) {
                log('Error opening label form', chrome.runtime.lastError);
            } else {
                log('Label form window opened', response);
            }
        });
    } else {
        log('No element selected for labeling');
    }
};

/**
 * Save current state to storage
 */
const saveToStorage = () => {
    const dataToSave = {
        [`v2_${document.location.href}`]: {
            pageName: state.pageName,
            functionalAreas: state.functionalAreas
        }
    };
    log('Saving data to storage', dataToSave);
    chrome.storage.local.set(dataToSave, () => {
        if (chrome.runtime.lastError) {
            log('Error saving data', chrome.runtime.lastError);
        } else {
            log('Data saved successfully');
        }
    });
};

/**
 * Load data from storage
 */
const loadFromStorage = () => {
    log('Attempting to load data from storage');
    chrome.storage.local.get(`v2_${document.location.href}`, (data) => {
        if (chrome.runtime.lastError) {
            log('Error loading data', chrome.runtime.lastError);
        } else if (data[`v2_${document.location.href}`]) {
            state.pageName = data[`v2_${document.location.href}`].pageName || '';
            state.functionalAreas = Array.isArray(data[`v2_${document.location.href}`].functionalAreas)
                ? data[`v2_${document.location.href}`].functionalAreas
                : [];
            log('Data loaded from storage', data[`v2_${document.location.href}`]);
        } else {
            log('No data found for current URL');
            state.pageName = '';
            state.functionalAreas = [];
        }
    });
};

// Event listeners
document.addEventListener('mouseover', (event) => highlightElement(event.target));
document.addEventListener('mouseout', (event) => removeHighlight(event.target));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Control') {
        state.isCtrlPressed = true;
        log('Control key pressed');
    }
});
document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
        state.isCtrlPressed = false;
        log('Control key released');
        if (state.lastHighlightedElement) {
            state.lastHighlightedElement.style.outline = '';
            state.lastHighlightedElement = null;
        }
    }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log('Received message from background script', request);
    if (request.action === 'labelElement') {
        log('Label Element action received');
        if (state.isCtrlPressed && state.lastHighlightedElement) {
            log('Conditions met for labeling: Ctrl pressed and element selected');
            if (!state.pageName) {
                promptForPageName();
            }
            labelElement();
        } else {
            log('Cannot label element: Ctrl pressed:', state.isCtrlPressed, 'Last highlighted element:', state.lastHighlightedElement);
        }
    } else if (request.action === 'showLabels') {
        log('Show Labels action received');
        showLabels();
    }
});

/**
 * Handle messages from the background script
 * @param {Object} request - The message object
 * @param {Object} sender - Details about the sender of the message
 * @param {function} sendResponse - Function to send a response back to the sender
 * @returns {boolean} - True if the response is sent asynchronously
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    if (request.action === 'submitLabel') {
        const { faLabel, subAreas } = request.data;
        state.functionalAreas.push({ label: faLabel, subAreas });
        log('New functional area added', { label: faLabel, subAreas });
        saveToStorage();
        sendResponse({success: true});
        return true; // Indicates we will send a response asynchronously
    }
});

/**
 * Handle messages from the popup window
 * @param {MessageEvent} event - The message event object
 */
window.addEventListener('message', (event) => {
    if (event.data.action === 'submitLabel') {
        const { faLabel, subAreas } = event.data.data;
        state.functionalAreas.push({ label: faLabel, subAreas });
        log('New functional area added', { label: faLabel, subAreas });
        saveToStorage();
    }
});

// Initialization
log('Loading data on script injection');
loadFromStorage();
log('Content script setup complete');
