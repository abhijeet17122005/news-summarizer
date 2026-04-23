document.getElementById('analyzeBtn').addEventListener('click', async () => {
  // Get active tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab && tab.url) {
    // Encode the url and pass it to your local or deployed app
    const encodedUrl = encodeURIComponent(tab.url);
    
    // NOTE: This points to localhost for local testing. 
    // Before publishing, change this to your deployed Vercel URL!
    const targetUrl = `http://localhost:3000/?url=${encodedUrl}`;
    
    // Open in a new tab
    chrome.tabs.create({ url: targetUrl });
  }
});
