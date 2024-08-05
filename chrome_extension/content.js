// content.js

let lastHighlightedElement = null;

// Highlight element on mouseover
document.addEventListener('mouseover', function (event) {
    if (lastHighlightedElement) {
        lastHighlightedElement.style.outline = '';
    }
    event.target.style.outline = '2px solid yellow';
    lastHighlightedElement = event.target;
});

// Remove highlight on mouseout
document.addEventListener('mouseout', function (event) {
    if (event.target === lastHighlightedElement) {
        event.target.style.outline = '';
        lastHighlightedElement = null;
    }
});

// Handle messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'labelElement') {
        labelElement();
    } else if (request.action === 'showLabels') {
        showLabels();
    }
});

// Function to label the last highlighted element
function labelElement() {
    if (lastHighlightedElement) {
        const label = prompt('Enter a label for this element:');
        if (label) {
            const elementInfo = {
                tagName: lastHighlightedElement.tagName,
                id: lastHighlightedElement.id,
                classes: Array.from(lastHighlightedElement.classList).join(' ')
            };
            // Save label to storage
            chrome.storage.local.set({
                [`${document.location.href}_${JSON.stringify(elementInfo)}`]: label
            }, function() {
                console.log('Label saved');
            });
        }
    } else {
        console.log('No element selected for labeling');
    }
}

// Function to display all labels for the current page
function showLabels() {
    chrome.storage.local.get(null, function(items) {
        const currentPageLabels = Object.entries(items).filter(([key]) =>
            key.startsWith(document.location.href)
        );

        let labelsHTML = '<h2>Labels for this page:</h2><ul>';
        currentPageLabels.forEach(([key, label]) => {
            const elementInfo = JSON.parse(key.split('_')[1]);
            labelsHTML += `<li>${elementInfo.tagName} (${elementInfo.id || elementInfo.classes || 'no id/class'}): ${label}</li>`;
        });
        labelsHTML += '</ul>';

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 10px; right: 10px; 
            background: white; border: 1px solid black; 
            padding: 10px; z-index: 9999; max-height: 80%; 
            overflow-y: auto;
        `;
        overlay.innerHTML = labelsHTML + '<button id="closeLabels">Close</button>';
        document.body.appendChild(overlay);

        document.getElementById('closeLabels').onclick = function() {
            overlay.remove();
        };
    });
}
