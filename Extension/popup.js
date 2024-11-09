// Function to display download history in the popup
function displayDownloads() {
    chrome.storage.local.get(['downloadHistory'], function (data) {
      const downloadList = document.getElementById('downloadList');
      downloadList.innerHTML = ''; // Clear existing list
      const history = data.downloadHistory || [];
  
      history.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('download-item');
        div.innerHTML = `
          <strong>File:</strong> ${item.filename} <br>
          <strong>Size:</strong> ${(item.size / (1024 * 1024)).toFixed(2)} MB
        `;
        downloadList.appendChild(div);
      });
    });
  }
  
  // Clear the download history
  document.getElementById('clearHistory').addEventListener('click', function () {
    chrome.storage.local.set({ downloadHistory: [] }, function () {
      displayDownloads(); // Refresh the displayed list
    });
  });
  
  // On popup load, display the download history
  document.addEventListener('DOMContentLoaded', function () {
    displayDownloads();
  });
  