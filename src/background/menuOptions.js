import { CONTENT } from '../globals';

// Construir menu
chrome.runtime.onInstalled.addListener(() => {
  // Crear un menú contextual para el ícono de la extensión
  chrome.contextMenus.create({
    id: 'copyMessage',
    title: 'Copiar mensaje de WhatsApp.',
    contexts: ['action'],
  });
});

// Escuchar el click en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyMessage') {
    // Copiar mensaje del content.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      chrome.tabs.sendMessage(tab.id, { msg: 'copyMessage', target: CONTENT });
    });
  }
});
