import { BACKGROUND, CONTENT } from '../../globals';

export default async function whatsappMessager(e) {
  // Mensaje proveniente del popup para informar que se abrio la extension
  if (e.msg === 'popup-open' && e.target === BACKGROUND) {
    chrome.tabs.sendMessage(e.source, { msg: 'popup-open', target: CONTENT });
  }

  // Cerrra las pestañas de Whatsapp despues de enviar los mensajes
  if (e.msg === 'closeWhatsapp' && e.target === BACKGROUND) {
    let wsTabs = [];

    // Repetir hasta obtener ID de pestañas de WhatsApp
    while (true) {
      const foundTabs = [];

      // Buscar todas las pestañas actuales
      await new Promise((r) => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((value) => {
            // Al encontrar las de WhatsApp, almacenar
            if (value.title === 'Compartir en Whatsapp') {
              foundTabs.push(value.id);
            }
          });

          r();
        });
      });

      // Si se encuentran las 2, finalizar bucle
      if (foundTabs.length === 2) {
        wsTabs = foundTabs;
        break;
      }

      await new Promise((r) => setTimeout(() => r(), 25));
    }

    // Mover a la pestaña actual
    chrome.tabs.update(e.source, { active: true }, () => {});
    await new Promise((r) => setTimeout(() => r(), 1000));

    // Cerrar WhatsApp
    wsTabs.forEach((value) => {
      chrome.tabs.remove(value);
    });
  }
}
