
// Create the context menu when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "toggleSidebar",
    title: "Toggle Sidebar",
    contexts: ["all"]
  });
});

// Listen for context menu clicks.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleSidebar") {
    if (chrome.sidePanel) {
      chrome.sidePanel.setOptions({
        path: "extension/sidebar.html",
        enabled: true
      }, () => {
        // Pass an empty options object and a callback to open the side panel.
        chrome.sidePanel.open({ tabId: tab.id }, () => {
          console.log("Side panel opened.");
        });
      });
    } else {
      console.error("chrome.sidePanel API is not available in this browser version.");
    }
  }
});



// background.js

chrome.runtime.onInstalled.addListener(() => {
  // Existing extraction menu
  chrome.contextMenus.create({
    id: "launchExtractionOverlay",
    title: "Ex-pour-t",
    contexts: ["all"]
  });

  // New import menu; only show on bannerprod.tntech.edu pages
  chrome.contextMenus.create({
    id: "launchImportOverlay",
    title: "impourt",
    contexts: ["all"],
    documentUrlPatterns: ["*://*"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab.id) return;
  
  if (info.menuItemId === "launchExtractionOverlay") {
    chrome.tabs.sendMessage(tab.id, { action: "launchExtractionOverlay" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else {
        console.log("Response from content script:", response);
      }
    });
  }
  else if (info.menuItemId === "launchImportOverlay") {
    chrome.tabs.sendMessage(tab.id, { action: "launchImportOverlay" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else {
        console.log("Import action response:", response);
      }
    });
  }
});
