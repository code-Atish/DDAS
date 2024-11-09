const PAUSE_THRESHOLD_BYTES = 1048576 / 2 ; // 1 MB in bytes
// Function to convert bytes to megabytes
function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2); // Convert to MB and round to 2 decimal places
}

// Function to check download progress every second
function monitorDownloadProgress(downloadId) {
  const interval = setInterval(() => {
      chrome.downloads.search({ id: downloadId }, function (items) {
          if (items.length > 0) {
              let bytesReceived = items[0].bytesReceived;
              let totalBytes = items[0].totalBytes;
              
              // Convert bytes to MB
              let receivedMB = bytesToMB(bytesReceived);
              let totalMB = bytesToMB(totalBytes);
              
              // Display the progress
              console.log(`Download progress: ${receivedMB} MB / ${totalMB} MB`);
              
              // If download is complete, clear the interval
              if (items[0].state === "complete" || items[0].state === "interrupted") {
                  clearInterval(interval);
                  console.log("Download finished.");
              }
          } else {
              console.error(`No download found with ID: ${downloadId}`);
              clearInterval(interval);
          }
      });
  }, 100); // Run every second
}
// Function to connect with native messaging app and get the file hash
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connectNative('com.example.native_messaging');

    // Listen for the message (which is in JSON format) from the native app
    port.onMessage.addListener((msg) => {
      console.log("Received message from native app");
      try {
        if (msg && msg.status === 'success' && msg.hash) {
          console.log('Received hash from native app:', msg.hash);
          resolve(msg.hash);  // Resolve the promise with the file hash
        } else if (msg && msg.status === 'error') {
          console.error('Error from native app:', msg.message);
          reject(new Error(msg.message));
        } else {
          reject(new Error('Unknown response from native app'));
        }
      } catch (err) {
        reject(new Error('Error parsing response from native app: ' + err.message));
      }
    });

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError.message);
      }
      reject(new Error('Native messaging host disconnected'));
    });

    const message = { filePath: filePath };
    console.log('Sending file path to native app:', JSON.stringify(message));

    port.postMessage(message);
  });
}

  // Listen for download creation and attempt to pause it
  chrome.downloads.onCreated.addListener(function (downloadItem) {
    console.log(downloadItem)
    console.log(`Download ${downloadItem.id} created, canResume: ${downloadItem.canResume}`);
    
    // Always attempt to pause the download, even if canResume is false
    //   if (downloadItem.state === "in_progress") {
    //       // Delay to ensure some data is downloaded
    //   setTimeout(() => {
    //     chrome.downloads.pause(downloadItem.id, function () {
    //       if (chrome.runtime.lastError) {
    //         console.error('Error pausing download:', chrome.runtime.lastError.message);
    //       } else {
    //         console.log('Download paused to check for duplicates');
    //         processPartialDownload(downloadItem);  // Process after pausing
    //       }
    //     });

    //   }, 3000); // Short delay to ensure some data is downloaded
    // }
    if (downloadItem.state === "in_progress") {
      // Listen for download progress
      const interval = setInterval(() => {
        chrome.downloads.search({ id: downloadItem.id }, function (items) {
            if (items.length > 0) {
                let bytesReceived = items[0].bytesReceived;
                let totalBytes = items[0].totalBytes;
                console.log(`Download progress: ${bytesReceived} bytes received`);
          
                // Check if the download has reached the pause threshold
                if (bytesReceived >= PAUSE_THRESHOLD_BYTES) {
                  // Pause the download after the specified amount of data has been downloaded
                  chrome.downloads.pause(downloadItem.id, function () {
                    if (chrome.runtime.lastError) {
                      console.error('Error pausing download:', chrome.runtime.lastError.message);
                      clearInterval(interval);
                    } else {
                      console.log('Download paused to check for duplicates');
                      clearInterval(interval);
                      processPartialDownload(downloadItem); // Process after pausing
                    }
                  });
                }
                // // Convert bytes to MB
                // let receivedMB = bytesToMB(bytesReceived);
                // let totalMB = bytesToMB(totalBytes);
                
                // // Display the progress
                // console.log(`Download progress: ${receivedMB} MB / ${totalMB} MB`);
                
                // // If download is complete, clear the interval
                // if (items[0].state === "complete" || items[0].state === "interrupted") {
                //     clearInterval(interval);
                //     console.log("Download finished.");
                // }
            } else {
                console.error(`No download found with ID: ${downloadId}`);
                clearInterval(interval);
            }
        });
    }, 100); 
      // chrome.downloads.onChanged.addListener(function (delta) {
      //   // console.log(downloadItem)
      //   chrome.downloads.search({ id: downloadItem.id }, function (items) {
      //     if (items[0].bytesReceived) {
      //       console.log(`Search found bytesReceived : ${items[0].bytesReceived}`);
      //     }
      //   });

      //   if (delta.id === downloadItem.id && delta.bytesReceived) {
      //     console.log(`Download progress: ${delta.bytesReceived} bytes received`);
          
      //     // Check if the download has reached the pause threshold
      //     if (delta.bytesReceived >= PAUSE_THRESHOLD_BYTES) {
      //       // Pause the download after the specified amount of data has been downloaded
      //       chrome.downloads.pause(downloadItem.id, function () {
      //         if (chrome.runtime.lastError) {
      //           console.error('Error pausing download:', chrome.runtime.lastError.message);
      //         } else {
      //           console.log('Download paused to check for duplicates');
      //           processPartialDownload(downloadItem); // Process after pausing
      //         }
      //       });
      //     }
      //   }
      // });
    }
  });


// Process the partially downloaded file
function processPartialDownload(downloadItem) {
  const fileId = downloadItem.id;

    chrome.downloads.search({ id: fileId }, function (items) {
      const filePath = items[0].filename + '.crdownload' ;
      downloadItem.filename = items[0].filename.split('\\').pop();
      downloadItem.diskPath = items[0].filename;
      getFileHash(filePath)
        .then(fileHash => {
          checkForDuplicate(downloadItem, fileHash);
        })
        .catch(error => {
          console.error('Error getting file hash:', error);
          resumeDownload(downloadItem.id);  // Attempt to resume if an error occurs
        });
    });
 
}

// Check for duplicate files in storage (based on size and hash)
function checkForDuplicate(downloadItem, fileHash) {
  chrome.storage.local.get(['downloadHistory'], function (data) {
    const history = data.downloadHistory || [];

    const duplicate = history.find(item => 
      item.size === downloadItem.fileSize && item.hash === fileHash
    );

    if (duplicate) {
      showDuplicateNotification(downloadItem, fileHash);  // Notify user
    } else {
      addToDownloadHistory(downloadItem, fileHash);
      resumeDownload(downloadItem.id);  // Resume download if no duplicate
    }
  });
}

// Attempt to resume the download
function resumeDownload(downloadId) {
  chrome.downloads.resume(downloadId, function () {
    if (chrome.runtime.lastError) {
      console.error('Error resuming download:', chrome.runtime.lastError.message);
    } else {
      console.log(`Download ${downloadId} resumed`);
    }
  });
}

// Show a notification for duplicate detection
function showDuplicateNotification(downloadItem, fileHash) {
  const options = {
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Duplicate Download Detected',
    message: `The file ${downloadItem.filename} already exists. Continue downloading?`,
    buttons: [
      { title: 'Yes, continue download' },
      { title: 'No, cancel download' }
    ],
    priority: 2
  };

  chrome.notifications.create('duplicateDownload', options, function () {
    chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
      if (notificationId === 'duplicateDownload') {
        if (buttonIndex === 0) {
          addToDownloadHistory(downloadItem, fileHash);
          resumeDownload(downloadItem.id);  // Resume download if user chooses to continue
          console.log(`Download ${downloadItem.id} resumed`);

        } else {
          chrome.downloads.cancel(downloadItem.id);  // Cancel download if user chooses
          console.log(`Download ${downloadItem.id} cancelled`);
        }
      }
    });
  });
}

// Add a download item to history
function addToDownloadHistory(downloadItem, fileHash) {
  chrome.storage.local.get(['downloadHistory'], function (data) {
    const history = data.downloadHistory || [];

    history.push({
      id: downloadItem.id,
      filename: downloadItem.filename,
      size: downloadItem.fileSize,
      hash: fileHash,
      path : downloadItem.diskPath,
    });

    chrome.storage.local.set({ downloadHistory: history });
  });
}
