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

// Event Listeners
chrome.runtime.onInstalled.addListener(createContextMenuItems);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// Initialization log
log('Background script initialized');
