console.log('Form script is running');

// Handle submit button click
document.getElementById('submitLabel').onclick = () => {
    console.log('Submit button clicked');
    const faLabel = document.getElementById('faLabel').value.trim();
    const subFAList = document.getElementById('subFAList').value;
    if (faLabel) {
        const subAreas = subFAList.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
        console.log('Submitting label:', { faLabel, subAreas });
        chrome.runtime.sendMessage({
            action: 'submitLabel',
            data: { faLabel, subAreas }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
                alert('Error submitting label: ' + chrome.runtime.lastError.message);
            } else {
                console.log('Label submitted, response:', response);
                if (response && response.success) {
                    window.close();
                } else {
                    alert('Error submitting label. Please try again.');
                }
            }
        });
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
