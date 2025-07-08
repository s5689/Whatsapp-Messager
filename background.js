let reservoID = null;
let rutificadorID = null;
let rutificadorValue = null;
let socketConnection = false;

let fonasaRUT = null;

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

  // Remover ventana de Rutificador
  if (e.msg === 'rutificadorUnset') {
    chrome.tabs.remove(rutificadorID);
    rutificadorValue = null;
    rutificadorID = null;
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

  // Comprobar conexion con el socket
  if (e.msg === 'backgroundCheckSocket' && !socketConnection) {
    socketConnection = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentID = tabs[0].id;

      chrome.tabs.sendMessage(currentID, {
        msg: 'setSocket',
      });
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

  // Enviar rut a Fonasa
  if (e.msg === 'backgroundFonasaCall') {
    // Obtener pestañas
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      const foundFonasa = [];
      let currentID = null;

      // Recorrer las pestañas actuales
      tabs.forEach((value) => {
        // Guardar todas las pestañas de Fonasa encontradas
        if (value.url.includes('bonoelectronico')) {
          foundFonasa.push(value.id);
        }

        // Al encontrar la pestaña actual (Reservo), guardar su ID
        if (value.active) {
          currentID = value.id;
        }
      });

      // Si hay mas de una pagina de Fonasa, emitir error
      if (foundFonasa.length > 1) {
        chrome.tabs.sendMessage(currentID, {
          msg: 'multiFonasaError',
        });
        return;
      }

      // Si no hay paginas de Fonasa abiertas, abrir una nueva
      if (foundFonasa.length === 0) {
        chrome.tabs.create({ url: 'https://directo4.bonoelectronico.cl/login.php' }, (tab) => {
          // Asignar ID de pestaña de Fonasa y el RUT a enviar para la Fase 1
          fonasaRUT = { id: tab.id, rut: e.payload };
        });
      }
      // Si hay 1 pagina de Fonasa, cambiar pestaña & comprobar estado de Fonasa
      else {
        chrome.tabs.update(foundFonasa[0], { active: true });
        chrome.tabs.sendMessage(foundFonasa[0], {
          msg: 'checkCurrentFonasa',
        });

        // preparar Fonasa para insercion de RUT
        fonasaRUT = { id: foundFonasa[0], rut: e.payload };
      }
    });
  }

  if (e.msg === 'backgroundCheckFonasaRUT' && fonasaRUT !== null) {
    const foundFonasa = [];

    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      tabs.forEach((value) => {
        // Guardar todas las pestañas de Fonasa encontradas
        if (value.url.includes('bonoelectronico')) {
          foundFonasa.push(value.id);
        }
      });

      // Si hay solo 1 pagina de Fonasa, proceder
      if (foundFonasa.length === 1) {
        chrome.tabs.sendMessage(foundFonasa[0], {
          msg: 'checkCurrentFonasa',
        });
      }
    });
  }

  // Recibir llamada de la Fase 1. Proceder solo si existe un RUT asignado desde la Extension
  if (e.msg === 'fonasaOk' && fonasaRUT !== null) {
    // Enviar RUT al content para proceder.

    chrome.tabs.sendMessage(fonasaRUT.id, {
      msg: 'setFonasaRUT',
      payload: fonasaRUT.rut,
    });

    fonasaRUT = null;
  }

  // Recibir llamada de la Fase 3 para autocompletar venta Fonasa en Reservo
  if (e.msg === 'backgroundAutocompleteVenta') {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      const foundVentaReservo = [];
      let currentID = null;

      // Recorrer las pestañas actuales
      tabs.forEach((value) => {
        // Guardar todas las pestañas de Venta de Reservo encontradas
        if (value.title.includes('Venta') && value.url.includes('reservo.cl')) {
          foundVentaReservo.push(value.id);
        }

        // Al encontrar la pestaña actual (Fonasa), guardar su ID
        if (value.active) {
          currentID = value.id;
        }
      });

      // Si hay mas de una pagina de Venta de Reservo, emitir error
      if (foundVentaReservo.length > 1) {
        chrome.tabs.sendMessage(currentID, {
          msg: 'multiVentaError',
        });
        return;
      }

      // Si no hay paginas de Venta de Reservo abiertas, emitir error
      if (foundVentaReservo.length === 0) {
        chrome.tabs.sendMessage(currentID, {
          msg: 'autocompleteError',
        });
        return;
      }

      // Si hay 1 pagina de Venta de Reservo, cambiar pestaña & proceder
      chrome.tabs.update(foundVentaReservo[0], { active: true });
      chrome.tabs.sendMessage(foundVentaReservo[0], {
        msg: 'setAutocompleteVenta',
        payload: e.payload,
      });
    });
  }
});

/*
  Menu de la Extension

*/
// Construir menu
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

// chrome.runtime.reload();
