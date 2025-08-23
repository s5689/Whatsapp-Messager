import './_hotReload';
import './menuOptions';
import whatsappMessager from './reservo/whatsappMessager';

chrome.runtime.onMessage.addListener(async (e) => {
  e.source = await getCurrentTab();

  whatsappMessager(e);
});

// Obtener id de la pestaña actual
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      resolve(tab.id);
    });
  });
}
