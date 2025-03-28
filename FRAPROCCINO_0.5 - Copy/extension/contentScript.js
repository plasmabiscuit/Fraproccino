(async function () {
  console.log("Content script running for extraction overlay");

  // Load mapping.json from the extension's /data folder.
  let mapping;
  try {
    const response = await fetch(chrome.runtime.getURL('data/mapping.json'));
    mapping = await response.json();
  } catch (err) {
    console.error("Error loading mapping.json:", err);
    return;
  }

  // Normalize strings for robust comparisons.
  function normalize(str) {
    return str.replace(/[\s\-\:]+/g, "").toLowerCase();
  }

  // Helper function to extract a field's value.
  function getFieldValue(map) {
    const normQuery = normalize(map.query);
    const fields = document.querySelectorAll("input, select, textarea");
    for (const field of fields) {
      let siblingLabel = field.nextElementSibling;
      if (siblingLabel && siblingLabel.tagName.toLowerCase() === "label") {
        if (normalize(siblingLabel.textContent).includes(normQuery)) {
          let value =
            field.tagName.toLowerCase() === "select"
              ? field.options[field.selectedIndex]?.text || ""
              : field.value || "";
          const desc = map.description.toLowerCase();
          if (desc === "pi first" || desc === "copi first") {
            const parts = value.trim().split(/\s+/);
            return parts[0] || value;
          } else if (desc === "pi last" || desc === "copi last") {
            const parts = value.trim().split(/\s+/);
            return parts.length > 1 ? parts.slice(1).join(" ") : value;
          } else {
            return value.trim();
          }
        }
      }
    }
    // Fallback: search for any label whose normalized text includes the query.
    const labels = document.querySelectorAll("label");
    for (const label of labels) {
      if (normalize(label.textContent).includes(normQuery)) {
        let prevField = label.previousElementSibling;
        if (prevField && ["input", "select", "textarea"].includes(prevField.tagName.toLowerCase())) {
          let value =
            prevField.tagName.toLowerCase() === "select"
              ? prevField.options[prevField.selectedIndex]?.text || ""
              : prevField.value || "";
          const desc = map.description.toLowerCase();
          if (desc === "pi first" || desc === "copi first") {
            const parts = value.trim().split(/\s+/);
            return parts[0] || value;
          } else if (desc === "pi last" || desc === "copi last") {
            const parts = value.trim().split(/\s+/);
            return parts.length > 1 ? parts.slice(1).join(" ") : value;
          } else {
            return value.trim();
          }
        }
        let nextField = label.nextElementSibling;
        if (nextField && ["input", "select", "textarea"].includes(nextField.tagName.toLowerCase())) {
          let value =
            nextField.tagName.toLowerCase() === "select"
              ? nextField.options[nextField.selectedIndex]?.text || ""
              : nextField.value || "";
          const desc = map.description.toLowerCase();
          if (desc === "pi first" || desc === "copi first") {
            const parts = value.trim().split(/\s+/);
            return parts[0] || value;
          } else if (desc === "pi last" || desc === "copi last") {
            const parts = value.trim().split(/\s+/);
            return parts.length > 1 ? parts.slice(1).join(" ") : value;
          } else {
            return value.trim();
          }
        }
      }
    }
    return "";
  }

  // Helper to parse a number from a string (removing commas).
  function parseNumber(str) {
    if (!str) return NaN;
    return parseFloat(str.replace(/,/g, ""));
  }

  // Function to create and display the extraction overlay and modal.
  function launchExtractionOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "extractionOverlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "transparent",
      zIndex: "9999999"
    });

    const modalContent = document.createElement("div");
    modalContent.id = "extractionModalContent";
    modalContent.classList.add("myModal");
    modalContent.style.borderImage = `url(${chrome.runtime.getURL('images/border.png')})`;
    modalContent.style.borderImageSlice = "16";
    modalContent.style.borderImageRepeat = "repeat";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "0px";
    modalContent.style.maxWidth = "90%";
    modalContent.style.maxHeight = "90%";
    modalContent.style.overflow = "auto";
    Object.assign(modalContent.style, {
      position: "absolute",
      top: "50%",
      left: "65%",
      transform: "translate(-50%, -50%)"
    });

    const form = document.createElement("form");
    form.id = "extractionForm";

    mapping.forEach((map, index) => {
      const fieldDiv = document.createElement("div");
      fieldDiv.style.marginBottom = "5px";
      fieldDiv.style.fontFamily = "VT323, monospace";
      fieldDiv.style.color = "transparent";
      fieldDiv.style.display = "flex";
      fieldDiv.style.alignItems = "center";

      const label = document.createElement("label");
      label.textContent = map.description + ": ";
      label.classList.add("name-label");
      label.style.display = "space-between";
      label.style.width = "115px";
      label.classList.add("name-box");
      label.style.backgroundImage = `url(${chrome.runtime.getURL('images/item-3.png')})`;
      label.style.backgroundRepeat = "no-repeat";
      label.style.backgroundSize = "cover";
      const input = document.createElement("input");
      input.type = "text";
      input.classList.add("extraction-field");
      input.style.fontFamily = "VT323, monospace";
      input.style.paddingLeft = "5px";
      input.style.color = "##ffffff";
      input.id = "extractionField_" + index;
      input.style.width = "150px";
      input.value = getFieldValue(map);

      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      form.appendChild(fieldDiv);
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.classList.add("copy-button");
    copyButton.textContent = "Ex-pour-t to Excel";
    copyButton.style.marginRight = "10px";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("cancel-button");
    closeButton.textContent = "Cancel";

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("mybutton-container");
    buttonContainer.style.fontFamily = "VT323, monospace";
    buttonContainer.style.color = "#ffffff"; 
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    form.appendChild(buttonContainer);

    modalContent.appendChild(form);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    copyButton.addEventListener("click", function () {
      mapping.forEach((map, index) => {
        const input = document.getElementById("extractionField_" + index);
        map.value = input.value.trim();
      });

      const awardedMapping = mapping.find(m => m.description.toLowerCase() === "total awarded");
      const directMapping = mapping.find(m => m.description.toLowerCase() === "totla direct");
      const indirectMapping = mapping.find(m => m.description.toLowerCase() === "total indirec");

      const awardedNum = parseNumber(awardedMapping ? awardedMapping.value : "");
      if (!isNaN(awardedNum) && awardedNum > 0) {
        const directNum = parseNumber(directMapping ? directMapping.value : "");
        const indirectNum = parseNumber(indirectMapping ? indirectMapping.value : "");
        const missingDirect = isNaN(directNum) || directNum === 0;
        const missingIndirect = isNaN(indirectNum) || indirectNum === 0;

        const candidateEls = document.querySelectorAll('div[class*="tab-form-element"] input[type="text"]');
        const candidates = [];
        candidateEls.forEach(el => {
          let val = el.value || "";
          val = val.replace(/,/g, "").trim();
          const num = parseFloat(val);
          if (!isNaN(num)) {
            candidates.push(num);
          }
        });
        const filtered = candidates.filter(num => Math.abs(num - awardedNum) > 0.01);

        if (missingDirect && missingIndirect) {
          let foundPair = null;
          for (let i = 0; i < filtered.length; i++) {
            for (let j = i + 1; j < filtered.length; j++) {
              if (Math.abs(filtered[i] + filtered[j] - awardedNum) < 0.01) {
                foundPair = [filtered[i], filtered[j]];
                break;
              }
            }
            if (foundPair) break;
          }
          if (foundPair) {
            const large = Math.max(foundPair[0], foundPair[1]);
            const small = Math.min(foundPair[0], foundPair[1]);
            if (directMapping) directMapping.value = large.toLocaleString();
            if (indirectMapping) indirectMapping.value = small.toLocaleString();
          }
        } else if (missingDirect && !missingIndirect) {
          const candidate = awardedNum - indirectNum;
          if (filtered.some(num => Math.abs(num - candidate) < 0.01)) {
            if (directMapping) directMapping.value = candidate.toLocaleString();
          }
        } else if (!missingDirect && missingIndirect) {
          const candidate = awardedNum - directNum;
          if (filtered.some(num => Math.abs(num - candidate) < 0.01)) {
            if (indirectMapping) indirectMapping.value = candidate.toLocaleString();
          }
        }
      }

      const projectTypeMapping = mapping.find(m => m.description.toLowerCase() === "project type");
      if (projectTypeMapping && !projectTypeMapping.value) {
        const selects = document.querySelectorAll("select");
        const normProjQuery = normalize(projectTypeMapping.query);
        selects.forEach(sel => {
          const label = sel.nextElementSibling;
          if (label && label.tagName.toLowerCase() === "label" && normalize(label.textContent).includes(normProjQuery)) {
            projectTypeMapping.value = sel.options[sel.selectedIndex]?.text || "";
          }
        });
      }

      const totalColumns = 43;
      const rowData = new Array(totalColumns).fill("");
      const now = new Date();
      const currentDate = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = monthNames[now.getMonth()];
      rowData[0] = currentDate;
      rowData[1] = currentMonth;

      mapping.forEach((map) => {
        if (map.column >= 3 && map.column <= totalColumns) {
          rowData[map.column - 1] = map.value || "";
        }
      });

      const outputRow = rowData.join("\t");
      navigator.clipboard.writeText(outputRow).then(() => {
        alert("Copied to clipboard:\n" + outputRow);
      }).catch(err => {
        alert("Failed to copy: " + err);
      });

      overlay.remove();
    });

    closeButton.addEventListener("click", function () {
      overlay.remove();
    });
  }

  // NEW: Function to import clipboard data into fields
  async function importFromClipboard() {
    // Focus a target input to ensure the frame is focused.
    const targetInput = document.getElementById('inp:frbprop_frbpropLongTitle');
    if (targetInput) {
      targetInput.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.warn("Target input not found. Using fallback focus element.");
      const fallback = document.createElement('input');
      fallback.style.position = 'absolute';
      fallback.style.opacity = '0';
      fallback.style.height = '1px';
      fallback.style.width = '1px';
      document.body.appendChild(fallback);
      fallback.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        alert("Clipboard is empty or inaccessible.");
        return;
      }
      const rowData = clipboardText.split("\t");

      const col22Map = {
        "academic support": "AS",
        "capital project": "CP",
        "clinical trial": "CT",
        "instruction": "IN",
        "institutional support": "IS",
        "operation and maintenance": "OM",
        "public service": "PS",
        "research": "RS",
        "scholarships and fellowships": "SF",
        "student services": "SS"
      };

      const col23Map = {
        "state approp": "A",
        "bonds": "B",
        "endowme": "E",
        "federal": "F",
        "gifts": "G",
        "international": "I",
        "local": "L",
        "private": "P",
        "state": "S",
        "tuition": "T"
      };

      mapping.forEach(map => {
        if (map["banner-elementId"]) {
          const colIndex = map.column - 1;
          let cellValue = rowData[colIndex] ? rowData[colIndex].trim() : "";

          if (map.column === 22) {
            const lowerVal = cellValue.toLowerCase();
            Object.keys(col22Map).forEach(key => {
              if (lowerVal === key) {
                cellValue = col22Map[key];
              }
            });
          }

          if (map.column === 23) {
            const lowerVal = cellValue.toLowerCase();
            Object.keys(col23Map).forEach(key => {
              if (lowerVal.startsWith(key)) {
                cellValue = col23Map[key];
              }
            });
          }

          // Select only input elements of type "text" whose id starts with the given prefix.
          const targetEl = document.querySelector(`input[type="text"][id^="${map["banner-elementId"]}"]`);
          if (targetEl) {
            targetEl.value = cellValue;
            // Dispatch events to simulate user input and tabbing away.
            targetEl.dispatchEvent(new Event('input', { bubbles: true }));
            targetEl.dispatchEvent(new Event('change', { bubbles: true }));
            targetEl.blur();
          } else {
            console.warn("No input element found with an ID starting with:", map["banner-elementId"]);
          }
        }
      });
      alert("Imported clipboard data successfully.");
    } catch (err) {
      console.error("Failed to import from clipboard:", err);
      alert("Failed to import from clipboard: " + err);
    }
  }

  // Listen for messages from the background script.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'launchExtractionOverlay') {
      launchExtractionOverlay();
      sendResponse({ status: 'extraction overlay launched' });
    } else if (message.action === 'launchImportOverlay') {
      importFromClipboard();
      sendResponse({ status: 'import process initiated' });
    }
  });

  // Optionally remove any existing floating extraction button.
  const existingButton = document.getElementById("extractionFloatButton");
  if (existingButton) {
    existingButton.remove();
  }
})();
