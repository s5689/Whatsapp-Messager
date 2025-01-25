let reservoID = null;
let rutificadorID = null;
let rutificadorValue = null;

chrome.runtime.onMessage.addListener((e, idk, resp) => {
  // Asignar ID de la pestaña en la cual se abrio la planilla del cliente
  if (e.msg === 'setReservoID') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      reservoID = tab.id;
    });
  }

  // Mensaje proveniente del popup para informar que se abrio una planilla
  if (e.msg === 'open') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      chrome.tabs.sendMessage(tab.id, { msg: 'open' });
    });
  }

  // Cerrra las pestañas de Whatsapp despues de enviar los mensajes
  if (e.msg === 'closeWhatsapp') {
    chrome.tabs.query({}, (tabs) => {
      // const tab = tabs[0];
      tabs.forEach((value) => {
        if (value.title === 'Compartir en Whatsapp') {
          chrome.tabs.remove(value.id);
        }

        if (e.currentWindow === value.url) {
          chrome.tabs.update(value.id, { active: true }, (tab) => {});
        }
      });
    });
  }

  // Asignar RUT proveniente de reservo
  if (e.msg === 'rutificadorSet') {
    rutificadorValue = e.payload;

    // Abrir pestaña de rutificador
    chrome.windows.create(
      {
        url: 'https://www.nombrerutyfirma.com',
        type: 'normal',
        width: 1,
        height: 1,
        left: 0,
        top: 0,
        focused: false,
      },
      (window) => {
        // Guardar ID del rutificador
        rutificadorID = window.tabs[0].id;
      }
    );
  }

  // Llamada proveniente del rutificador al abrir la penstaña
  // (Solo entrar si el rutificador fue abierto por reservo)
  if (e.msg === 'rutificadorCall' && rutificadorValue !== null) {
    // Inyectar script SOLO en el rutificador
    chrome.scripting.executeScript({
      target: { tabId: rutificadorID },
      func: (rutificadorValue) => {
        fetch('https://www.nombrerutyfirma.com/rut', {
          headers: {
            accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'es-419,es;q=0.9',
            'cache-control': 'max-age=0',
            'content-type': 'application/x-www-form-urlencoded',
            priority: 'u=0, i',
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
          },
          referrer: 'https://www.nombrerutyfirma.com/',
          referrerPolicy: 'strict-origin-when-cross-origin',
          body: `term=${rutificadorValue}`,
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
        })
          .then((response) => response.text())
          .then((data) => {
            //Convertir la respuesta en un elemento HTML
            const responseHTML = document.createElement('html');
            responseHTML.innerHTML = data;

            // Comprobar que el rutificador no esta saturado
            const connectionState = document.querySelector('pre');

            // Buscar texto de respuesta de existir
            const scrappedTable = responseHTML.querySelector('tbody td');

            // Enviar respuesta obtenida a Reservo
            // Si no fue rechazada,
            if (connectionState === null) {
              // Enviar nombre si existe
              if (scrappedTable !== null) {
                chrome.runtime.sendMessage({
                  msg: 'backgroundRutDone',
                  payload: scrappedTable.innerHTML,
                });
              }
              // Si no existe, informar
              else {
                chrome.runtime.sendMessage({
                  msg: 'backgroundRutDone',
                  payload: 'No Registrado',
                });
              }
            }
            // Si fue rechazada, informar
            else {
              chrome.runtime.sendMessage({
                msg: 'backgroundRutDone',
                payload: 'Solicitud Rechazada',
              });
            }
          });
      },
      args: [rutificadorValue],
    });
  }

  // Recibir respuesta de Rutificador y Reenviar a pestaña de Reservo
  if (e.msg === 'backgroundRutDone') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(reservoID, {
        msg: 'contentRutDone',
        payload: e.payload,
      });
    });

    // Limpiar variables de rutificador
    chrome.tabs.remove(rutificadorID);
    rutificadorValue = null;
    rutificadorID = null;
  }
});

// Menu de la extension
chrome.runtime.onInstalled.addListener(() => {
  // Crear un menú contextual para el ícono de la extensión
  chrome.contextMenus.create({
    id: 'copyMessage',
    title: 'Copiar mensaje de WhatsApp.',
    contexts: ['action'], // Esto asegura que solo aparecerá al hacer clic derecho en el icono
  });
});

// Escuchar el click en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyMessage') {
    // Copiar mensaje del content.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      chrome.tabs.sendMessage(tab.id, {
        msg: 'copyMessage',
      });
    });
  }
});
