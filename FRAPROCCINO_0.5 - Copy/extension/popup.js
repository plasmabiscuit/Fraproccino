// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
    const jsonFilePath = chrome.runtime.getURL("data/FRAPROP.json");
    const coffeeImage = document.getElementById("coffee-image");
    const coffeeImagePath = chrome.runtime.getURL("images/coffee.gif");
    const noCoffeeImagePath = chrome.runtime.getURL("images/no_coffee.gif");
    const superccinoImagePath = chrome.runtime.getURL("images/superccino.gif");
    const searchInput = document.getElementById("search-input");
    const listContainer = document.getElementById("list-container");
    const accountsTab = document.getElementById("accounts-tab");
    const accountsImageUrl = chrome.runtime.getURL("images/Accounts.png");
    const agenciesTab = document.getElementById("agencies-tab"    );

    let jsonData = { accounts: {}, agencies: {}, abbreviation_mapping: {} };
    let activeTab = "accounts";

    async function loadJSON() {
        try {
            const response = await fetch(jsonFilePath);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            jsonData = await response.json();
            populateList();
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    }

    function populateList() {
        const entries = Object.entries(jsonData[activeTab]);
        listContainer.innerHTML = "";
        entries.forEach(([name, number]) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");
            listItem.innerHTML = `<div class="name-box">${name}</div><div class="number-box">${number}</div>`;
            listContainer.appendChild(listItem);
        });
        listContainer.scrollTop = 0; // Ensure the scroll bar returns to the top
        if (entries.length === 0 && coffeeImage.src !== noCoffeeImagePath) {
            coffeeImage.src = noCoffeeImagePath;
        } else if (entries.length > 0 && coffeeImage.src !== coffeeImagePath) {
            coffeeImage.src = coffeeImagePath;
        }
    }

    function filterList() {
        const searchText = searchInput.value.toLowerCase();
        const abbreviationMapping = jsonData.abbreviation_mapping;
        const entries = Object.entries(jsonData[activeTab]).filter(([name, number]) => {
            const nameLower = name.toLowerCase();
            const words = nameLower.split(/\s+/); // Split name into words
    
            const matchesFullForm = Object.entries(abbreviationMapping).some(([abbr, fullForm]) => {
                return words.some(word => word.startsWith(fullForm.toLowerCase())) && searchText.startsWith(fullForm.toLowerCase());
            });
    
            const matchesAbbreviation = Object.keys(abbreviationMapping).some(abbr => {
                return words.some(word => word.startsWith(abbr.toLowerCase())) && searchText.startsWith(abbr.toLowerCase());
            });
    
            const matchesStart = words.some(word => word.startsWith(searchText));
    
            return matchesStart || number.includes(searchText) || matchesFullForm || matchesAbbreviation;
        });
    
        listContainer.innerHTML = "";
        entries.forEach(([name, number]) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");
            listItem.innerHTML = `<div class="name-box">${name}</div><div class="number-box">${number}</div>`;
            listContainer.appendChild(listItem);
        });
    
        if (searchText === "over9000") {
            coffeeImage.src = superccinoImagePath;
        } else if (entries.length === 0 && coffeeImage.src !== noCoffeeImagePath) {
            coffeeImage.src = noCoffeeImagePath;
        } else if (entries.length > 0 && coffeeImage.src !== coffeeImagePath) {
            coffeeImage.src = coffeeImagePath;
        }
    }

    function updateActiveTab(tab) {
        activeTab = tab;
        populateList();
        listContainer.scrollTop = 0;
        if (tab === "accounts") {
            accountsTab.classList.add("active-button");
            agenciesTab.classList.remove("active-button");
        } else {
            accountsTab.classList.remove("active-button");
            agenciesTab.classList.add("active-button");
        }
    }

    searchInput.addEventListener("input", () => {
        filterList();
    });

    accountsTab.addEventListener("click", () => {
        updateActiveTab("accounts");
    });

    agenciesTab.addEventListener("click", () => {
        updateActiveTab("agencies");
    });

    function copyTextAndShowToast(text, event) {
        // Copy text to clipboard
        navigator.clipboard.writeText(text).then(() => {
            // Create toast popup
            const toast = document.createElement("div");
            toast.classList.add("toast");
            toast.innerText = "*slurp*";
            document.body.appendChild(toast);
    
            // Position the toast above the cursor
            const cursorX = event.clientX;
            const cursorY = event.clientY;
            const toastWidth = toast.offsetWidth;
            toast.style.left = `${cursorX + window.scrollX - toastWidth / 2}px`;
            toast.style.top = `${cursorY + window.scrollY - toast.offsetHeight}px`;
    
            // Add the show class to make the toast visible
            setTimeout(() => {
                toast.classList.add("show");
            }, 10);
    
            // Remove the toast after 2 seconds
            setTimeout(() => {
                toast.remove();
            }, 2000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    }
    
    listContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("name-box") || event.target.classList.contains("number-box")) {
            copyTextAndShowToast(event.target.innerText, event);
        }
    });

    accountsTab.classList.add("active-button");

    loadJSON();

    
});
