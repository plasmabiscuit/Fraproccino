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
      badgesHTML += `<span class="badge"><input type="text" id="cfda-0" placeholder="CFDA" style="width:50px; font-size:0.7em; border:none; background:transparent;"></span>`;
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
  
  // Default: show period 1
  showBudgetPeriod(1);
  // Populate Personnel section from page 1
  populatePersonnelFromPage1();
}

function showBudgetPeriod(period) {
  console.log("Switched to period", period);
  // TODO: Clone rows from period 1 when switching periods.
}

function populatePersonnelFromPage1() {
  const personnelBlocks = document.querySelectorAll("#personnelContainer-0 .display-block.personnel-block");
  const contentDiv = document.getElementById("content-Personnel");
  contentDiv.innerHTML = "";
  personnelBlocks.forEach(block => {
    const text = block.querySelector(".block-content").textContent.trim();
    const parts = text.split(" ");
    const lastName = parts[parts.length - 1];
    
    // Create a budget row for personnel
    const row = document.createElement("div");
    row.classList.add("budget-row");
    
    const nameSpan = document.createElement("span");
    nameSpan.textContent = lastName;
    row.appendChild(nameSpan);
    
    const salaryInput = document.createElement("input");
    salaryInput.type = "number";
    salaryInput.placeholder = "Salary";
    salaryInput.addEventListener("blur", function() { updateLineTotal(salaryInput); });
    salaryInput.style.background = "#3a3a3a";
    salaryInput.style.color = "#949494";
    row.appendChild(salaryInput);
    
    const fringeInput = document.createElement("input");
    fringeInput.type = "number";
    fringeInput.placeholder = "Fringe";
    fringeInput.addEventListener("blur", function() { updateLineTotal(fringeInput); });
    fringeInput.style.background = "#3a3a3a";
    fringeInput.style.color = "#949494";
    row.appendChild(fringeInput);
    
    const lineTotalSpan = document.createElement("span");
    lineTotalSpan.className = "line-total";
    row.appendChild(lineTotalSpan);
    
    const removeSpan = document.createElement("span");
    removeSpan.className = "remove-budget-row";
    removeSpan.textContent = "×";
    removeSpan.addEventListener("click", function() { removeBudgetRow(removeSpan); });
    row.appendChild(removeSpan);
    
    contentDiv.appendChild(row);
  });
  contentDiv.setAttribute("data-period1", contentDiv.innerHTML);
  updateSectionTotal("Personnel");
}

function updateLineTotal(inputElem) {
  const row = inputElem.closest(".budget-row");
  const salary = parseFloat(row.children[1].value) || 0;
  const fringe = parseFloat(row.children[2].value) || 0;
  const total = salary + fringe;
  row.querySelector(".line-total").textContent = total > 0 ? total.toFixed(2) : "";
  updateSectionTotal("Personnel");
}

function removeBudgetRow(btn) {
  const row = btn.closest(".budget-row");
  row.remove();
  const section = row.parentElement.id.split("-")[1];
  updateSectionTotal(section);
}

function addBudgetRow(section) {
  const contentDiv = document.getElementById("content-" + section);
  let row = document.createElement("div");
  row.classList.add("budget-row");
  if (section === "Personnel") {
    // Build personnel budget row elements
    const lastNameInput = document.createElement("input");
    lastNameInput.type = "text";
    lastNameInput.placeholder = "Last Name";
    lastNameInput.style.background = "#3a3a3a";
    lastNameInput.style.color = "#949494";
    lastNameInput.addEventListener("blur", function() { updateLineTotal(lastNameInput); });
    row.appendChild(lastNameInput);
    
    const salaryInput = document.createElement("input");
    salaryInput.type = "number";
    salaryInput.placeholder = "Salary";
    salaryInput.style.background = "#3a3a3a";
    salaryInput.style.color = "#949494";
    salaryInput.addEventListener("blur", function() { updateLineTotal(salaryInput); });
    row.appendChild(salaryInput);
    
    const fringeInput = document.createElement("input");
    fringeInput.type = "number";
    fringeInput.placeholder = "Fringe";
    fringeInput.style.background = "#3a3a3a";
    fringeInput.style.color = "#949494";
    fringeInput.addEventListener("blur", function() { updateLineTotal(fringeInput); });
    row.appendChild(fringeInput);
    
    const lineTotalSpan = document.createElement("span");
    lineTotalSpan.className = "line-total";
    row.appendChild(lineTotalSpan);
    
    const removeSpan = document.createElement("span");
    removeSpan.className = "remove-budget-row";
    removeSpan.textContent = "×";
    removeSpan.addEventListener("click", function() { removeBudgetRow(removeSpan); });
    row.appendChild(removeSpan);
  } else {
    // Build non-personnel budget row elements
    const containerDiv = document.createElement("div");
    containerDiv.style.display = "flex";
    containerDiv.style.flexDirection = "column";
    containerDiv.style.width = "328px";
    containerDiv.style.color = "#949494";

    const selectElem = document.createElement("select");
    selectElem.addEventListener("change", function() { updateSectionTotal(section); });
    let option1 = document.createElement("option");
    option1.value = "";
    option1.textContent = "Select Type";
    selectElem.appendChild(option1);
    let option2 = document.createElement("option");
    option2.value = "Option1";
    option2.textContent = section + " Option 1";
    selectElem.appendChild(option2);
    let option3 = document.createElement("option");
    option3.value = "Option2";
    option3.textContent = section + " Option 2";
    selectElem.appendChild(option3);
    containerDiv.appendChild(selectElem);
    
    const descriptionInput = document.createElement("input");
    descriptionInput.type = "text";
    descriptionInput.placeholder = "Description";
    descriptionInput.addEventListener("blur", function() { updateSectionTotal(section); });
    containerDiv.appendChild(descriptionInput);
    
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.placeholder = "Amount";
    amountInput.addEventListener("blur", function() { updateSectionTotal(section); });
    containerDiv.appendChild(amountInput);
    
    const removeSpan = document.createElement("span");
    removeSpan.className = "remove-budget-row";
    removeSpan.textContent = "×";
    removeSpan.addEventListener("click", function() { removeBudgetRow(removeSpan); });
    containerDiv.appendChild(removeSpan);
    
    row.appendChild(containerDiv);
  }
  contentDiv.appendChild(row);
  updateSectionTotal(section);
}

function updateSectionTotal(section) {
  const contentDiv = document.getElementById("content-" + section);
  let total = 0;
  const rows = contentDiv.querySelectorAll(".budget-row");
  rows.forEach(row => { 
    if (section === "Personnel") {
      const lineTotal = parseFloat(row.querySelector(".line-total").textContent) || 0;
      total += lineTotal;
    } else {
      const amount = parseFloat(row.children[2].value) || 0;
      total += amount;
    }
  });
  document.getElementById("total-" + section).textContent = "Total: " + total.toFixed(2);
}


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
    display.innerHTML = `<p>No logs to display</p>`;
  }
}

// Function to handle file selection from the hidden input
function handleFiles(event) {
  const files = event.target.files;
  if (files.length) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        attachments.push({ name: file.name, type: file.type, data: e.target.result });
        localStorage.setItem('attachments', JSON.stringify(attachments));
        renderAttachmentsList();
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
          attachments.push({ name: file.name, type: file.type, data: e.target.result });
          localStorage.setItem('attachments', JSON.stringify(attachments));
          renderAttachmentsList();
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
  <div id="filePreviewContainer" style="position: relative; margin: 0; padding: 20px; background: #fff; color: black; width: 98vw; height: 100vh; overflow: auto;">
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
  navDiv.style.marginTop = '10px';
  
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
    const styleBlock = `<style>
      table tr { border-bottom: 1px solid #ddd; }
    </style>`;

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
   ============================================================
*/
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
    if (lastInput) lastInput.addEventListener("blur", function() { checkAndUpdatePersonnel(this); });
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
});
