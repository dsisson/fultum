/**
 * Log a message with an optional data object
 * @param {string} message - The message to log
 * @param {any} [data] - Optional data to log
 */
const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${message}`, data || '');
};

/**
 * Create context menu items
 */
const createContextMenuItems = () => {
    chrome.contextMenus.create({
        id: "labelElement",
        title: "Label Element",
        contexts: ["all"],
    });
    chrome.contextMenus.create({
        id: "showLabels",
        title: "Show All Labels",
        contexts: ["all"],
    });
    log('Context menu items created');
};

/**
 * Handle context menu clicks
 * @param {Object} info - Information about the clicked menu item and page where the click occurred
 * @param {Object} tab - Information about the tab where the click occurred
 */
const handleContextMenuClick = (info, tab) => {
    if (info.menuItemId === "labelElement") {
        chrome.tabs.sendMessage(tab.id, {action: "labelElement"});
        log('Label Element action sent to content script', {tabId: tab.id});
    } else if (info.menuItemId === "showLabels") {
        chrome.tabs.sendMessage(tab.id, {action: "showLabels"});
        log('Show Labels action sent to content script', {tabId: tab.id});
    }
};

/**
 * Stores the ID of the window containing the label form.
 * This is used to manage the label form window.
 * @type {number|null}
 */
let labelFormWindowId = null;

/**
 * Stores the ID of the tab that initiated the label form.
 * This is used to send the label data back to the correct content script.
 * @type {number|null}
 */
let originTabId = null;

// Event Listeners
chrome.runtime.onInstalled.addListener(createContextMenuItems);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

/**
 * Handle messages from content scripts and popup
 * @param {Object} request - The message object
 * @param {Object} sender - Details about the sender of the message
 * @param {function} sendResponse - Function to send a response back to the sender
 * @returns {boolean} - True if the response is sent asynchronously
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request, 'from sender:', sender);
    if (request.action === 'openLabelForm') {
        originTabId = sender.tab.id;
        chrome.windows.create({
            url: chrome.runtime.getURL('labelForm.html'),
            type: 'popup',
            width: 400,
            height: 500
        }, (window) => {
            sendResponse({success: true, windowId: window.id});
        });
        return true; // Indicates we will send a response asynchronously
    } else if (request.action === 'submitLabel') {
        console.log('Forwarding submitLabel to content script, originTabId:', originTabId);
        chrome.tabs.sendMessage(originTabId, request, (response) => {
            console.log('Received response from content script:', response);
            sendResponse(response);
        });
        return true; // Indicates we will send a response asynchronously
    }
});

/**
 * Handle messages from the label form window
 * @param {Object} message - The message object
 * @param {Object} sender - Details about the sender of the message
 */
chrome.runtime.onMessageExternal.addListener((message, sender) => {
    if (message.type === 'FROM_PAGE') {
        if (message.action === 'submitLabel') {
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'submitLabel',
                faLabel: message.faLabel,
                subAreas: message.subAreas
            });
            chrome.windows.remove(labelFormWindowId);
        } else if (message.action === 'cancelLabel') {
            chrome.windows.remove(labelFormWindowId);
        }
    }
});

// Initialization log
log('Background script initialized');
