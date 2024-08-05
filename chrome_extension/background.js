// background.js

// Create context menu items
chrome.runtime.onInstalled.addListener(function() {
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
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "labelElement") {
        chrome.tabs.sendMessage(tab.id, {action: "labelElement"});
    } else if (info.menuItemId === "showLabels") {
        chrome.tabs.sendMessage(tab.id, {action: "showLabels"});
    }
});

// Only show context menu items when Ctrl is pressed
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "ctrlCheck") {
        port.onMessage.addListener(function(msg) {
            chrome.contextMenus.update("labelElement", {visible: msg.ctrlPressed});
            chrome.contextMenus.update("showLabels", {visible: msg.ctrlPressed});
        });
    }
});
