import { BACKGROUND } from '../../globals';
const rutificadorState = {
  data: null,
  source: null,
  promise: null,
  rutificadorID: null,
  wipe() {
    this.data = null;
    this.source = null;
    this.promise = null;
    this.rutificadorID = null;
  },
};

export default async function appointmentChecker({ data, source, resp }) {
  if (data.msg === 'check-rut' && data.target === BACKGROUND) {
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
        // Guardar data del rutificador
        rutificadorState.data = data;
        rutificadorState.source = source;
        rutificadorState.promise = resp;
        rutificadorState.rutificadorID = window.tabs[0].id;
      }
    );
  }

  if (data.msg === 'rutificador-call' && data.target === BACKGROUND && rutificadorState.data) {
    // Inyectar script SOLO en el rutificador
    chrome.scripting.executeScript({
      target: { tabId: rutificadorState.rutificadorID },
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

            /*
              rutificadorState NO ESTA EN ESTE CONTEXTO
              ESTO CORRE EN EL HTML DEL RUTIFICADOR
              CORREGIR.

            */
            rutificadorState.promise(data);
            rutificadorState.wipe();
            /*
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
            */
          });
      },
      args: [rutificadorState.data.payload],
    });
  }
}
