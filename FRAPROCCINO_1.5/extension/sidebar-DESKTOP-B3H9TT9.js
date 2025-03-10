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
        const pn = document.getElementById(`proposalNumber-${cardIndex}`).value.trim();
        const start = document.getElementById(`projectStart-${cardIndex}`).value;
        const end = document.getElementById(`projectEnd-${cardIndex}`).value;
        const title = document.getElementById(`proposalTitle-${cardIndex}`).value.trim();
        const direct = document.getElementById(`totalDirect-${cardIndex}`).value;
        const indirect = document.getElementById(`totalIndirect-${cardIndex}`).value;
        const total = document.getElementById(`totalCost-${cardIndex}`).value;
        const blockHTML = `
          <div class="display-block" id="proposalBlockDisplay-${cardIndex}">
            <div class="block-header">
              <span class="badge">${formatDate(start)}</span>
              <span class="badge">${pn}</span>
              <span class="badge">${formatDate(end)}</span>
            </div>
            <div class="block-content">${title}</div>
            <div class="block-footer">
              <span class="badge">${formatDollar(direct)} Direct</span>
              <span class="badge">${formatDollar(indirect)} Indirect</span>
              <span class="badge">${formatDollar(total)} Total</span>
            </div>
            <button class="remove-block" onclick="removeProposalBlock(${cardIndex})">×</button>
          </div>
        `;
        document.getElementById(`proposalBlockContainer-${cardIndex}`).innerHTML = blockHTML;
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
  
         // Load the JSON data and initialize sponsor search
         00000547
      .then(response => response.json())
      .then(data => {
          // Extract sponsor data from json file.
          allSponsors = data.sponsors;
          //add a type field to each entry
          allSponsors.forEach(sponsor => {
              sponsor["Sponsor Type"] = "";
              if (sponsor["CFDA"] !== "") {
                  sponsor["Sponsor Type"] = "Federal";
              }
          });
          //get department options
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
          // Get the data attribute storing the full dept name with the number
          const fullDeptName = deptInput.dataset.fullDeptName || dept; // Use the data attribute value or fallback to the input value
          const deptTrimmed = fullDeptName.split("-")[0].trim();
        const blockHTML = `
          <div class="display-block personnel-block">
            <div class="block-header">
              <span class="badge">${role}</span>
              <span class="badge">${deptTrimmed}</span>
            </div>
            <div class="block-content">${first} ${last}</div>
            <button class="remove-block" onclick="removePersonnelBlock(this)">×</button>
          </div>
        `;
        row.insertAdjacentHTML('beforebegin', blockHTML);
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
        const uniqueId = Math.random(); // Generate a unique ID for the department results div
        row.innerHTML = `
          <div class="name-row">
            <input type="text" class="person-first" style="width: 50%" placeholder="First" onblur="checkAndUpdatePersonnel(this)">
            <input type="text" class="person-last" style="width: 50%" placeholder="Last" onblur="checkAndUpdatePersonnel(this)">
          </div>
          <div class="role-row">
            <select class="person-role" onblur="checkAndUpdatePersonnel(this)" onchange="checkAndUpdatePersonnel(this)">
              <option value="">Select Role</option>
              <option value="CoPI">CoPI</option>
              <option value="Key Person">Key Person</option>
            </select>
            <div class="dept-wrapper" style="flex:1;">
                <input type="text" class="person-dept" placeholder="Dept." oninput="searchDept(this, 'deptResults-${uniqueId}')" onblur="hideDeptResults('deptResults-${uniqueId}')">
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
         let allSponsors = []; // Global variable to hold the loaded sponsor data
  
  // Load the JSON data and initialize sponsor search
  fetch('../data/updated_streamlyne_map.json')
      .then(response => response.json())
      .then(data => {
          // Extract sponsor data from json file.
          allSponsors = data.sponsors;
          //add a type field to each entry
          allSponsors.forEach(sponsor => {
              sponsor["Sponsor Type"] = "";
              if (sponsor["CFDA"] !== ""){
                  sponsor["Sponsor Type"] = "Federal";
              }
          });
      })
      .catch(error => console.error('Error loading sponsors JSON:', error));
  
  function searchSponsor(cardIndex) {
      const inputVal = document.getElementById(`sponsorSearch-${cardIndex}`).value.toLowerCase();
      const resultsDiv = document.getElementById(`sponsorResults-${cardIndex}`);
      resultsDiv.innerHTML = ""; // Clear previous results
  
      if (!inputVal) return; // Nothing to search
  
      const matches = allSponsors.filter(sponsor => {
          // Ensure properties exist and convert to lowercase for comparison
          const name = (sponsor["Sponsor Name"] || "").toLowerCase();
          const code = (sponsor["Sponsor Code"] || "").toString().toLowerCase();
          const banner = (sponsor["Banner ID"] || "").toLowerCase();
  
          return name.includes(inputVal) || code.includes(inputVal) || banner.includes(inputVal);
      });
  
      if (matches.length === 0) {
          //display no results message
          const noResults = document.createElement('div');
          noResults.style.padding = "3px";
          noResults.textContent = "No Results";
          resultsDiv.appendChild(noResults);
      } else {
          // Display the matching results
          matches.forEach(sponsor => {
              const div = document.createElement('div');
              div.style.cursor = "pointer";
              div.style.padding = "3px";
              div.style.borderBottom = "1px solid #ddd";
              div.textContent = sponsor["Sponsor Name"];
              div.onclick = function() {
                  selectSponsor(cardIndex, sponsor);
              };
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
      removeBtn.onclick = function() {
          removeSponsor(cardIndex);
      };
  
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
     PERSONNEL SECTION FUNCTIONS (Page 1)
     ============================================================ */
     let allDepartments = []; // Global array for all departments.
  
      function checkAndUpdatePersonnel(inputElem) {
          setTimeout(() => {
              const row = inputElem.closest('.personnel-row');
              if (!row) return;
              const first = row.querySelector('.person-first').value.trim();
              const last = row.querySelector('.person-last').value.trim();
              const deptInput = row.querySelector('.person-dept');
              const dept = deptInput.value.trim();
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
          // Get the data attribute storing the full dept name with the number
          const fullDeptName = deptInput.dataset.fullDeptName || dept; // Use the data attribute value or fallback to the input value
          const deptTrimmed = fullDeptName.split("-")[0].trim();
          const blockHTML = `
            <div class="display-block personnel-block">
              <div class="block-header">
                <span class="badge">${role}</span>
                <span class="badge">${deptTrimmed}</span>
              </div>
              <div class="block-content">${first} ${last}</div>
              <button class="remove-block" onclick="removePersonnelBlock(this)">×</button>
            </div>
          `;
          row.insertAdjacentHTML('beforebegin', blockHTML);
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
          const uniqueId = Math.random(); // Generate a unique ID for the department results div
          row.innerHTML = `
            <div class="name-row">
              <input type="text" class="person-first" style="width: 50%" placeholder="First" onblur="checkAndUpdatePersonnel(this)">
              <input type="text" class="person-last" style="width: 50%" placeholder="Last" onblur="checkAndUpdatePersonnel(this)">
            </div>
            <div class="role-row">
              <select class="person-role" onblur="checkAndUpdatePersonnel(this)" onchange="checkAndUpdatePersonnel(this)">
                <option value="">Select Role</option>
                <option value="CoPI">CoPI</option>
                <option value="Key Person">Key Person</option>
              </select>
              <div class="dept-wrapper" style="flex:1;">
                <input type="text" class="person-dept" placeholder="Dept." oninput="searchDept(this, 'deptResults-${uniqueId}')" onblur="hideDeptResults('deptResults-${uniqueId}')">
                <div class="dept-results" id="deptResults-${uniqueId}"></div>
              </div>
            </div>
          `;
          const plusBtn = document.querySelector("#personnelContainer-0 .add-plus");
          container.insertBefore(row, plusBtn);
      }
  
      //Department search functionality
      function searchDept(inputElement, resultsDivId) {
          const inputVal = inputElement.value.toLowerCase();
          const resultsDiv = document.getElementById(resultsDivId);
          resultsDiv.innerHTML = ""; // Clear previous results
  
          if (!inputVal) {
              return; // Nothing to search
          }
  
          const matches = allDepartments.filter(dept =>
              dept.departmentName.toLowerCase().includes(inputVal)
          );
          if (matches.length === 0) {
              //display no results message
              const noResults = document.createElement('div');
              noResults.style.padding = "3px";
              noResults.textContent = "No Results";
              resultsDiv.appendChild(noResults);
          } else {
              // Display the matching results
              matches.forEach(dept => {
                  const div = document.createElement('div');
                  div.style.cursor = "pointer";
                  div.style.padding = "3px";
                  div.style.borderBottom = "1px solid #ddd";
                  div.textContent = dept.departmentName.split("-")[0].trim(); // Display only the department name, not the number
                  div.onclick = function() {
                      selectDept(inputElement, resultsDivId, dept);
                  };
                  resultsDiv.appendChild(div);
              });
          }
      }
  
      function selectDept(inputElement, resultsDivId, dept) {
          inputElement.value = dept.departmentName; // Set the full department name including number
          inputElement.dataset.fullDeptName = dept.departmentName; // Store the full name in a data attribute
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
         Note: The following functions implement basic placeholders.
         TODO:
           - Dynamically generate period buttons based on the proposal start and end dates.
           - Populate each period with personnel rows from period 1 and propagate additional personnel rows added in period 1.
           - For non-personnel sections, when a row is completed in period 1, propagate the name/description to later periods (with an empty amount).
           - Convert completed input rows into finalized table rows and calculate per-section totals.
           - Implement aggregation for the "Total" period.
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
          btn.onclick = function() { showBudgetPeriod(index + 1); };
          periodButtonsDiv.appendChild(btn);
        });
        const totalBtn = document.createElement("button");
        totalBtn.textContent = "Total";
        totalBtn.onclick = function() { showBudgetPeriod("Total"); };
        periodButtonsDiv.appendChild(totalBtn);
        
        // Default: show period 1
        showBudgetPeriod(1);
        // Populate Personnel section from page 1
        populatePersonnelFromPage1();
        // TODO: Initialize non-personnel sections similarly if needed.
      }
      
      function showBudgetPeriod(period) {
        // Placeholder function: implement switching logic for budget periods.
        console.log("Switched to period", period);
        // TODO: When switching from period 1 to a later period, clone rows from period 1.
      }
      
      function populatePersonnelFromPage1() {
        // Get personnel display blocks from page 1 and populate budget Personnel section.
        const personnelBlocks = document.querySelectorAll("#personnelContainer-0 .display-block.personnel-block");
        const contentDiv = document.getElementById("content-Personnel");
        contentDiv.innerHTML = "";
        personnelBlocks.forEach(block => {
          const text = block.querySelector(".block-content").textContent.trim();        
          // Assume last name is the last word
          const parts = text.split(" ");
          const lastName = parts[parts.length - 1];        
          const row = document.createElement("div");
          row.classList.add("budget-row");
          row.innerHTML = `
            <span>${lastName}</span>
            <input type="number" placeholder="Salary" onblur="updateLineTotal(this)">
            <input type="number" placeholder="Fringe" onblur="updateLineTotal(this)">
            <span class="line-total"></span>
            <span class="remove-budget-row" onclick="removeBudgetRow(this)">×</span>
          `;
          contentDiv.appendChild(row);
        });
        // Save period 1 content for propagation
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
          row.innerHTML = `
            <input type="text" placeholder="Last Name" onblur="updateLineTotal(this)" style="background: #3a3a3a; color: #949494;">
            <input type="number" placeholder="Salary" onblur="updateLineTotal(this)" style="background: #3a3a3a; color: #949494;">
            <input type="number" placeholder="Fringe" onblur="updateLineTotal(this)" style="background: #3a3a3a; color: #949494;">
            <span class="line-total"></span>
            <span class="remove-budget-row" onclick="removeBudgetRow(this)">×</span>
          `;
        } else {
          row.innerHTML = `<div style="display:flex; flex-direction:row; width:100%;">
            <select onchange="updateSectionTotal('${section}')">
              <option value="">Select Type</option>
              <option value="Option1">${section} Option 1</option>
              <option value="Option2">${section} Option 2</option>
            </select>
            <input type="text" placeholder="Description" onblur="updateSectionTotal('${section}')">
            <input type="number" placeholder="Amount" onblur="updateSectionTotal('${section}')">
            <span class="remove-budget-row" onclick="removeBudgetRow(this)">×</span></div>
          `;
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
    