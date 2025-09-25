import { BACKGROUND, CONTENT } from '../../globals';

export default async function whatsappMessager({ data, source }) {
  // Mensaje proveniente del popup para informar que se abrio la extension

  if (data.msg === 'popup-open' && data.target === BACKGROUND) {
    chrome.tabs.sendMessage(source, { msg: 'popup-open', target: CONTENT });
  }

  // Cerrra las pestañas de Whatsapp despues de enviar los mensajes
  if (data.msg === 'closeWhatsapp' && data.target === BACKGROUND) {
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
    chrome.tabs.update(source, { active: true }, () => {});
    await new Promise((r) => setTimeout(() => r(), 1000));

    // Cerrar WhatsApp
    wsTabs.forEach((value) => {
      chrome.tabs.remove(value);
    });
  }
}
