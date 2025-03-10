/* ============================================================
   SAVE & LOAD FUNCTIONS FOR FORM DATA
   ============================================================ */

// Function to save all inputs into localStorage
function saveAllFormData() {
  const formData = {};

  document.querySelectorAll("input, textarea, select").forEach(input => {
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

// Ensure script runs only after the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadAllFormData(); // Load saved data when the panel opens

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
    removeBtn.addEventListener("click", () => removeProposalBlock(cardIndex));
    block.appendChild(removeBtn);
  
    // Insert the block into the DOM and hide the input section
    const container = document.getElementById(`proposalBlockContainer-${cardIndex}`);
    container.innerHTML = "";
    container.appendChild(block);
    document.getElementById(`proposalInputs-${cardIndex}`).style.display = "none";
  }
  
  function removeProposalBlock(cardIndex) {
    document.getElementById(`proposalBlockContainer-${cardIndex}`).innerHTML = "";
    document.getElementById(`proposalInputs-${cardIndex}`).style.display = "block";
  }
  
  ["proposalNumber", "projectStart", "projectEnd", "proposalTitle", "totalDirect", "totalIndirect", "totalCost"].forEach(field => {
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
    removeBtn.addEventListener("click", () => removePersonnelBlock(removeBtn));
    block.appendChild(removeBtn);
    
    // Insert the personnel block before the current row and remove the row
    row.parentNode.insertBefore(block, row);
    row.remove();
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
    // Set the inner HTML for badges and sponsor name
    block.innerHTML = badgesHTML + `<div class="block-content sponsor-name">${sponsor["Sponsor Name"]}</div>`;
    
    // Create remove button and attach event listener
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-block');
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function() {
        removeSponsor(cardIndex);
    });
    block.appendChild(removeBtn);
    sponsorDisplay.appendChild(block);
    document.getElementById(`sponsorResults-${cardIndex}`).innerHTML = "";
    document.getElementById(`sponsorSearch-${cardIndex}`).value = "";
  }
  
  function removeSponsor(cardIndex) {
    document.getElementById(`sponsorSelected-${cardIndex}`).innerHTML = "";
    document.getElementById(`sponsorSection-${cardIndex}`).style.display = "block";
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
     DUMMY BOTTOM DRAWER FUNCTIONS
     ============================================================ */
  function openEmail(cardIndex) { alert("Opening email view for card " + cardIndex); }
  function openAttachments(cardIndex) { alert("Opening attachments for card " + cardIndex); }
  function openConsole(cardIndex) { alert("Opening console log for card " + cardIndex); }
  
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
      selectElem.style.Color = "#949494"
      selectElem.style.backgroundColor = "#3a3a3a" 
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
      descriptionInput.style.backgroundColor = "#949494"
      descriptionInput.style.backgroundColor = "#3a3a3a"
      descriptionInput.placeholder = "Description";
      descriptionInput.addEventListener("blur", function() { updateSectionTotal(section); });
      containerDiv.appendChild(descriptionInput);
      
      const amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.style.backgroundColor = "#3a3a3a"
      amountInput.style.Color = "#949494"
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
     Attach Event Listeners for Static Elements on DOMContentLoaded
     ============================================================ */
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
    
    // Add-plus button for adding a personnel row
    const addPlusBtn = document.querySelector("#personnelContainer-0 .add-plus");
    if (addPlusBtn) {
        addPlusBtn.addEventListener("click", function() { addEmptyPersonnelRow(0); });
    }
    
    // Sponsor search input
    const sponsorSearch = document.getElementById("sponsorSearch-0");
    if (sponsorSearch) {
        sponsorSearch.addEventListener("input", function() { searchSponsor(0); });
    }
    
    // Drawer buttons
    const emailBtn = document.getElementById("emailBtn-0");
    if (emailBtn) emailBtn.addEventListener("click", function() { openEmail(0); });
    
    const attachmentsBtn = document.getElementById("attachmentsBtn-0");
    if (attachmentsBtn) attachmentsBtn.addEventListener("click", function() { openAttachments(0); });
    
    const consoleBtn = document.getElementById("consoleBtn-0");
    if (consoleBtn) consoleBtn.addEventListener("click", function() { openConsole(0); });
    
    // Budget button
    const budgetBtn = document.getElementById("budgetBtn");
    if (budgetBtn) budgetBtn.addEventListener("click", showBudgetPage);
    
    // Back button on budget page
    const backBtn = document.getElementById("backBtn-0");
    if (backBtn) backBtn.addEventListener("click", function() { switchCardPage(0, 1); });
    
    // Budget section add row buttons
    const addBudgetPersonnel = document.getElementById("addBudgetRow-Personnel");
    if (addBudgetPersonnel) addBudgetPersonnel.addEventListener("click", function() { addBudgetRow("Personnel"); });
    
    const addBudgetEquipment = document.getElementById("addBudgetRow-Equipment");
    if (addBudgetEquipment) addBudgetEquipment.addEventListener("click", function() { addBudgetRow("Equipment"); });
    
    const addBudgetTravel = document.getElementById("addBudgetRow-Travel");
    if (addBudgetTravel) addBudgetTravel.addEventListener("click", function() { addBudgetRow("Travel"); });
    
    const addBudgetParticipantSupport = document.getElementById("addBudgetRow-ParticipantSupport");
    if (addBudgetParticipantSupport) addBudgetParticipantSupport.addEventListener("click", function() { addBudgetRow("ParticipantSupport"); });
    
    const addBudgetOtherDirect = document.getElementById("addBudgetRow-OtherDirect");
    if (addBudgetOtherDirect) addBudgetOtherDirect.addEventListener("click", function() { addBudgetRow("OtherDirect"); });
  });
  