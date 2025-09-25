import './_hotReload';
import './menuOptions';
import appointmentChecker from './reservo/appointmentChecker';
import whatsappMessager from './reservo/whatsappMessager';

chrome.runtime.onMessage.addListener((e, _, r) => {
  (async () => {
    const data = {
      data: e,
      resp: r,
      source: await getCurrentTab(),
    };

    whatsappMessager(data);
    appointmentChecker(data);
  })();

  return true;
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
