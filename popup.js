document.getElementById('fillBtn').addEventListener('click', () => {
    const inputText = document.getElementById('formText').value;
    const data = parseFormText(inputText);

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
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

    // Map specific fields for pet information
    result.country = 'United States';

    // Handle microchip
    handleMicrochip(result);

    // Handle gender mapping
    mapGender(result);

    // Parse age
    parseAge(result);

    return result;
}

function handleMicrochip(result) {
    if (result.microchip === 'false') {
        result.id_chip = '';
    } else if (result.microchip && result.microchip !== 'true') {
        result.id_chip = result.microchip;
    }
}

function mapGender(result) {
    if (!result.sex) {
        result.gender_id = '8'; // Unknown
        return;
    }

    const isMale = result.sex === 'Male';
    const isNeutered = result.spayed_neutered === 'Yes';

    if (isMale) {
        result.gender_id = isNeutered ? '1' : '2'; // Neutered Male : Male
    } else if (result.sex === 'Female') {
        result.gender_id = isNeutered ? '4' : '5'; // Spayed Female : Female
    } else {
        result.gender_id = '8'; // Unknown
    }
}

function parseAge(result) {
    if (!result.age) return;

    let years = 0,
        months = 0,
        days = 0;

    const yearMatch = result.age.match(/(\d+)\s*year/);
    if (yearMatch) years = parseInt(yearMatch[1]);

    const monthMatch = result.age.match(/(\d+)\s*month/);
    if (monthMatch) months = parseInt(monthMatch[1]);

    const dayMatch = result.age.match(/(\d+)\s*day/);
    if (dayMatch) days = parseInt(dayMatch[1]);

    result.age_y = years.toString();
    result.age_m = months.toString();
    result.age_d = days.toString();
}

function fillFormOnPage(data) {
    // Define dispatchInputEvent within the function so it's available in the page context
    function dispatchInputEvent(element, value) {
        if (element) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    console.log('Filling form with data:', data);
    console.log('Current document:', document);

    // New Client Information Section
    const firstNameInput = document.getElementById('txtFirstname');
    const lastNameInput = document.getElementById('txtLastname');
    const emailInput = document.getElementById('txtEmail');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('txtCity');
    const stateInput = document.getElementById('txtState');
    const zipCodeInput = document.getElementById('txtPostcode');
    const countryInput = document.getElementById('txtCountry');
    const mobileNumberInput = document.getElementById('txtTelephone3');
    dispatchInputEvent(firstNameInput, data.first_name);
    dispatchInputEvent(lastNameInput, data.last_name);
    dispatchInputEvent(emailInput, data.email);
    dispatchInputEvent(addressInput, data.address);
    dispatchInputEvent(cityInput, data.city);
    dispatchInputEvent(stateInput, data.state);
    dispatchInputEvent(zipCodeInput, data.zip_code);
    dispatchInputEvent(countryInput, data.country);
    dispatchInputEvent(mobileNumberInput, data.phone);

    // Update the old client info
    const oldCityInput = document.getElementsByName('city')[0];
    const oldStateInput = document.getElementsByName('state')[0];
    const oldZipCodeInput = document.getElementsByName('postcode')[0];
    const oldCountryInput = document.getElementsByName('country')[0];
    const oldMobileNumberInput = document.getElementById('telephone3');
    const oldEmailInput = document.getElementById('client_email');
    dispatchInputEvent(oldCityInput, data.city);
    dispatchInputEvent(oldStateInput, data.state);
    dispatchInputEvent(oldZipCodeInput, data.zip_code);
    dispatchInputEvent(oldCountryInput, data.country);
    dispatchInputEvent(oldMobileNumberInput, data.phone);
    dispatchInputEvent(oldEmailInput, data.email);

    // New Pet Information Section
    const petNameInput = document.getElementsByName('patient_name')[0];
    const microchipInput = document.getElementById('microchip');
    const colorInput = document.getElementById('tagsColour');
    // const speciesInput = document.getElementsByName(
    //     'select2 select2-container select2-container--neo select2-container--above'
    // )
    // [0];
    const sexInput = document.getElementsByName('gender_id')[0];
    const yearInput = document.getElementsByName('age_y')[0];
    const monthInput = document.getElementsByName('age_m')[0];
    const dayInput = document.getElementsByName('age_d')[0];
    dispatchInputEvent(petNameInput, data.name);
    dispatchInputEvent(microchipInput, data.id_chip);
    dispatchInputEvent(colorInput, data.color);
    // dispatchInputEvent(speciesInput, data.species);
    dispatchInputEvent(sexInput, data.gender_id);
    dispatchInputEvent(yearInput, data.age_y);
    dispatchInputEvent(monthInput, data.age_m);
    dispatchInputEvent(dayInput, data.age_d);

    // // Handle Select2 species dropdown
    // const speciesSelect = document.getElementById('speciesId');
    // if (speciesSelect && data.species) {
    //     // Find the option that matches the species text
    //     const speciesOptions = Array.from(speciesSelect.options);
    //     const targetOption = speciesOptions.find(
    //         (option) => option.text.toLowerCase() === data.species.toLowerCase()
    //     );

    //     if (targetOption) {
    //         // Set the value
    //         speciesSelect.value = targetOption.value;

    //         // Trigger both native change event and Select2 change event
    //         speciesSelect.dispatchEvent(new Event('change', { bubbles: true }));

    //         // If jQuery and Select2 are available
    //         if (typeof $ !== 'undefined') {
    //             $(speciesSelect).trigger('change.select2');
    //         }
    //     }
    // }

    // Example data:
    // address : "11110 West Pico Boulevard"
    // age : "12 years 6 months 8 days"
    // age_d : "0"
    // age_m : "0"
    // age_y : "12"
    // breed : "Yorkie"
    // city : "Los Angeles"
    // client_information : ""
    // color : "Black/Gray"
    // email : "Mcootauc@gmail.com"
    // first_name : "Mitchell"
    // gender_id : "5"
    // id_chip : ""
    // last_name : "Cootauco"
    // microchip : "false"
    // name : "Butter"
    // patient_name : "Butter"
    // pet_information : ""
    // phone : "6267823100"
    // sex : "Female"
    // spayed_neutered : "Yes"
    // species : "Canine"
    // state : "California"
    // zip_code : "90064"
}
