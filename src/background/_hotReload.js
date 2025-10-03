if (import.meta.env.DEV) {
  const ws = new WebSocket('ws://localhost:5174');

  ws.addEventListener('open', () => {
    console.log('HMR conectado ✅');
  });

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'full-reload') {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (tab.id && tab.url?.startsWith('http')) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => location.reload(),
            });
          }
        }
      });
    }
  });
}
