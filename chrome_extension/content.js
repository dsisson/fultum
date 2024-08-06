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

    // log('Highlighting element', element);
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
 * Show an overlay with all labeled functional areas
 */
const showLabels = () => {
    log('Showing all labels');
    let labelsHTML = `<h2>Functional Areas for ${state.pageName || 'this page'}:</h2>`;

    if (state.functionalAreas.length > 0) {
        labelsHTML += '<ul>' + state.functionalAreas.map(area => `<li>${area}</li>`).join('') + '</ul>';
    } else {
        labelsHTML += '<p>No functional areas have been labeled yet.</p>';
    }

    const overlay = document.createElement('div');
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
 * Label the currently highlighted element
 */
const labelElement = () => {
    if (state.lastHighlightedElement) {
        log('Attempting to label element', state.lastHighlightedElement);

        const label = prompt('Enter a label for this functional area:');
        if (label) {
            state.functionalAreas.push(label);
            log('New functional area added', label);
            saveToStorage();
        } else {
            log('Labeling cancelled');
        }
    } else {
        log('No element selected for labeling');
    }
};

/**
 * Save current state to storage
 */
const saveToStorage = () => {
    const dataToSave = {
        [document.location.href]: {
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
    chrome.storage.local.get(document.location.href, (data) => {
        if (chrome.runtime.lastError) {
            log('Error loading data', chrome.runtime.lastError);
        } else if (data[document.location.href]) {
            state.pageName = data[document.location.href].pageName || '';
            state.functionalAreas = Array.isArray(data[document.location.href].functionalAreas)
                ? data[document.location.href].functionalAreas
                : [];
            log('Data loaded from storage', data[document.location.href]);
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

// Initialization
log('Loading data on script injection');
loadFromStorage();
log('Content script setup complete');
