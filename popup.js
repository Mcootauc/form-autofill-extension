document.getElementById('fillBtn').addEventListener('click', () => {
    const inputText = document.getElementById('formText').value;
    const data = parseFormText(inputText);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: fillFormOnPage,
            args: [data],
        });
    });
});

function parseFormText(text) {
    const result = {};
    const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    lines.forEach((line) => {
        const [label, ...rest] = line.split(':');
        const key = label.trim().toLowerCase().replace(/\s+/g, '_');
        const value = rest.join(':').trim();
        result[key] = value;
    });

    // Split name
    if (result.owner) {
        const [first, ...rest] = result.owner.split(' ');
        result.first_name = first;
        result.last_name = rest.join(' ');
    }

    // Parse phone into home number if not explicitly provided
    if (result.phone && !result.home_no) {
        result.home_no = result.phone;
    }

    // Extract country if you want to support international later
    result.country = 'USA'; // or use detection

    return result;
}

function fillFormOnPage(data) {
    const inputs = document.querySelectorAll('input');
    const textarea = document.querySelector('textarea');

    // Fill first and last name
    if (inputs.length >= 3) {
        inputs[1].value = data.first_name || '';
        inputs[2].value = data.last_name || '';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Parse address string
    const fullAddress = data.address || '';
    const [streetLine, cityLine, stateZipLine] = fullAddress
        .split(',')
        .map((s) => s.trim());

    // Extract state and zip if possible
    let state = '';
    let zip = '';
    if (stateZipLine) {
        state = stateZipLine.replace(/\d+/g, '').trim();
        zip = stateZipLine.match(/\b\d{5}\b/)?.[0] || '';
    }

    // 1. Address textarea - use for street address only
    if (textarea) {
        textarea.value = streetLine || '';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 2. Match by labels for city, zip, country, etc.
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const label = findInputLabel(input);

        if (label?.includes('Suburb')) {
            input.value = cityLine || '';
        } else if (label?.includes('State')) {
            input.value = state || '';
        } else if (label?.includes('Post Code')) {
            input.value = zip || '';
        } else if (label?.includes('Country')) {
            input.value = data.country || 'USA';
        } else if (label?.includes('Home No.')) {
            input.value = data.home_no || '';
        } else if (label?.includes('Work No.')) {
            input.value = data.work_no || '';
        } else if (label?.includes('Mobile No.')) {
            input.value = data.mobile_no || data.phone || '';
        } else if (label?.includes('Email')) {
            input.value = data.email || '';
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Helper function to find the label for an input field
function findInputLabel(input) {
    // Try to find label in various ways
    const closestTd = input.closest('td');
    if (!closestTd) return null;

    // Check if there's a previous sibling with label text
    const prevSibling = closestTd.previousElementSibling;
    if (prevSibling?.innerText) {
        return prevSibling.innerText.trim();
    }

    // Look for a label above the input (common pattern)
    const parentRow = closestTd.closest('tr');
    const labelRow = parentRow?.previousElementSibling;
    const labelCell = labelRow?.querySelector('td');
    if (labelCell?.innerText) {
        return labelCell.innerText.trim();
    }

    // Check for a label within the same cell
    const labelInCell = closestTd.querySelector('label');
    if (labelInCell?.innerText) {
        return labelInCell.innerText.trim();
    }

    return null;
}
