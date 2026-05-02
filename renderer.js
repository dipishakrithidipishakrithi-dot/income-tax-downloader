// DOM Elements
const downloadBtn = document.getElementById('downloadAllBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusLog = document.getElementById('statusLog');

let isDownloading = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Renderer process loaded');
  
  // Verify electronAPI is available
  if (!window.electronAPI) {
    console.error('electronAPI not available! Check preload configuration.');
    addLog('ERROR: electronAPI not available. Check console.');
    return;
  }
  
  console.log('electronAPI available:', window.electronAPI);
  
  // Attach event listeners
  if (downloadBtn) {
    downloadBtn.addEventListener('click', handleBulkDownload);
  } else {
    console.error('Download button not found in DOM');
  }
  
  // Listen for progress updates
  window.electronAPI.onDownloadProgress((data) => {
    updateProgress(data);
  });
  
  window.electronAPI.onDownloadComplete((data) => {
    addLog(`✓ Download completed: ${data.filename}`);
  });
  
  window.electronAPI.onDownloadError((data) => {
    addLog(`✗ Error: ${data.error}`);
  });
});

async function handleBulkDownload() {
  if (isDownloading) {
    addLog('Download already in progress...');
    return;
  }
  
  isDownloading = true;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Downloading...';
  
  try {
    // Initialize download directory
    const result = await window.electronAPI.startBulkDownload();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    addLog(`📁 Using directory: ${result.downloadsDir}`);
    
    // Get payment rows from table
    const paymentRows = document.querySelectorAll('table tbody tr');
    
    if (paymentRows.length === 0) {
      addLog('No payment rows found in table');
      resetDownloadButton();
      return;
    }
    
    addLog(`Found ${paymentRows.length} payment records to download`);
    
    // Loop through each row
    for (let i = 0; i < paymentRows.length; i++) {
      const row = paymentRows[i];
      
      try {
        // Update progress
        const progress = {
          current: i + 1,
          total: paymentRows.length,
          percentage: Math.round(((i + 1) / paymentRows.length) * 100)
        };
        
        updateProgress(progress);
        addLog(`[${progress.current}/${progress.total}] Processing row...`);
        
        // Find 3-dot menu button in this row
        const menuBtn = row.querySelector('[data-menu-trigger], .menu-btn, .three-dot-menu, button[aria-label*="menu"], button[title*="menu"]');
        
        if (!menuBtn) {
          addLog(`⚠ Row ${i + 1}: No menu button found, skipping...`);
          continue;
        }
        
        // Click menu button
        menuBtn.click();
        await sleep(500);
        
        // Find and click download option
        const downloadOption = document.querySelector(
          '[data-action="download"], .menu-item-download, li[aria-label*="download"], button:contains("Download")'
        );
        
        if (!downloadOption) {
          addLog(`⚠ Row ${i + 1}: No download option found, skipping...`);
          continue;
        }
        
        downloadOption.click();
        
        // Wait for file to download
        await sleep(2000);
        
        addLog(`✓ Row ${i + 1}: Download initiated`);
        
      } catch (error) {
        addLog(`✗ Row ${i + 1}: Error - ${error.message}`);
      }
    }
    
    // Final completion
    const finalProgress = {
      current: paymentRows.length,
      total: paymentRows.length,
      percentage: 100
    };
    
    updateProgress(finalProgress);
    addLog(`✓ Bulk download completed! All ${paymentRows.length} files processed.`);
    
  } catch (error) {
    addLog(`✗ Critical error: ${error.message}`);
    console.error('Bulk download error:', error);
  } finally {
    resetDownloadButton();
    isDownloading = false;
  }
}

function updateProgress(data) {
  progressContainer.style.display = 'block';
  
  const { current = 0, total = 0, percentage = 0 } = data;
  
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${current} / ${total} files (${percentage}%)`;
}

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.textContent = `[${timestamp}] ${message}`;
  statusLog.appendChild(logEntry);
  statusLog.scrollTop = statusLog.scrollHeight;
  console.log(message);
}

function resetDownloadButton() {
  downloadBtn.disabled = false;
  downloadBtn.textContent = 'Download all available files';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility to find elements by text content
Element.prototype.contains = function(text) {
  return this.textContent.includes(text);
};

console.log('Renderer script loaded');