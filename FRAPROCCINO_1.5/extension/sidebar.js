// Fallback for chrome.runtime used during Live Server testing
if (typeof chrome === 'undefined') {
  window.chrome = {};
}
if (!chrome.runtime) {
  chrome.runtime = {
      getURL: (path) => path // returns the provided path without modifying it
      // Remove before final build
  };
}

/* ============================================================
   PERSISTENCE FOR DISPLAY-BLOCKS
   ============================================================ */
// Helper functions to load/save the display-block state
function loadDisplayBlocks() {
  const stored = localStorage.getItem("sidebarDisplayBlocks");
  return stored ? JSON.parse(stored) : {};
}
function saveDisplayBlocks(blocks) {
  localStorage.setItem("sidebarDisplayBlocks", JSON.stringify(blocks));
}

// Global object to hold display-block state
let sidebarDisplayBlocks = loadDisplayBlocks();


/* ============================================================
   SAVE & LOAD FUNCTIONS FOR FORM DATA
   ============================================================ */

// Function to save all inputs into localStorage
function saveAllFormData() {
  const formData = {};
  document.querySelectorAll("input, textarea, select").forEach(input => {
    // Skip sponsorSearch so that its value remains blank for new queries
    if (input.id === "sponsorSearch-0") return;
    if (input.id) { // Only save inputs with an ID
      if (input.type === "checkbox") {
        formData[input.id] = input.checked; // Save checkbox state
      } else {
        formData[input.id] = input.value; // Save input values
      }
    }
  });
  localStorage.setItem("sidebarFormData", JSON.stringify(formData));
}

// Function to load saved inputs from localStorage
function loadAllFormData() {
  const savedData = localStorage.getItem("sidebarFormData");
  if (savedData) {
    const formData = JSON.parse(savedData);
    document.querySelectorAll("input, textarea, select").forEach(input => {
      if (formData.hasOwnProperty(input.id)) {
        if (input.type === "checkbox") {
          input.checked = formData[input.id]; // Restore checkbox state
        } else {
          input.value = formData[input.id]; // Restore input values
        }
      }
    });
  }
}

// Function to restore generated display-blocks on load
function restoreDisplayBlocks() {
  sidebarDisplayBlocks = loadDisplayBlocks();
  
  // Restore proposal block if saved
  if (sidebarDisplayBlocks["proposalBlockDisplay-0"]) {
    const data = sidebarDisplayBlocks["proposalBlockDisplay-0"];
    document.getElementById(`proposalNumber-0`).value = data.pn;
    document.getElementById(`projectStart-0`).value = data.start;
    document.getElementById(`projectEnd-0`).value = data.end;
    document.getElementById(`proposalTitle-0`).value = data.title;
    document.getElementById(`totalDirect-0`).value = data.direct;
    document.getElementById(`totalIndirect-0`).value = data.indirect;
    document.getElementById(`totalCost-0`).value = data.total;
    updateProposalBlock(0);
  }
  
  // Restore personnel blocks if any
  if (sidebarDisplayBlocks["personnelBlocks-0"]) {
    const container = document.getElementById("personnelContainer-0");
    // Remove existing personnel rows (except for the add-plus button)
    const addPlus = container.querySelector(".add-plus");
    container.innerHTML = "";
    sidebarDisplayBlocks["personnelBlocks-0"].forEach(person => {
      const block = document.createElement("div");
      block.className = "display-block personnel-block";
      const header = document.createElement("div");
      header.className = "block-header";
      header.innerHTML = `<span class="badge">${person.role}</span>
                          <span class="badge">${person.dept}</span>`;
      block.appendChild(header);
      const content = document.createElement("div");
      content.className = "block-content";
      content.textContent = `${person.first} ${person.last}`;
      block.appendChild(content);
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-block";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => removePersonnelBlock(removeBtn));
      block.appendChild(removeBtn);
      container.appendChild(block);
    });
    // Re-append the add-plus button
    if (addPlus) container.appendChild(addPlus);
  }
  
  // Restore sponsor block if saved
  if (sidebarDisplayBlocks["sponsorBlock-0"]) {
    const sponsorDisplay = document.getElementById(`sponsorSelected-0`);
    const data = sidebarDisplayBlocks["sponsorBlock-0"];
    let badgesHTML = `<div class="sponsor-badges">
      <span class="badge">${data["Sponsor Type"] || "N/A"}</span>
      <span class="badge">${data["Sponsor Code"]}</span>
      <span class="badge">${data["Banner ID"]}</span>`;
    if (data["Sponsor Type"] && data["Sponsor Type"].toLowerCase() === "federal") {
      badgesHTML += `<span class="badge"><input type="text" id="cfda-0" placeholder="CFDA" style="width:50px; font-size:0.7em; border:none; background:transparent; color:#fff;"></span>`;
    }
    badgesHTML += `</div>`;
    const block = document.createElement("div");
    block.classList.add("display-block");
    block.innerHTML = badgesHTML + `<div class="block-content sponsor-name">${data["Sponsor Name"]}</div>`;
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("remove-block");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function() {
      removeSponsor(0);
    });
    block.appendChild(removeBtn);
    sponsorDisplay.innerHTML = "";
    sponsorDisplay.appendChild(block);
    document.getElementById(`sponsorSection-0`).style.display = "none";
  }
}


/* ============================================================
   DOMContentLoaded Initialization
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  loadAllFormData(); // Load saved form input data
  restoreDisplayBlocks(); // Restore generated display-blocks

  // Save input changes automatically
  document.addEventListener("input", saveAllFormData);
  document.addEventListener("change", saveAllFormData);

  // Observe dynamically added elements and attach listeners
  const observer = new MutationObserver(() => {
    document.querySelectorAll("input, textarea, select").forEach(input => {
      input.removeEventListener("input", saveAllFormData);
      input.removeEventListener("change", saveAllFormData);
      input.addEventListener("input", saveAllFormData);
      input.addEventListener("change", saveAllFormData);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Set PDF.js worker source (assumes pdfjsLib is loaded via libs/pdf.js)
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('/libs/pdf.worker.js');
  }
});


/* ============================================================
   PAGE SWITCHING FUNCTIONS
   ============================================================ */
function switchCardPage(cardIndex, pageNumber) {
  const card = document.querySelector('.proposalCard[data-index="' + cardIndex + '"]');
  card.querySelectorAll('.cardPage').forEach(page => page.classList.remove('active'));
  const target = document.getElementById(`card-${cardIndex}-page-${pageNumber}`);
  if (target) target.classList.add('active');
}

function showBudgetPage() {
  switchCardPage(0, 2);
  if (!budgetInitialized) {
    initializeBudgetPage();
    budgetInitialized = true;
  }
}


/* ============================================================
   PROPOSAL PAGE FUNCTIONS (Page 1)
   ============================================================ */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatDollar(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "$0";
  return Number.isInteger(num) ? `$${num}` : `$${num.toFixed(2)}`;
}

function checkAndUpdateProposalBlock(cardIndex) {
  const pn = document.getElementById(`proposalNumber-${cardIndex}`).value.trim();
  const start = document.getElementById(`projectStart-${cardIndex}`).value;
  const end = document.getElementById(`projectEnd-${cardIndex}`).value;
  const title = document.getElementById(`proposalTitle-${cardIndex}`).value.trim();
  const direct = document.getElementById(`totalDirect-${cardIndex}`).value;
  const indirect = document.getElementById(`totalIndirect-${cardIndex}`).value;
  const total = document.getElementById(`totalCost-${cardIndex}`).value;
  if (pn && start && end && title && direct && indirect && total) {
    updateProposalBlock(cardIndex);
  }
}

function updateProposalBlock(cardIndex) {
  // Gather input values
  const pn = document.getElementById(`proposalNumber-${cardIndex}`).value.trim();
  const start = document.getElementById(`projectStart-${cardIndex}`).value;
  const end = document.getElementById(`projectEnd-${cardIndex}`).value;
  const title = document.getElementById(`proposalTitle-${cardIndex}`).value.trim();
  const direct = document.getElementById(`totalDirect-${cardIndex}`).value;
  const indirect = document.getElementById(`totalIndirect-${cardIndex}`).value;
  const total = document.getElementById(`totalCost-${cardIndex}`).value;
  
  // Create proposal block container element
  const block = document.createElement("div");
  block.className = "display-block";
  block.id = `proposalBlockDisplay-${cardIndex}`;

  // Create header
  const header = document.createElement("div");
  header.className = "block-header";
  header.innerHTML = `<span class="badge">${formatDate(start)}</span>
                      <span class="badge">${pn}</span>
                      <span class="badge">${formatDate(end)}</span>`;
  block.appendChild(header);

  // Create content
  const content = document.createElement("div");
  content.className = "block-content";
  content.textContent = title;
  block.appendChild(content);

  // Create footer
  const footer = document.createElement("div");
  footer.className = "block-footer";
  footer.innerHTML = `<span class="badge">${formatDollar(direct)} Direct</span>
                      <span class="badge">${formatDollar(indirect)} Indirect</span>
                      <span class="badge">${formatDollar(total)} Total</span>`;
  block.appendChild(footer);

  // Create remove button and attach event listener
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-block";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => {
    removeProposalBlock(cardIndex);
    // Remove from persistent state
    delete sidebarDisplayBlocks[`proposalBlockDisplay-${cardIndex}`];
    saveDisplayBlocks(sidebarDisplayBlocks);
  });
  block.appendChild(removeBtn);

  // Insert the block into the DOM and hide the input section
  const container = document.getElementById(`proposalBlockContainer-${cardIndex}`);
  container.innerHTML = "";
  container.appendChild(block);
  document.getElementById(`proposalInputs-${cardIndex}`).style.display = "none";
  
  // Save the proposal block data to persistent state
  sidebarDisplayBlocks[`proposalBlockDisplay-${cardIndex}`] = { pn, start, end, title, direct, indirect, total };
  saveDisplayBlocks(sidebarDisplayBlocks);
}

// Use blur event on totalCost-0 to ensure complete input before generation
document.getElementById("totalCost-0").addEventListener("blur", () => checkAndUpdateProposalBlock(0));

// Attach events for other proposal inputs
["proposalNumber", "projectStart", "projectEnd", "proposalTitle", "totalDirect", "totalIndirect"].forEach(field => {
  document.getElementById(`${field}-0`).addEventListener(
    (field === "projectStart" || field === "projectEnd") ? "change" : "input",
    () => checkAndUpdateProposalBlock(0)
  );
});
  
// Add missing function to remove the proposal block and restore the input view
function removeProposalBlock(cardIndex) {
  const container = document.getElementById(`proposalBlockContainer-${cardIndex}`);
  if(container) {
    container.innerHTML = "";
  }
  const inputs = document.getElementById(`proposalInputs-${cardIndex}`);
  if(inputs) {
    inputs.style.display = "block";
  }
}


/* ============================================================
   PERSONNEL SECTION FUNCTIONS (Page 1)
   ============================================================ */
function checkAndUpdatePersonnel(inputElem) {
  setTimeout(() => {
    const row = inputElem.closest('.personnel-row');
    if (!row) return;
    const first = row.querySelector('.person-first').value.trim();
    const last = row.querySelector('.person-last').value.trim();
    const dept = row.querySelector('.person-dept').value.trim();
    const roleElem = row.querySelector('.person-role');
    const role = roleElem ? roleElem.value : "PI";
    if (first && last && dept && role) {
      updatePersonnelBlock(row, role);
    }
  }, 300);
}

function updatePersonnelBlock(row, role) {
  const first = row.querySelector('.person-first').value.trim();
  const last = row.querySelector('.person-last').value.trim();
  const deptInput = row.querySelector('.person-dept');
  const dept = deptInput.value.trim();
  const fullDeptName = deptInput.dataset.fullDeptName || dept;
  const deptTrimmed = fullDeptName.split("-")[0].trim();

  // Create personnel block container
  const block = document.createElement("div");
  block.className = "display-block personnel-block";

  // Create header for personnel block
  const header = document.createElement("div");
  header.className = "block-header";
  header.innerHTML = `<span class="badge">${role}</span>
                      <span class="badge">${deptTrimmed}</span>`;
  block.appendChild(header);

  // Create content with person name
  const content = document.createElement("div");
  content.className = "block-content";
  content.textContent = `${first} ${last}`;
  block.appendChild(content);

  // Create remove button and attach event listener
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-block";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => {
    removePersonnelBlock(removeBtn);
    // Remove corresponding personnel from persistent state
    if (sidebarDisplayBlocks["personnelBlocks-0"]) {
      sidebarDisplayBlocks["personnelBlocks-0"] = sidebarDisplayBlocks["personnelBlocks-0"].filter(person =>
        !(person.first === first && person.last === last && person.role === role && person.dept === deptTrimmed)
      );
      saveDisplayBlocks(sidebarDisplayBlocks);
    }
  });
  block.appendChild(removeBtn);

  // Insert the personnel block before the current row and remove the row
  row.parentNode.insertBefore(block, row);
  row.remove();
  
  // Save personnel block to persistent state
  if (!sidebarDisplayBlocks["personnelBlocks-0"]) {
    sidebarDisplayBlocks["personnelBlocks-0"] = [];
  }
  sidebarDisplayBlocks["personnelBlocks-0"].push({ first, last, role, dept: deptTrimmed, fullDeptName });
  saveDisplayBlocks(sidebarDisplayBlocks);
}

function removePersonnelBlock(btn) {
  const block = btn.closest('.display-block');
  block.remove();
}

function addEmptyPersonnelRow(cardIndex) {
  const container = document.getElementById("personnelContainer-0");
  const row = document.createElement('div');
  row.classList.add('personnel-row');
  const uniqueId = Math.random();
  row.innerHTML = `
      <div class="name-row">
        <input type="text" class="person-first" style="width: 50%" placeholder="First">
        <input type="text" class="person-last" style="width: 50%" placeholder="Last">
      </div>
      <div class="role-row">
        <select class="person-role">
          <option value="">Select Role</option>
          <option value="CoPI">CoPI</option>
          <option value="Key Person">Key Person</option>
        </select>
        <div class="dept-wrapper" style="flex:1;">
            <input type="text" class="person-dept" placeholder="Dept.">
            <div class="dept-results" id="deptResults-${uniqueId}"></div>
        </div>
      </div>
    `;
  const plusBtn = document.querySelector("#personnelContainer-0 .add-plus");
  container.insertBefore(row, plusBtn);
  
  // Attach events to new inputs
  row.querySelector(".person-first").addEventListener("blur", function() { checkAndUpdatePersonnel(this); });
  row.querySelector(".person-last").addEventListener("blur", function() { checkAndUpdatePersonnel(this); });
  const deptInput = row.querySelector(".person-dept");
  deptInput.addEventListener("input", function() { searchDept(this, `deptResults-${uniqueId}`); });
  deptInput.addEventListener("blur", function() { hideDeptResults(`deptResults-${uniqueId}`); });
}


/* ============================================================
   SPONSOR SECTION FUNCTIONS (Page 1)
   ============================================================ */
let allSponsors = [];

// Load sponsor JSON data (and department options) once
fetch(chrome.runtime.getURL('/data/updated_streamlyne_map.json'))
  .then(response => response.json())
  .then(data => {
    allSponsors = data.sponsors;
    allSponsors.forEach(sponsor => {
      sponsor["Sponsor Type"] = "";
      if (sponsor["CFDA"] !== "") {
        sponsor["Sponsor Type"] = "Federal";
      }
    });
    data["pd-inputs"].forEach(entry => {
      if (entry["Placeholder"] === "Responsible Department") {
        allDepartments = Object.entries(entry.options).map(([key, value]) => ({
          departmentCode: key,
          departmentName: value,
        }));
      }
    });
  })
  .catch(error => console.error('Error loading sponsors JSON:', error));

function searchSponsor(cardIndex) {
  const inputVal = document.getElementById(`sponsorSearch-${cardIndex}`).value.toLowerCase();
  const resultsDiv = document.getElementById(`sponsorResults-${cardIndex}`);
  resultsDiv.innerHTML = "";
  if (!inputVal) return;
  const matches = allSponsors.filter(sponsor => {
    const name = (sponsor["Sponsor Name"] || "").toLowerCase();
    const code = (sponsor["Sponsor Code"] || "").toString().toLowerCase();
    const banner = (sponsor["Banner ID"] || "").toLowerCase();
    return name.includes(inputVal) || code.includes(inputVal) || banner.includes(inputVal);
  });
  if (matches.length === 0) {
    const noResults = document.createElement('div');
    noResults.style.padding = "3px";
    noResults.textContent = "No Results";
    resultsDiv.appendChild(noResults);
  } else {
    matches.forEach(sponsor => {
      const div = document.createElement('div');
      div.style.cursor = "pointer";
      div.style.padding = "3px";
      div.style.borderBottom = "1px solid #ddd";
      div.textContent = sponsor["Sponsor Name"];
      div.addEventListener("click", function() {
        selectSponsor(cardIndex, sponsor);
      });
      resultsDiv.appendChild(div);
    });
  }
}

function selectSponsor(cardIndex, sponsor) {
  const sponsorDisplay = document.getElementById(`sponsorSelected-${cardIndex}`);
  sponsorDisplay.innerHTML = "";
  document.getElementById(`sponsorSection-${cardIndex}`).style.display = "none";

  let badgesHTML = `
    <div class="sponsor-badges">
      <span class="badge">${sponsor["Sponsor Type"] || "N/A"}</span>
      <span class="badge">${sponsor["Sponsor Code"]}</span>
      <span class="badge">${sponsor["Banner ID"]}</span>
  `;
  if (sponsor["Sponsor Type"].toLowerCase() === "federal") {
    badgesHTML += `<span class="badge"><input type="text" id="cfda-0" placeholder="CFDA" style="width:50px; font-size:0.7em; border:none; background:transparent;"></span>`;
  }
  badgesHTML += `</div>`;

  const block = document.createElement('div');
  block.classList.add('display-block');
  block.innerHTML = badgesHTML + `<div class="block-content sponsor-name">${sponsor["Sponsor Name"]}</div>`;
  
  const removeBtn = document.createElement('button');
  removeBtn.classList.add('remove-block');
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", function() {
    removeSponsor(cardIndex);
    // Remove from persistent state
    delete sidebarDisplayBlocks[`sponsorBlock-${cardIndex}`];
    saveDisplayBlocks(sidebarDisplayBlocks);
  });
  block.appendChild(removeBtn);
  sponsorDisplay.appendChild(block);
  document.getElementById(`sponsorResults-${cardIndex}`).innerHTML = "";
  document.getElementById(`sponsorSearch-${cardIndex}`).value = "";
  
  // Save sponsor block data to persistent state
  sidebarDisplayBlocks[`sponsorBlock-${cardIndex}`] = sponsor;
  saveDisplayBlocks(sidebarDisplayBlocks);
}

function removeSponsor(cardIndex) {
  document.getElementById(`sponsorSelected-${cardIndex}`).innerHTML = "";
  document.getElementById(`sponsorSection-${cardIndex}`).style.display = "block";
  delete sidebarDisplayBlocks[`sponsorBlock-${cardIndex}`];
  saveDisplayBlocks(sidebarDisplayBlocks);
}


/* ============================================================
   DEPARTMENT SEARCH FUNCTIONS
   ============================================================ */
let allDepartments = [];

function searchDept(inputElement, resultsDivId) {
  const inputVal = inputElement.value.toLowerCase();
  const resultsDiv = document.getElementById(resultsDivId);
  resultsDiv.innerHTML = "";
  if (!inputVal) {
    return;
  }
  const matches = allDepartments.filter(dept =>
    dept.departmentName.toLowerCase().includes(inputVal)
  );
  if (matches.length === 0) {
    const noResults = document.createElement('div');
    noResults.style.padding = "3px";
    noResults.textContent = "No Results";
    resultsDiv.appendChild(noResults);
  } else {
    matches.forEach(dept => {
      const div = document.createElement('div');
      div.style.cursor = "pointer";
      div.style.padding = "3px";
      div.style.borderBottom = "1px solid #ddd";
      div.textContent = dept.departmentName.split("-")[0].trim();
      div.addEventListener("click", function() {
        selectDept(inputElement, resultsDivId, dept);
      });
      resultsDiv.appendChild(div);
    });
  }
}

function selectDept(inputElement, resultsDivId, dept) {
  inputElement.value = dept.departmentName;
  inputElement.dataset.fullDeptName = dept.departmentName;
  hideDeptResults(resultsDivId);
  checkAndUpdatePersonnel(inputElement);
}

function hideDeptResults(resultsDivId) {
  const resultsDiv = document.getElementById(resultsDivId);
  setTimeout(() => {
    resultsDiv.innerHTML = "";
  }, 200);
}



/* ============================================================
   BUDGET PAGE FUNCTIONS (Page 2)
   ============================================================
*/
let budgetInitialized = false;
let budgetPeriods = [];
let budgetData = {}; // Object to store parsed budget data

function computePeriods() {
  const startStr = document.getElementById("projectStart-0").value;
  const endStr = document.getElementById("projectEnd-0").value;
  if (!startStr || !endStr) return [];
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  let periods = [];
  let periodStart = new Date(startDate);
  let count = 1;
  while (periodStart <= endDate) {
    let periodEnd = new Date(periodStart);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
    if (periodEnd > endDate) periodEnd = new Date(endDate);
    periods.push({ label: "Y" + count, start: new Date(periodStart), end: new Date(periodEnd) });
    periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() + 1);
    count++;
  }
  return periods;
}

function initializeBudgetPage() {
  budgetPeriods = computePeriods();
  const periodButtonsDiv = document.getElementById("periodButtons");
  periodButtonsDiv.innerHTML = "";
  budgetPeriods.forEach((period, index) => {
    const btn = document.createElement("button");
    btn.textContent = period.label;
    btn.addEventListener("click", function() { showBudgetPeriod(index + 1); });
    periodButtonsDiv.appendChild(btn);
  });
  const totalBtn = document.createElement("button");
  totalBtn.textContent = "Total";
  totalBtn.addEventListener("click", function() { showBudgetPeriod("Total"); });
  periodButtonsDiv.appendChild(totalBtn);
  
  // Configure back button
  document.getElementById("backBtn-0").addEventListener("click", function() {
    switchCardPage(0, 1); // Switch back to proposal page
  });
  
  // Default: show period 1
  showBudgetPeriod(1);
  
  // Load any previously saved budget data
  loadBudgetData();
}

// New function to load saved budget data
function loadBudgetData() {
  const savedData = localStorage.getItem("budgetData");
  if (savedData) {
    budgetData = JSON.parse(savedData);
    renderBudgetData(budgetData);
  }
}

// Function to save budget data
function saveBudgetData() {
  localStorage.setItem("budgetData", JSON.stringify(budgetData));
}

let currentBudgetPeriod = 1;

function showBudgetPeriod(period) {
  currentBudgetPeriod = period;
  
  // Set active state on period buttons
  document.querySelectorAll("#periodButtons button").forEach((btn, idx) => {
    if ((typeof period === "number" && idx === period - 1) || 
        (period === "Total" && btn.textContent === "Total")) {
      btn.style.backgroundColor = "#9b7559";
    } else {
      btn.style.backgroundColor = "#3a3a3a";
    }
  });

  // Render budget data for selected period
  renderBudgetDataForPeriod(period);
}

function renderBudgetDataForPeriod(period) {
  // Clear all section contents
  document.querySelectorAll(".section-content").forEach(section => {
    section.innerHTML = "";
  });
  
  // Reset all section totals
  document.querySelectorAll(".section-total").forEach(totalElem => {
    totalElem.textContent = "Total: $0.00";
  });
  
  // If we have budget data, render it
  if (Object.keys(budgetData).length > 0) {
    renderBudgetData(budgetData, period);
  }
}

// Function to extract budget data from the current active tab and populate the budget sections
function extractBudgetCategories() {
  return new Promise((resolve, reject) => {
    // We need to execute script in the context of the active tab to extract budget data
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        reject("No active tab found");
        return;
      }
      
      // Execute a script in the context of the active tab
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: extractBudgetFromPage
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error("Error executing script:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError.message);
          return;
        }
        
        if (!results || results.length === 0 || !results[0].result) {
          reject("No budget data found");
          return;
        }
        
        resolve(results[0].result);
      });
    });
  });
}

// This function is injected into the active tab to extract budget data
function extractBudgetFromPage() {
    // Iterate over all tables in the page
    const allTables = document.querySelectorAll('table');
    const keywords = ['salary', 'fringe', 'equipment', 'travel', 'participant', 'direct', 'tuition'];
    let targetTable = null;

    allTables.forEach(tbl => {
        const tableText = tbl.innerText.toLowerCase();
        if (keywords.some(keyword => tableText.includes(keyword))) {
            targetTable = tbl;
        }
    });

    if (!targetTable) {
        console.error("No budget table found with matching categories.");
        return null;
    }
    
    // ...existing code initializations...
    const data = {}; // Will store parsed budget data.
    let currentCategory = null;
    let currentHeader = null;
    let currentItems = [];
    let currentSubcategory = null;

    // Use targetTable instead of the original table element.
    const rows = Array.from(targetTable.querySelectorAll('tr'));
    // ...existing parsing logic...
    
    // Finalize and return the data object.
    return data;
}

// Import budget data from current page and populate budget sections
function importBudget() {
  // Show a loading message
  const importBtn = document.getElementById("importBudgetBtn");
  const originalText = importBtn.textContent;
  importBtn.textContent = "Loading...";
  importBtn.disabled = true;

  // Extract budget data using Promise
  extractBudgetCategories()
    .then(extractedData => {
      if (!extractedData || Object.keys(extractedData).length === 0) {
        alert("No budget data found. Make sure you're viewing a page with the budget table.");
        return;
      }

      // Store the extracted data
      budgetData = extractedData;
      
      // Save to localStorage
      saveBudgetData();
      
      // Render the budget data
      renderBudgetData(budgetData);
      
      // Show success message
      alert("Budget data successfully imported!");
    })
    .catch(error => {
      // Show error message
      alert("Error importing budget: " + error);
      console.error("Import error:", error);
    })
    .finally(() => {
      // Restore button state
      importBtn.textContent = originalText;
      importBtn.disabled = false;
    });
}

// Render budget data for all sections
function renderBudgetData(data, specificPeriod = null) {
  // For each budget category, find or create a corresponding section
  Object.keys(data).forEach(categoryName => {
    const categoryData = data[categoryName];
    
    // Map category names to section IDs (or create new sections)
    let sectionId;
    if (categoryName.toLowerCase().includes('salary') || 
        categoryName.toLowerCase().includes('salaries')) {
      sectionId = 'section-Salary';
    } else if (categoryName.toLowerCase().includes('fringe')) {
      sectionId = 'section-Fringe';
    } else if (categoryName.toLowerCase().includes('equipment')) {
      sectionId = 'section-Equipment';
    } else if (categoryName.toLowerCase().includes('travel')) {
      sectionId = 'section-Travel';
    } else if (categoryName.toLowerCase().includes('participant')) {
      sectionId = 'section-ParticipantSupport';
    } else if (categoryName.toLowerCase().includes('direct')) {
      sectionId = 'section-OtherDirect';
    } else if (categoryName.toLowerCase().includes('tuition')) {
      // Check if we need to create a section for tuition
      if (!document.getElementById('section-Tuition')) {
        createBudgetSection('Tuition');
      }
      sectionId = 'section-Tuition';
    } else {
      // Create a new section for this category if it doesn't exist
      const sectionNameNoSpaces = categoryName.replace(/\s+/g, '');
      if (!document.getElementById(`section-${sectionNameNoSpaces}`)) {
        createBudgetSection(categoryName);
      }
      sectionId = `section-${sectionNameNoSpaces}`;
    }
    
    // Find the section content element
    const sectionContent = document.getElementById(`content-${sectionId.split('-')[1]}`);
    if (!sectionContent) {
      console.error(`Section content element not found for ${categoryName}`);
      return;
    }
    
    // Clear the section if we're rendering a specific period or first time rendering
    if (specificPeriod !== null) {
      sectionContent.innerHTML = '';
    }
    
    // Render items for this category
    renderCategoryItems(categoryData.items, sectionContent, specificPeriod);
    
    // Update section total
    const periodIndex = specificPeriod === "Total" ? -2 : (specificPeriod ? specificPeriod - 1 : 0);
    updateSectionTotalFromData(categoryData, sectionId, periodIndex);
  });
}

// Create a new budget section dynamically
function createBudgetSection(categoryName) {
  const sectionNameNoSpaces = categoryName.replace(/\s+/g, '');
  const budgetSections = document.getElementById('budgetSections');
  
  const section = document.createElement('div');
  section.className = 'budget-section';
  section.id = `section-${sectionNameNoSpaces}`;
  
  section.innerHTML = `
    <div class="section-header">
      <h4>${categoryName}</h4>
    </div>
    <div class="section-content" id="content-${sectionNameNoSpaces}"></div>
    <div class="section-total" id="total-${sectionNameNoSpaces}">Total: $0.00</div>
  `;
  
  budgetSections.appendChild(section);
}

// Render items for a category
function renderCategoryItems(items, container, specificPeriod) {
  items.forEach(item => {
    if (item.isSubcategory) {
      // Render subcategory header
      const subcategoryHeader = document.createElement('div');
      subcategoryHeader.className = 'subcategory-header';
      subcategoryHeader.textContent = item.header[0]; // First cell contains subcategory name
      subcategoryHeader.style.fontWeight = 'bold';
      subcategoryHeader.style.marginTop = '8px';
      subcategoryHeader.style.marginBottom = '5px';
      container.appendChild(subcategoryHeader);
      
      // Render items in the subcategory
      renderCategoryItems(item.items, container, specificPeriod);
    } else {
      // Render regular line item
      const row = document.createElement('div');
      row.className = 'budget-row';
      
      // Description column
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'budget-item-description';
      descriptionDiv.textContent = item.description;
      descriptionDiv.style.width = '45%';
      descriptionDiv.style.overflow = 'hidden';
      descriptionDiv.style.textOverflow = 'ellipsis';
      descriptionDiv.style.whiteSpace = 'nowrap';
      row.appendChild(descriptionDiv);
      
      // Amount column - changes based on if we're showing a specific period or not
      const amountDiv = document.createElement('div');
      amountDiv.className = 'budget-item-amount';
      amountDiv.style.width = '30%';
      
      let amount;
      if (specificPeriod === "Total") {
        // Show the overall total
        amount = parseFloat(item.overallTotals[0].replace(/[$,]/g, ''));
      } else if (specificPeriod && item.sponsorCosts[specificPeriod - 1]) {
        // Show the sponsor cost for the specific period
        amount = parseFloat(item.sponsorCosts[specificPeriod - 1].replace(/[$,]/g, ''));
      } else {
        // Default to first period
        amount = parseFloat(item.sponsorCosts[0].replace(/[$,]/g, ''));
      }
      
      amountDiv.textContent = formatCurrency(amount);
      row.appendChild(amountDiv);
      
      // Cost Share column - only show if not omitted
      if (!item.omitCostShare) {
        const costShareDiv = document.createElement('div');
        costShareDiv.className = 'budget-item-costshare';
        costShareDiv.style.width = '25%';
        
        let costShare;
        if (specificPeriod === "Total") {
          costShare = parseFloat(item.overallTotals[1].replace(/[$,]/g, ''));
        } else if (specificPeriod && item.costShares[specificPeriod - 1]) {
          costShare = parseFloat(item.costShares[specificPeriod - 1].replace(/[$,]/g, ''));
        } else {
          costShare = parseFloat(item.costShares[0].replace(/[$,]/g, ''));
        }
        
        costShareDiv.textContent = formatCurrency(costShare);
        row.appendChild(costShareDiv);
      }
      
      container.appendChild(row);
    }
  });
}

// Helper function to format currency values
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

// Update section total based on data for a specific period
function updateSectionTotalFromData(categoryData, sectionId, periodIndex) {
  const sectionName = sectionId.split('-')[1];
  let total = 0;
  
  // Calculate total from all items in the category
  function addItemsTotal(items) {
    items.forEach(item => {
      if (item.isSubcategory) {
        addItemsTotal(item.items);
      } else {
        let value;
        if (periodIndex === -2) { // Total across all periods
          value = parseFloat(item.overallTotals[0].replace(/[$,]/g, '')) || 0;
        } else {
          value = parseFloat(item.sponsorCosts[periodIndex].replace(/[$,]/g, '')) || 0;
        }
        total += value;
      }
    });
  }
  
  addItemsTotal(categoryData.items);
  
  // Update the total display
  const totalElem = document.getElementById(`total-${sectionName}`);
  if (totalElem) {
    totalElem.textContent = `Total: ${formatCurrency(total)}`;
  }
}

function showBudgetPage() {
  switchCardPage(0, 2);
  if (!budgetInitialized) {
    initializeBudgetPage();
    budgetInitialized = true;
  }
}

// Modify saveAllFormData to include budget data
const originalSaveAllFormData = saveAllFormData;
saveAllFormData = function() {
  originalSaveAllFormData();
  saveBudgetData();
};

// Include loading budget data when the page loads
document.addEventListener("DOMContentLoaded", function() {
  // ...existing code...
  
  // Configure Import Budget button
  const importBudgetBtn = document.getElementById("importBudgetBtn");
  if (importBudgetBtn) {
    importBudgetBtn.addEventListener("click", importBudget);
  }
  
  // Configure back button
  const backBtn = document.getElementById("backBtn-0");
  if (backBtn) {
    backBtn.addEventListener("click", function() {
      switchCardPage(0, 1); // Switch back to proposal page
    });
  }
});

// Include budget data in the archive process
const originalArchiveCurrentProposal = archiveCurrentProposal;
archiveCurrentProposal = function() {
  // Get budget data first
  const currentBudgetData = localStorage.getItem("budgetData");
  
  // Call original function
  originalArchiveCurrentProposal();
  
  // Retrieve the latest archived proposals
  let archivedProposals = JSON.parse(localStorage.getItem("archivedProposals") || "[]");
  
  // Add budget data to the most recent archive if it exists
  if (archivedProposals.length > 0 && currentBudgetData) {
    archivedProposals[archivedProposals.length - 1].budgetData = JSON.parse(currentBudgetData);
    localStorage.setItem("archivedProposals", JSON.stringify(archivedProposals));
  }
};

// Modify loadArchivedProposal to load budget data too
const originalLoadArchivedProposal = loadArchivedProposal;
loadArchivedProposal = function(archiveIndex) {
  let archivedProposals = JSON.parse(localStorage.getItem("archivedProposals") || "[]");
  if (!archivedProposals[archiveIndex]) return;
  const entry = archivedProposals[archiveIndex];
  
  // Load budget data if it exists
  if (entry.budgetData) {
    localStorage.setItem("budgetData", JSON.stringify(entry.budgetData));
  } else {
    localStorage.removeItem("budgetData");
  }
  
  // Call original function
  originalLoadArchivedProposal(archiveIndex);
};

// Modify clearSidePanel to clear budget data too
const originalClearSidePanel = clearSidePanel;
clearSidePanel = function() {
  originalClearSidePanel();
  localStorage.removeItem("budgetData");
};


/* ============================================================
   DYNAMIC DRAWER DISPLAY FUNCTIONS 
   ============================================================
*/

// Global state for the drawer (default state is "attachments")
let drawerState = "attachments";
let attachments = []; // This array will store attachment objects

// Helper function: Returns the URL for the appropriate icon based on file extension.
// (Re-added to restore file icon display in the drawer)
function getFileIcon(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (["doc", "docm", "docx", "dot", "dotm"].includes(extension)) {
    return chrome.runtime.getURL('/images/word.png');
  } else if (["csv", "dbf", "xls", "xlsm", "xlsx", "xlw", "xml", "xps"].includes(extension)) {
    return chrome.runtime.getURL('/images/excel.png');
  } else if (["ppt", "pptx", "pptm"].includes(extension)) {
    return chrome.runtime.getURL('/images/ppt.png');
  } else if (extension === "pdf") {
    return chrome.runtime.getURL('/images/pdf.png');
  } else {
    return chrome.runtime.getURL('/images/generic.png');
  }
}

// NEW: Helper function to add or replace an attachment
function addOrReplaceAttachment(file, fileData) {
    const index = attachments.findIndex(att => att.name === file.name);
    if (index >= 0) {
        attachments[index] = { name: file.name, type: file.type, data: fileData };
    } else {
        attachments.push({ name: file.name, type: file.type, data: fileData });
    }
    localStorage.setItem('attachments', JSON.stringify(attachments));
    renderAttachmentsList();
}

// Function to render the content of the .drawer-display based on drawerState
function renderDrawerDisplay() {
  const display = document.querySelector('.drawer-display');
  if (!display) return;

  if (drawerState === "attachments") {
    // Render attachments mode with a plus button and a hidden file input
    display.innerHTML = `
      <div class="attachments-container">
        <button id="addAttachmentBtn" class="add-plus">＋</button>
        <div id="attachmentsList"></div>
        <input type="file" id="attachmentInput" style="display:none" multiple>
      </div>
    `;
    // Attach event listeners for file uploads
    document.getElementById('addAttachmentBtn').addEventListener('click', () => {
      document.getElementById('attachmentInput').click();
    });
    document.getElementById('attachmentInput').addEventListener('change', handleFiles);
    // Enable drag-and-drop file uploads on the entire display area
    setupDragAndDrop(display);
    renderAttachmentsList();
  } else if (drawerState === "email") {
    display.innerHTML = `<p>No recent conversations</p>`;
  } else if (drawerState === "console") {
    // Render archived proposals with updated console blocks
    renderConsoleBlocks();
  }
}

// Modified: Function to handle file selection from the hidden input
function handleFiles(event) {
  const files = event.target.files;
  if (files.length) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        addOrReplaceAttachment(file, e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }
}

// Setup drag-and-drop listeners on the given container element
function setupDragAndDrop(container) {
  container.addEventListener('dragover', function(e) {
    e.preventDefault();
    container.style.backgroundColor = '#444';
  });
  container.addEventListener('dragleave', function(e) {
    container.style.backgroundColor = '#3a3a3a';
  });
  container.addEventListener('drop', function(e) {
    e.preventDefault();
    container.style.backgroundColor = '#3a3a3a';
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length) {
      Array.from(droppedFiles).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
          addOrReplaceAttachment(file, e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  });
}

// Function to remove an attachment at a given index
function removeAttachment(index) {
  attachments.splice(index, 1);
  localStorage.setItem('attachments', JSON.stringify(attachments));
  renderAttachmentsList();
}

/* ============================================================
   FILE PREVIEW OVERLAY FUNCTIONS
   ============================================================
*/

// Create and append an overlay element for file preview if not already present
function createPreviewOverlay() {
  if (!document.getElementById('filePreviewOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'filePreviewOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'none';
    overlay.innerHTML = `
  <div id="filePreviewContainer" style="position: relative; margin: 0; padding: 20px; background-color: #2c2c2c; color: #949494; width: 98vw; height: 100vh; overflow: auto;">
    <div id="filePreviewHeader" style="display: flex; justify-content: space-between; align-items: center; margin: 0px 5px">
      <span id="filePreviewTitle" style="font-weight: bold;"></span>
      <button id="filePreviewClose" style="font-size: 16px; cursor: pointer;">Close</button>
    </div>
    <div id="filePreviewContent" style="margin-top: 10px;"></div>
  </div>
`;
    document.body.appendChild(overlay);
    document.getElementById('filePreviewClose').addEventListener('click', hidePreviewOverlay);
  }
}

function showPreviewOverlay() {
  createPreviewOverlay();
  document.getElementById('filePreviewOverlay').style.display = 'block';
}

function hidePreviewOverlay() {
  const overlay = document.getElementById('filePreviewOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.getElementById('filePreviewContent').innerHTML = '';
    const navControls = document.getElementById('pdfNavControls');
    if (navControls) navControls.remove();
  }
}

// Helper: Convert dataURL to ArrayBuffer
function dataURLToArrayBuffer(dataURL) {
  const base64String = dataURL.split(',')[1];
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Render a PDF file using pdf.js with navigation controls
let currentPdf = null;
let currentPage = 1;
function renderPdf(file) {
  showPreviewOverlay();
  const arrayBuffer = dataURLToArrayBuffer(file.data);
  const container = document.getElementById('filePreviewContent');
  container.innerHTML = '';
  pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(pdf => {
    currentPdf = pdf;
    currentPage = 1;
    renderPdfPage(currentPage);
    if (pdf.numPages > 1) {
      addPdfNavigationControls(pdf.numPages);
    }
  }).catch(err => {
    container.innerHTML = `<p>Error loading PDF: ${err.message}</p>`;
  });
}

function renderPdfPage(pageNumber) {
  currentPdf.getPage(pageNumber).then(page => {
    const container = document.getElementById('filePreviewContent');
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: context, viewport: viewport });
    container.appendChild(canvas);
    const pageIndicator = document.getElementById('pdfPageIndicator');
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${currentPage} of ${currentPdf.numPages}`;
    }
  });
}

function addPdfNavigationControls(numPages) {
  const oldNav = document.getElementById('pdfNavControls');
  if (oldNav) oldNav.remove();
  
  const container = document.getElementById('filePreviewContainer');
  const navDiv = document.createElement('div');
  navDiv.id = 'pdfNavControls';
  navDiv.style.display = 'flex';
  navDiv.style.justifyContent = 'center';
  navDiv.style.alignItems = 'center';
  navDiv.style.marginBottom = '10px';
  
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.style.marginRight = '10px';
  prevBtn.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      renderPdfPage(currentPage);
    }
  });
  navDiv.appendChild(prevBtn);
  
  const pageIndicator = document.createElement('span');
  pageIndicator.id = 'pdfPageIndicator';
  pageIndicator.textContent = `Page ${currentPage} of ${numPages}`;
  navDiv.appendChild(pageIndicator);
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.style.marginLeft = '10px';
  nextBtn.addEventListener('click', function() {
    if (currentPage < numPages) {
      currentPage++;
      renderPdfPage(currentPage);
    }
  });
  navDiv.appendChild(nextBtn);
  
  container.appendChild(navDiv);
}

// Render a DOCX file using Mammoth to convert to HTML
function renderDocx(file) {
  showPreviewOverlay();
  const arrayBuffer = dataURLToArrayBuffer(file.data);
  const container = document.getElementById('filePreviewContent');
  container.innerHTML = `<p>Loading DOCX...</p>`;
  mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
    .then(result => {
      container.innerHTML = result.value;
    })
    .catch(err => {
      container.innerHTML = `<p>Error loading DOCX: ${err.message}</p>`;
    });
}

// Render an Excel file using XLSX to convert every sheet to HTML
function renderExcel(file) {
  showPreviewOverlay();
  const arrayBuffer = dataURLToArrayBuffer(file.data);
  const container = document.getElementById('filePreviewContent');
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    // Create a dropdown navigation if there is more than one sheet.
    let navHtml = '';
    if (sheetNames.length > 1) {
      navHtml = `<div style="margin-bottom: 10px;">
                   <label for="excelSheetSelect">Sheet: </label>
                   <select id="excelSheetSelect">
                     ${sheetNames.map((name, index) => `<option value="${index}">${name}</option>`).join('')}
                   </select>
                 </div>`;
    }

    // Define a style block that adds a light grey bottom border to each row
    const styleBlock = `<style>table tr { border-bottom: 1px solid #ddd; background-color: #2c2c2c; color: #949494; }</style>`;

    // Function to render a specific sheet by index
    function renderSheet(sheetIndex) {
      const sheetName = workbook.SheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];
      const htmlString = XLSX.utils.sheet_to_html(worksheet);
      // Render the nav (if any), the style block, and the sheet HTML
      container.innerHTML = navHtml + styleBlock + htmlString;
      // Reattach the dropdown event listener if there is more than one sheet
      if (sheetNames.length > 1) {
        document.getElementById('excelSheetSelect').addEventListener('change', function(e) {
          renderSheet(e.target.value);
        });
      }
    }
    
    // Initially render the first sheet
    renderSheet(0);
  } catch (err) {
    container.innerHTML = `<p>Error loading Excel file: ${err.message}</p>`;
  }
}

// Unified function to render file in overlay based on extension
function renderFileInOverlay(file) {
  // Ensure the overlay is created and visible
  showPreviewOverlay();
  
  const extension = file.name.split('.').pop().toLowerCase();
  // Now that the overlay exists, set the title
  document.getElementById('filePreviewTitle').textContent = file.name;
  
  if (extension === 'pdf') {
    renderPdf(file);
  } else if (['doc', 'docx', 'docm', 'dot', 'dotm'].includes(extension)) {
    renderDocx(file);
  } else if (['csv', 'dbf', 'xls', 'xlsm', 'xlsx', 'xlw', 'xml', 'xps'].includes(extension)) {
    renderExcel(file);
  } else {
    // For unsupported file types, simply display an error message.
    document.getElementById('filePreviewContent').innerHTML = `<p>Unsupported file type for preview.</p>`;
  }
}


// UPDATED: Render attachments list using file icons and preview on click
function renderAttachmentsList() {
  const list = document.getElementById('attachmentsList');
  if (!list) return;
  
  list.innerHTML = "";
  list.style.display = "flex";
  list.style.flexWrap = "wrap";
  list.style.justifyContent = "space-evenly";
  
  attachments.forEach((file, index) => {
    const fileDiv = document.createElement('div');
    fileDiv.className = "attachment-entry";
    fileDiv.style.cursor = "pointer";
    fileDiv.style.margin = "10px";
    fileDiv.style.display = "flex";
    fileDiv.style.flexDirection = "column";
    fileDiv.style.alignItems = "center";
    fileDiv.style.width = "100px";
    fileDiv.style.textAlign = "center";
    fileDiv.style.position = "relative";
    
    const iconImg = document.createElement('img');
    iconImg.src = getFileIcon(file);
    iconImg.style.width = "74px";
    iconImg.style.height = "64px";
    
    const nameDiv = document.createElement('div');
    nameDiv.className = "file-name";
    nameDiv.textContent = file.name;
    nameDiv.style.fontSize = "12px";
    nameDiv.style.marginTop = "5px";
    
    fileDiv.appendChild(iconImg);
    fileDiv.appendChild(nameDiv);
    
    // On click, preview the file in the overlay
    fileDiv.addEventListener("click", function(e) {
      renderFileInOverlay(file);
    });
    
    // Show remove button on hover
    fileDiv.addEventListener("mouseenter", function(e) {
      if (!fileDiv.querySelector('.remove-block')) {
        const removeBtn = document.createElement("div");
        removeBtn.className = "remove-block";
        removeBtn.textContent = "✖";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "2px";
        removeBtn.style.right = "2px";
        removeBtn.style.background = "rgba(255, 0, 0, 0.8)";
        removeBtn.style.color = "white";
        removeBtn.style.padding = "2px 2px";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.display = "block";
        removeBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          removeAttachment(index);
        });
        fileDiv.appendChild(removeBtn);
      }
    });
    
    fileDiv.addEventListener("mouseleave", function() {
      const removeBtn = fileDiv.querySelector('.remove-block');
      if (removeBtn) {
        removeBtn.remove();
      }
    });
    
    list.appendChild(fileDiv);
  });
}


/* ============================================================
   SETUP DRAWER BUTTONS & INITIALIZATION
   ============================================================ */
function setupDrawerButtons() {
  const emailBtn = document.getElementById("emailBtn-0");
  if (emailBtn) {
    emailBtn.addEventListener('click', function() {
      drawerState = "email";
      renderDrawerDisplay();
    });
  }
  const attachmentsBtn = document.getElementById("attachmentsBtn-0");
  if (attachmentsBtn) {
    attachmentsBtn.addEventListener('click', function() {
      drawerState = "attachments";
      renderDrawerDisplay();
    });
  }
  const consoleBtn = document.getElementById("consoleBtn-0");
  if (consoleBtn) {
    consoleBtn.addEventListener('click', function() {
      drawerState = "console";
      renderDrawerDisplay();
    });
  }
}

// Initialization on DOMContentLoaded for attachments and drawer buttons
document.addEventListener("DOMContentLoaded", function() {
  const savedAttachments = localStorage.getItem('attachments');
  if (savedAttachments) {
    attachments = JSON.parse(savedAttachments);
  }
  setupDrawerButtons();
  renderDrawerDisplay();
});

// =====================================================================
// ADDED: Re-attach event listeners for fixed PI personnel row, sponsor search, and budget button
// =====================================================================
document.addEventListener("DOMContentLoaded", function() {
  // Fixed PI personnel row inputs
  const firstPersonnelRow = document.querySelector("#personnelContainer-0 .personnel-row");
  if (firstPersonnelRow) {
    const firstInput = firstPersonnelRow.querySelector(".person-first");
    const lastInput = firstPersonnelRow.querySelector(".person-last");
    const deptInput = firstPersonnelRow.querySelector(".person-dept");
    if (firstInput) firstInput.addEventListener("blur", function() { checkAndUpdatePersonnel(this); });
    if (lastInput) firstInput.addEventListener("blur", function() { checkAndUpdatePersonnel(this); });
    if (deptInput) {
      deptInput.addEventListener("input", function() { searchDept(this, 'deptResults-pi'); });
      deptInput.addEventListener("blur", function() { hideDeptResults('deptResults-pi'); });
    }
  }
  
  // Sponsor search input
  const sponsorSearch = document.getElementById("sponsorSearch-0");
  if (sponsorSearch) {
    sponsorSearch.addEventListener("input", function() { searchSponsor(0); });
  }
  
  // Budget button event listener
  const budgetBtn = document.getElementById("budgetBtn");
  if (budgetBtn) {
    budgetBtn.addEventListener("click", showBudgetPage);
  }

  const personnelPlusBtn = document.querySelector("#personnelContainer-0 .add-plus");
  if (personnelPlusBtn) {
    personnelPlusBtn.addEventListener("click", function() {
      addEmptyPersonnelRow(0);
    });
  }
});

/* ============================================================
   ARCHIVE & CONSOLE FUNCTIONS
   ============================================================ */

// Archives the current sidepanel state
function archiveCurrentProposal() {
  // Gather current form data and display blocks from localStorage
  const formData = localStorage.getItem("sidebarFormData");
  const displayBlocks = localStorage.getItem("sidebarDisplayBlocks");
  const parsedDisplayBlocks = displayBlocks ? JSON.parse(displayBlocks) : {};
  
  // Get the proposal number from the display blocks
  const proposalData = parsedDisplayBlocks["proposalBlockDisplay-0"];
  const currentProposalNumber = proposalData ? proposalData.pn : null;
  
  // Create archive entry with timestamp and current state
  const archiveEntry = {
    timestamp: Date.now(),
    formData: formData ? JSON.parse(formData) : {},
    displayBlocks: parsedDisplayBlocks,
    attachments: attachments
  };

  // Retrieve existing archives
  let archivedProposals = JSON.parse(localStorage.getItem("archivedProposals") || "[]");
  
  // Check if a proposal with the same number already exists
  const existingIndex = currentProposalNumber ? 
    archivedProposals.findIndex(p => 
      p.displayBlocks && 
      p.displayBlocks["proposalBlockDisplay-0"] && 
      p.displayBlocks["proposalBlockDisplay-0"].pn === currentProposalNumber
    ) : -1;
  
  if (existingIndex !== -1) {
    // Overwrite existing proposal
    archivedProposals[existingIndex] = archiveEntry;
  } else {
    // Add as new proposal
    archivedProposals.push(archiveEntry);
  }
  
  // For entries older than the 20 most recent, remove attachments to conserve space
  if (archivedProposals.length > 20) {
    for (let i = 0; i < archivedProposals.length - 20; i++) {
      archivedProposals[i].attachments = null;
    }
  }
  
  // Save updated archives
  localStorage.setItem("archivedProposals", JSON.stringify(archivedProposals));

  // Clear the current sidepanel state
  clearSidePanel();
  
  // Reload to reflect the cleared state
  location.reload();
}

// Delete an archived proposal by its index
function deleteArchivedProposal(index) {
  let archivedProposals = JSON.parse(localStorage.getItem("archivedProposals") || "[]");
  // Remove the proposal at the specified index
  archivedProposals.splice(index, 1);
  // Save the updated array
  localStorage.setItem("archivedProposals", JSON.stringify(archivedProposals));
  // Re-render the console blocks
  renderConsoleBlocks();
}

// Clears the sidepanel state (form data, display blocks, and attachments)
function clearSidePanel() {
  localStorage.removeItem("sidebarFormData");
  localStorage.removeItem("sidebarDisplayBlocks");
  attachments = [];
  localStorage.setItem('attachments', JSON.stringify(attachments));
}

// Loads an archived proposal into the sidepanel by its index in the archivedProposals array
function loadArchivedProposal(archiveIndex) {
  let archivedProposals = JSON.parse(localStorage.getItem("archivedProposals") || "[]");
  if (!archivedProposals[archiveIndex]) return;
  const entry = archivedProposals[archiveIndex];
  
  // Restore state into localStorage
  localStorage.setItem("sidebarFormData", JSON.stringify(entry.formData));
  localStorage.setItem("sidebarDisplayBlocks", JSON.stringify(entry.displayBlocks));
  
  if (entry.attachments) {
    attachments = entry.attachments;
    localStorage.setItem("attachments", JSON.stringify(attachments));
  } else {
    attachments = [];
    localStorage.setItem("attachments", JSON.stringify(attachments));
  }
  
  // Reload to repopulate the UI with restored data
  location.reload();
}

// UPDATED: Render archived proposals in the console drawer-display area
function renderConsoleBlocks() {
  const display = document.querySelector('.drawer-display');
  if (!display) return;
  let archivedProposals = JSON.parse(localStorage.getItem("archivedProposals") || "[]");

  if (archivedProposals.length === 0) {
    display.innerHTML = `<p>No archived proposals</p>`;
    return;
  }
  
  display.innerHTML = ""; // Clear current contents
  
  // Create search container at the top
  const searchContainer = document.createElement("div");
  searchContainer.style.display = "flex";
  searchContainer.style.alignItems = "center";
  searchContainer.style.justifyContent = "center";
  searchContainer.style.marginBottom = "10px";
  searchContainer.style.padding = "5px";
  
  // Create search button with magnifying glass
  const searchBtn = document.createElement("button");
  searchBtn.className = "add-plus";
  searchBtn.innerHTML = '<img src="' + chrome.runtime.getURL('/images/search.svg') + '" alt="Search" style="width:28px;height:28px;">';
  searchBtn.style.marginRight = "5px";
  
  // Create hidden search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search proposals...";
  searchInput.style.display = "none";
  searchInput.style.flex = "1";
  searchInput.style.padding = "5px";
  searchInput.style.backgroundColor = "#3a3a3a";
  searchInput.style.color = "#fff";
  searchInput.style.border = "none";
  searchInput.style.borderRadius = "3px";
  // Set focus style: when focused, change border color to #9b7559
  searchInput.addEventListener("focus", () => {
    searchInput.style.border = "solid 1px #9b7559";
  });
  searchInput.addEventListener("blur", () => {
    searchInput.style.border = "none";
  });
  
  // Toggle search input visibility on button click
  searchBtn.addEventListener("click", () => {
    searchInput.style.display = searchInput.style.display === "none" ? "block" : "none";
    if (searchInput.style.display !== "none") {
      searchInput.focus();
    }
  });
  
  // Add elements to search container
  searchContainer.appendChild(searchBtn);
  searchContainer.appendChild(searchInput);
  display.appendChild(searchContainer);
  
  // Create scrollable container for the console blocks
  const consoleContainer = document.createElement("div");
  consoleContainer.id = "consoleBlocksContainer";
  consoleContainer.style.display = "flex";
  consoleContainer.style.flexDirection = "column";
  consoleContainer.style.alignItems = "center";
  consoleContainer.style.justifyContent = "center";
  consoleContainer.style.gap = "10px";
  consoleContainer.style.overflowY = "auto";
  consoleContainer.style.width = "100%";
  consoleContainer.style.maxHeight = "calc(100% - 50px)"; // Leave room for search
  display.appendChild(consoleContainer);

  // Determine the two colors (background & text) from a .badge element; fallback provided
  let badgeBg = "#9b7559", badgeColor = "#fff";
  const badgeElem = document.querySelector('.badge');
  if (badgeElem) {
    badgeBg = getComputedStyle(badgeElem).backgroundColor;
    badgeColor = getComputedStyle(badgeElem).color;
  }

  // Function to render filtered proposals
  function renderFilteredProposals(proposals) {
    consoleContainer.innerHTML = ""; // Clear existing blocks
    
    if (proposals.length === 0) {
      const noResults = document.createElement("p");
      noResults.textContent = "No matching proposals found";
      noResults.style.color = "#949494";
      noResults.style.textAlign = "center";
      consoleContainer.appendChild(noResults);
      return;
    }
    
    // Render the filtered proposals
    proposals.forEach((entry, index) => {
      const proposalData = entry.displayBlocks ? entry.displayBlocks["proposalBlockDisplay-0"] : null;
      const proposalNum = proposalData ? proposalData.pn || "N/A" : "N/A";
      const proposalTitle = proposalData ? proposalData.title || "Untitled" : "Untitled";
      const dateStr = new Date(entry.timestamp).toLocaleString();

      // Create the block container
      const block = document.createElement("div");
      block.className = "display-block";
      block.style.backgroundColor = badgeBg;
      block.style.color = badgeColor;
      block.style.width = "90%";
      block.style.cursor = "pointer";
      block.style.padding = "10px";
      block.style.boxSizing = "border-box";
      block.style.position = "relative"; // For delete button positioning
      
      // Create an info section for proposal number and title
      const infoDiv = document.createElement("div");
      infoDiv.style.textAlign = "center";
      infoDiv.style.fontSize = "18px";
      infoDiv.style.fontWeight = "normal";
      infoDiv.textContent = `${proposalNum} - ${proposalTitle}`;
      
      // Timestamp in a smaller font below
      const timeDiv = document.createElement("div");
      timeDiv.style.textAlign = "center";
      timeDiv.style.fontSize = "10px";
      timeDiv.style.marginTop = "5px";
      timeDiv.textContent = dateStr;
      
      block.appendChild(infoDiv);
      block.appendChild(timeDiv);
      
      // Add delete button (X) to the corner
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "remove-block";
      deleteBtn.textContent = "×";
      deleteBtn.style.position = "absolute";
      deleteBtn.style.top = "5px";
      deleteBtn.style.right = "5px";
      deleteBtn.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "50%";
      deleteBtn.style.width = "20px";
      deleteBtn.style.height = "20px";
      deleteBtn.style.lineHeight = "18px";
      deleteBtn.style.textAlign = "center";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.display = "none"; // Initially hidden, show on hover
      
      // Show delete button on hover
      block.addEventListener("mouseenter", () => {
        deleteBtn.style.display = "block";
      });
      
      block.addEventListener("mouseleave", () => {
        deleteBtn.style.display = "none";
      });
      
      // Delete button click handler
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the block's click event
        // Confirm before deleting
        if (confirm(`Delete proposal ${proposalNum}?`)) {
          deleteArchivedProposal(archivedProposals.length - 1 - index);
        }
      });
      
      block.appendChild(deleteBtn);
      
      // When clicked, load this archived proposal
      block.addEventListener("click", () => loadArchivedProposal(archivedProposals.length - 1 - index));
      consoleContainer.appendChild(block);
    });
  }
  
  // Initial render of all proposals (most recent first)
  const reversedProposals = [...archivedProposals].reverse();
  renderFilteredProposals(reversedProposals);
  
  // Filter proposals when search input changes
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
      renderFilteredProposals(reversedProposals);
      return;
    }
    
    const filtered = reversedProposals.filter(entry => {
      const proposalData = entry.displayBlocks ? entry.displayBlocks["proposalBlockDisplay-0"] : null;
      if (!proposalData) return false;
      
      const proposalNum = (proposalData.pn || "").toLowerCase();
      const proposalTitle = (proposalData.title || "").toLowerCase();
      
      return proposalNum.includes(searchTerm) || proposalTitle.includes(searchTerm);
    });
    
    renderFilteredProposals(filtered);
  });
}

/* ============================================================
   EXTENDED DRAWER DISPLAY FUNCTION
   ============================================================ */
function renderDrawerDisplay() {
    const display = document.querySelector('.drawer-display');
    if (!display) return;

    if (drawerState === "attachments") {
        display.innerHTML = `
      <div class="attachments-container">
        <button id="addAttachmentBtn" class="add-plus">＋</button>
        <div id="attachmentsList"></div>
        <input type="file" id="attachmentInput" style="display:none" multiple>
      </div>
    `;
        document.getElementById('addAttachmentBtn').addEventListener('click', () => {
            document.getElementById('attachmentInput').click();
        });
        document.getElementById('attachmentInput').addEventListener('change', handleFiles);
        setupDragAndDrop(display);
        renderAttachmentsList();
    } else if (drawerState === "email") {
        display.innerHTML = `<p style="text-align: center;">No recent conversations</p>`;
    } else if (drawerState === "console") {
        // Render archived proposals with updated console blocks
        renderConsoleBlocks();
    }
}

/* ============================================================
   SETUP DRAWER BUTTONS & INITIALIZATION
   ============================================================ */
function setupDrawerButtons() {
  const emailBtn = document.getElementById("emailBtn-0");
  if (emailBtn) {
    emailBtn.addEventListener('click', function() {
      drawerState = "email";
      renderDrawerDisplay();
    });
  }
  const attachmentsBtn = document.getElementById("attachmentsBtn-0");
  if (attachmentsBtn) {
    attachmentsBtn.addEventListener('click', function() {
      drawerState = "attachments";
      renderDrawerDisplay();
    });
  }
  const consoleBtn = document.getElementById("consoleBtn-0");
  if (consoleBtn) {
    consoleBtn.addEventListener('click', function() {
      drawerState = "console";
      renderDrawerDisplay();
    });
  }
}

// Initialization on DOMContentLoaded for attachments, drawer buttons, and Archive button listener
document.addEventListener("DOMContentLoaded", function() {
  const savedAttachments = localStorage.getItem('attachments');
  if (savedAttachments) {
    attachments = JSON.parse(savedAttachments);
  }
  setupDrawerButtons();
  renderDrawerDisplay();

  // Add Archive button listener
  const archiveBtn = document.getElementById("archiveBtn");
  if (archiveBtn) {
    archiveBtn.addEventListener("click", archiveCurrentProposal);
  }
});

