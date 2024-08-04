// Highlight target element
function highlightElement(element) {
  element.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
  element.style.outline = '2px solid red';
}

// Remove highlight from target element
function removeHighlight(element) {
  element.style.backgroundColor = '';
  element.style.outline = '';
}

// event listener for mouseover
document.addEventListener('mouseover', function(event) {
    const target = event.target;
    highlightElement(target);
});

// event listener for mouseout
document.addEventListener('mouseout', function(event) {
    const target = event.target;
    removeHighlight(target);
});
