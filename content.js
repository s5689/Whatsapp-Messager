let modalState = false;
let isReady = false;
let clientData = {};
let autocompleteData = {};
const withoutLicence = ['PABLO PACHECO'];
const vocalArray = [
  'á',
  'à',
  'ä',
  'â',
  'ã',
  'å',
  'ā',
  'æ',
  'ă',
  'ą',
  'é',
  'è',
  'ë',
  'ê',
  'ē',
  'ę',
  'ě',
  'í',
  'ì',
  'ï',
  'î',
  'ī',
  'į',
  'ó',
  'ò',
  'ö',
  'ô',
  'õ',
  'ø',
  'ō',
  'ő',
  'ú',
  'ù',
  'ü',
  'û',
  'ū',
  'ů',
  'ű',
  'ų',
];

// Eventos del Background / PopUp
chrome.runtime.onMessage.addListener((e) => {
  // Eventos del WebSocket
  /*
  if (e.msg === 'setSocket') {
    const socket = new WebSocket('https://titmouse-settling-trout.ngrok-free.app');

    socket.onopen = () => {
      socket.send(JSON.stringify({ msg: 'setID', payload: 'r2' }));

      setTimeout(() => {
        socket.send(JSON.stringify({ msg: 'test' }));
      }, 3000);
    };

    socket.onmessage = (e) => {
      console.log(e.data);
    };
  }
  */

  // Detectar llamada del background al abrir la extension (para WhatsApp)
  if (e.msg === 'open') {
    const resp = generateMessage();

    if (resp !== null) {
      const { text, numero } = resp;

      var regex_numeros = '^[0-9]{11,15}$';
      if (!numero.match(regex_numeros)) {
        alert('Para enviar mensaje debe ingresar un número internacional válido');
      } else {
        window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(text), '_blank');
        window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(text), '_blank');
        navigator.clipboard.writeText(text);

        setTimeout(() => {
          chrome.runtime.sendMessage({
            msg: 'closeWhatsapp',
            currentWindow: document.URL,
          });
        }, 1000);
      }
    }
  }

  // Copiar mensaje de WhatsApp al portapapeles
  if (e.msg === 'copyMessage') {
    const resp = generateMessage();

    if (resp !== null) {
      const { text } = resp;

      navigator.clipboard.writeText(text).then(() => {
        alert('Mensaje copiado al portapapeles.');
      });
    }
  }

  // Rut comprobado, realizar procesos finales y presentar datos
  if (e.msg === 'contentRutDone') {
    // Si la respuesta proviene de un cliente ya registrado
    if (modalState) {
      clientData.fullName = e.payload;
      infoViewerName();
    }
    // Si la respuesta proviene de un cliente registrandose
    else {
      checkViewer(e.payload);
    }
  }

  /*
    Eventos Modulo Fonasa

  */
  // Emitir error de multiples ventanas
  if (e.msg === 'multiFonasaError') {
    alert('Hay varias pestañas de Fonasa Abiertas.\nSolo mantenga 1 abierta por favor.');
  }

  // Comprobar la fase actual que al recibir la orden
  if (e.msg === 'checkCurrentFonasa') {
    const bonoResult = document.querySelector('#tbodyResultado_0');
    const loginHTML = document.querySelector('#fastswitch-modal');
    const rutInput = document.querySelector('#txtRutBenef');

    // Si se encuentra en la pantalla de espera de RUT, proceder
    if (rutInput !== null) {
      const rutDisabled = rutInput.getAttribute('disabled');

      // Comprobar que no sea la fase 2
      if (rutDisabled === null) {
        chrome.runtime.sendMessage({
          msg: 'fonasaOk',
        });
      }
    }

    // Si se encuentra en la pantalla de pago finalizado, volver a la fase 1
    if (bonoResult !== null) {
      document.querySelector('#btnVolverApp').click();
    }

    // Si se encuentra en el Login, presentar inicio de sesion rapido
    if (loginHTML !== null) {
      loginHTML.style.display = 'block';
    }
  }

  // Aplicar RUT si se llama desde el Background
  // (Solo aplica en la Fase 1)
  if (e.msg === 'setFonasaRUT') {
    document.querySelector('#txtRutBenef').value = e.payload;
    document.querySelector('#btnCertificar').click();
  }

  // Autocompletar datos de venta de Fonasa en reservo
  if (e.msg === 'setAutocompleteVenta') {
    autocompleteData = e.payload;
    document.querySelector('#payment-type-modal').style.display = 'block';
  }

  // Emitir error de multiples ventanas de Venta de Reservo
  if (e.msg === 'multiVentaError') {
    alert(
      'Hay varias pestañas de Venta Abiertas.\nSolo mantenga abierta la del cliente actual por favor.'
    );
  }

  // Emitir error de peticion de Autocompletar sin ninguna pestaña de Venta abierta
  if (e.msg === 'autocompleteError') {
    alert('Debe tener abierta la pestaña de Venta en reservo para poder autorellenar los campos.');
  }
});

/*
  Extension de Agenda

*/
// Escuchar evento al abrir la planillas
try {
  // De cliente ya registrado
  new MutationObserver((e) => {
    if (e[0].removedNodes) {
      // Abrir
      if (e.length === 4 || e.length === 12) {
        modalState = true;

        // Rutificador
        // Asignar el ID de reservo para devolver la informacion
        chrome.runtime.sendMessage({
          msg: 'setReservoID',
        });

        // Preparar planilla de cliente para mostrar la informacion
        buildInfoViewer();

        // Ocultar pantalla de datos
        document.getElementById('modal_datos_extras').style.transform = 'scale(0)';

        // Abrir datos extras automaticamente para extraer informacion
        document.getElementById('datos_extra').click();
        document.getElementById('editar_perfil_datos_extra').parentElement.children[0].click();

        // Eliminar fila extra de existir (bug)
        if (document.querySelector('#editAppt:last-child tr:last-child').clientHeight < 5) {
          document.querySelector('#editAppt:last-child tr:last-child').remove();
        }

        // Almacenar datos despues de un tiempo
        setTimeout(() => {
          // Devolver valores por defecto a pantalla de datos
          document.getElementById('modal_datos_extras').style.transform = 'scale(1)';

          // Leer y almacenar datos
          const raw = document.querySelectorAll('#modal_datos_extras tr');
          clientData = {};

          // Guardar variables
          raw.forEach((value) => {
            clientData[value.children[0].innerHTML] = value.children[1].innerHTML;
          });

          // Guardar nombre en Reservo en minuscula para simplificar proceso
          let tempName = document.querySelector('#id_title').value.toLowerCase();
          tempName = tempName.replace('np: ', '');
          tempName = tempName.replace('p: ', '');

          clientData.name = tempName;

          // Guardar link de edicion
          clientData.userLink = document.querySelector('#editar_perfil_datos_extra').href;

          // Comprobar si el usuario se encuentra duplicado
          fetch(`https://reservo.cl/pacienteDentista/buscarAjaxPerson/?term=+${clientData.Rut}`, {
            headers: {
              accept: 'application/json, text/javascript, */*; q=0.01',
              'accept-language': 'es-419,es;q=0.9',
              priority: 'u=1, i',
              'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'x-requested-with': 'XMLHttpRequest',
            },
            referrer: 'https://reservo.cl/appointment/makeAppointment/',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          })
            .then((resp) => resp.json())
            .then((data) => {
              // Guardar la cantidad de usuarios encontrados con el rut
              clientData.duplicated = data;

              // Una vez terminado de obtener todos los datos, representar
              infoViewer();

              // Y enviar rut al background
              chrome.runtime.sendMessage({
                msg: 'rutificadorSet',
                payload: format(clientData.Rut),
              });
            });
        }, 500);
      }

      // Cerrar
      if (
        e.length === 1 &&
        e[0].removedNodes.length !== 0 &&
        e[0].removedNodes[0].classList.length === 1
      ) {
        modalState = false;
        chrome.runtime.sendMessage({ msg: 'rutificadorUnset' });
      }
    }
  }).observe(document.getElementById('myModal3').parentElement, { childList: true });

  // De cliente a registrar
  new MutationObserver((e) => {
    // Asegurar que se trata de registrar cliente y no cliente registrado
    if (e.length !== 1 && !modalState) {
      // Preparar opciones de organizacion de nombre
      buildNameSorter();

      // Preparar boton de comprobar rut al agregar cliente
      buildRutButtonCheck();
    }
  }).observe(document.getElementById('myModal').parentElement, { childList: true });
} catch (e) {}

// Inyectar Resumen del dia (solo en agenda)
if (document.location.href.includes('reservo.cl/appointment')) {
  const iframeState = {
    html: document.createElement('iframe'),
    isReady: false,
    callback() {
      this.init();
    },

    // Obtener HTMLs internos del iframe
    init() {
      this.document = this.html.contentDocument;
      this.dateHTML = this.document.querySelector('#date');
      this.dateSubmit = this.document.querySelector('[type=submit]');
    },
    document: null,
    dateHTML: null,
    dateSubmit: null,
    currentData: null,
  };

  datePickerSettings();
  buildResumenModal();
  buildResumenButton();

  function datePickerSettings() {
    $.datepicker.setDefaults({
      closeText: 'Cerrar',
      prevText: 'Anterior',
      nextText: 'Siguiente',
      currentText: 'Hoy',
      monthNames: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ],
      monthNamesShort: [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ],
      dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
      weekHeader: 'Sm',
      dateFormat: 'dd/mm/yy',
      firstDay: 1,
      isRTL: false,
      showMonthAfterYear: false,
      yearSuffix: '',
    });
  }

  function dateFormat(e) {
    const day = String(e.getDate()).padStart(2, '0');
    const month = String(e.getMonth() + 1).padStart(2, '0');
    const year = e.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function datePickerFormat(e) {
    const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dateArray = e.split('-');
    const tempDate = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);
    const currentWeekday = weekDays[tempDate.getDay()];

    return currentWeekday;
  }

  function getDateArray(e) {
    const dateArray = e.split('-');
    dateArray[0] = Number(dateArray[0]);
    dateArray[1] = Number(dateArray[1]);
    dateArray[2] = Number(dateArray[2]);

    return dateArray;
  }

  function buildResumenModal() {
    // Contruir Modal
    const modalHTML = document.createElement('div');

    const css = `
      <style>
        #resumen-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;

          margin: 0;
          padding: 0;
          background-color: rgba(0, 0, 0, 0.5);

          z-index: 999999999999;
        }

        #resumen-modal-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80%;
          height: 80%;
          transform: translate(-50%, -50%);

          padding: 1rem;
          background-color: white;
          border: 1px solid rgba(0, 0, 0, 0.3);
          border-radius: 1rem;
          
          overflow: hidden;
        }

        #resumen-modal-header {
          padding: 0 1rem 1rem 1rem;
          border-bottom: 1px solid black
        }

        #resumen-modal-body {
          padding-top: 1rem;
        }

        #resumen-modal-innerBody {
          width: 100%;
          height: 100%;
        }

        #resumen-modal-innerBody #innerBody-date {
          display: flex;
          align-items: center;
        }

        #resumen-modal-innerBody #innerBody-date input {
          width: 83px;
          cursor: pointer;
          margin-top: 10px;
        }

        #resumen-modal-innerBody #innerBody-date input:hover {
          background-color: lightgray;
          transition: background 200ms;
        }

        #resumen-modal-innerBody #innerBody-date button {
          height: 28px;
          border: 1px solid #cccccc;
          border-radius: 5px;
          background-color: #F0F0F0;
          margin: 0 0.5rem 0 0.5rem;
        }

        #resumen-modal-innerBody #innerBody-date .date-controls[disabled] {
          background-color: khaki;
          color: black;
          
          cursor: default;
          transition: background 200ms;
        }

        #resumen-modal-innerBody #innerBody-date button:hover {
          background-color: lightgray;
          transition: background 200ms;
        }

        #resumen-modal-innerBody #innerBody-date span {
          font-weight: bold;
          font-size: 24px;
        }

        #resumen-modal-innerBody #innerBody-date  {
          font-weight: bold;
          font-size: 24px;
        }

        #resumen-modal-innerBody #innerBody-resumen {
          display: flex;
          font-size: large;

          border: 1px outset;
          border-radius: 1rem;
          background-color: antiquewhite;
          box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);
          
          margin: 1rem;
        }

        #resumen-modal-innerBody #innerBody-resumen .innerBody-resumen-div {
          display: flex;
          flex-direction: column;
          width: 50%;

          padding: 1rem;
        }

        #resumen-modal-innerBody #innerBody-resumen .innerBody-resumen-div tr[has-value] {
          background-color: rgba(0,0,0,0.1);
        }

        #resumen-modal-innerBody #innerBody-resumen .innerBody-resumen-div tr[has-value] td[title] {
          cursor: help;
          transition: background 400ms;
        }

        #resumen-modal-innerBody #innerBody-resumen .innerBody-resumen-div tr[has-value] td[title]:hover {
          cursor: help;
          background-color: rgba(0,0,0,0.2);
        }

        #resumen-modal-innerBody #innerBody-resumen .innerBody-resumen-div li[has-value] {
          font-weight: bold;
        }

        #resumen-modal-innerBody #innerBody-resumen span {
          font-size: larger;
          text-align: center;
          width: 100%;
          border-bottom: 1px solid;
          
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
        }

        #resumen-modal-innerBody #innerBody-agendas {
          font-size: large;
          max-height: calc(347px - 1rem);
          
          border: 1px outset;
          border-radius: 1rem;
          background-color: gainsboro;
          box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);

          margin: 3rem 1rem 1rem 1rem;
          padding: 1rem;
          
          overflow: scroll;
          scrollbar-width: none;
        }

        #resumen-modal-innerBody #innerBody-agendas div {
        position: fixed;
        width: calc(100% - 6rem);
        height: 1rem;

        margin-top: -1rem;
        background-color: gainsboro;
        }

        #resumen-modal-innerBody #innerBody-agendas table {
          width: 100%;
        }

        #resumen-modal-innerBody #innerBody-agendas table thead {
          position: sticky;
          top: 0;
          background-color: gainsboro;
          
          z-index: 100;
        }

        #resumen-modal-innerBody #innerBody-agendas table thead tr {
          background-color: teal;
          color: white;
        }

        #resumen-modal-innerBody #innerBody-agendas table th,
        #resumen-modal-innerBody #innerBody-agendas table td {
          padding: 0.5rem;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
          
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(odd) td:nth-child(6) {
          background-color: rgba(66, 117, 227, 0.4);
        }

        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(odd) td:nth-child(7) {
          background-color: rgba(56, 154, 92, 0.4);
        }

        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(odd) td:nth-child(8) {
          background-color: rgba(225, 211, 83, 0.4);
        }

        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(odd) td:nth-child(9) {
          background-color: rgba(128, 136, 146, 0.4);
        }

        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(1),
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(2),
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(3),
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(4),
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(5) {
          background-color: rgba(0, 0, 0, 0.15);
        }
          
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(6) {
          background-color: rgba(53, 96, 189, 0.6);
        }
          
        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(7) {
          background-color: rgba(41, 115, 68, 0.6);
        }

        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(8) {
          background-color: rgba(186, 174, 69, 0.6);
        }

        #resumen-modal-innerBody #innerBody-agendas table tbody tr:nth-child(even) td:nth-child(9) {
          background-color: rgba(94, 100, 107, 0.6);
        }
      </style>
    `;

    modalHTML.id = 'resumen-modal';
    modalHTML.onclick = (e) => {
      if (e.target.id === 'resumen-modal') {
        modalHTML.style.display = 'none';
      }
    };
    modalHTML.innerHTML = `
      ${css}
      <div id="resumen-modal-container">
        <div id="resumen-modal-header">
          <h1>Resumen del Dia</h1>
        </div>
        
        <div id="resumen-modal-body">
          <div id="resumen-modal-innerBody">
            <div id="innerBody-date">
              <button class="date-controls">Hoy</button>
              <button class="date-controls"><</button>
              <input class="date-controls" type="text" readonly />
              <button class="date-controls">></button>

              <span></span>
              ${
                location.pathname === '/appointment/viewAllAppts/'
                  ? `<button 
                      class="date-controls"
                      style="
                        position: absolute;
                        right: 2rem;
                    ">Sincronizar con Agenda Multiple</button>`
                  : ''
              }
            </div>

            <div id="innerBody-resumen">
              <div class="innerBody-resumen-div">
                <span>Procedimientos del Dia</span>
                <table>
                  <thead>
                    <th width="50%;"></th>
                    <th width="70px;">Juan</th>
                    <th width="70px;">Sanguino</th>
                  </thead>

                  <tbody>
                    <tr>
                      <td style="text-align: right;">Plasma Rico en Plaquetas</td>
                      <td style="text-align: center;">-</td>
                      <td style="text-align: center;">-</td>
                    </tr>
                    <tr>
                      <td style="text-align: right;">Viscosuplemento</td>
                      <td style="text-align: center;">-</td>
                      <td style="text-align: center;">-</td>
                    </tr>
                    <tr>
                      <td style="text-align: right;">Ozonoterapias</td>
                      <td style="text-align: center;">-</td>
                      <td style="text-align: center;">-</td>
                    </tr>
                    <tr>
                      <td style="text-align: right;">Infiltraciones</td>
                      <td style="text-align: center;">-</td>
                      <td style="text-align: center;">-</td>
                    </tr>
                    <tr>
                      <td style="text-align: right;">Procedimiento Eco Dirigido</td>
                      <td style="text-align: center;">-</td>
                      <td style="text-align: center;">-</td>
                    </tr>
                    <tr>
                      <td style="text-align: right;">Electrocardiogramas</td>
                      <td style="text-align: center;">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="innerBody-resumen-div">
                <span>Totales del Dia</span>
                <div style="display: flex; flex-direction: row;">
                  <div>
                    <ul style="text-align: right;">
                      <li>Horario del dia:</li>
                      <li>Doctores en el dia:</li>
                      <li>Agendados:</li>
                      <li>Sobrecupos:</li>
                      <li>Atendidos:</li>
                      <li>Confirmados:</li>
                      <li>Suspendidos:</li>
                      <li>Sin Confirmar:</li>
                    </ul>
                  </div>
                  <div>
                    <ul style="list-style-type: none; margin-left: 1rem;">
                      <li></li>
                      <li></li>
                      <li></li>
                      <li></li>
                      <li></li>
                      <li></li>
                      <li></li>
                      <li></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="innerBody-agendas">
              <table>
                <div></div>
                <thead>
                  <tr>
                    <th style="min-width: 29px;">#</th>
                    <th style="width: calc(216px - 0.5rem)">Doctor</th>
                    <th style="width: calc(131px - 0.5rem)">Horario</th>
                    <th>Agendados</th>
                    <th>Sobrecupos</th>
                    <th>Atendidos</th>
                    <th>Confirmados</th>
                    <th>Suspendidos</th>
                    <th width="12%">Sin Confirmar</th>
                  </tr>
                </thead>

                <tbody>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Asignar valores y parametros del Iframe
    iframeState.html.src = 'https://reservo.cl/appointment/listAppointmentDay/';
    iframeState.html.id = 'agenda-iframe';
    iframeState.html.addEventListener('load', () => iframeState.callback());
    iframeState.html.setAttribute('style', 'position: absolute; left: -99999px');

    // Inyectar estructuras
    document.querySelector('body').append(modalHTML);
    modalHTML.append(iframeState.html);

    // Setear datePicker
    $('#resumen-modal-innerBody input')
      .datepicker({
        dateFormat: 'dd-mm-yy',
        changeMonth: true,
        changeYear: true,
        yearRange: `2024:${new Date().getFullYear()}`,
        onSelect: (e) => {
          this.blur();

          setTimeout(() => {
            setDate(e);
          }, 10);
        },
      })
      .change(({ target }) => {
        setDate(target.value);
      });

    // Eventos a los botones
    document.querySelectorAll('#resumen-modal-innerBody button').forEach((value, k) => {
      value.addEventListener('click', () => {
        // Hoy
        if (k === 0) {
          if (iframeState.isReady) {
            setDate(dateFormat(new Date()));
          }
        }

        // <
        if (k === 1) {
          if (iframeState.isReady) {
            const currentDate = document.querySelector('#resumen-modal-innerBody input').value;
            const dateArray = getDateArray(currentDate);

            setDate(dateFormat(new Date(dateArray[2], dateArray[1] - 1, dateArray[0] - 1)));
          }
        }

        // >
        if (k === 2) {
          if (iframeState.isReady) {
            const currentDate = document.querySelector('#resumen-modal-innerBody input').value;
            const dateArray = getDateArray(currentDate);

            setDate(dateFormat(new Date(dateArray[2], dateArray[1] - 1, dateArray[0] + 1)));
          }
        }

        // Sincronizar
        if (k === 3) {
          if (iframeState.isReady) {
            setDateControls(false);

            (async () => {
              const reservoContainer = document.querySelector('.multiselect-container');
              const reservoDoctorsList = reservoContainer.querySelectorAll('li label');
              const { doctorList } = iframeState.currentData;
              const foundList = [];

              // Obtener lista de doctores a sincronizar
              reservoDoctorsList.forEach((valua) => {
                const name = valua.innerText.trim().replace(/\s+/g, ' ');
                const input = valua.querySelector('input');

                // Deseleccionar doctor si esta previamente seleccionado
                if (input.checked) {
                  input.checked = false;
                  input.dispatchEvent(new Event('change'));
                }

                // Agregar al array si corresponde
                if (name in doctorList) {
                  foundList.push({ input, data: doctorList[name] });
                }
              });

              // Seleccionar doctores en base a la lista
              for (const { input } of foundList) {
                input.checked = true;
                input.dispatchEvent(new Event('change'));

                await new Promise((resolve) => setTimeout(() => resolve(), 15));
              }

              // Sincronizar fecha con la fecha del modal
              const currentDate = $('#resumen-modal-innerBody input').val();
              const script = document.createElement('script');

              // Inyectar datepickerInjection al DOM
              script.src = chrome.runtime.getURL('datepickerInjection.js');
              script.id = 'datepicker-injection';
              script.setAttribute('data', currentDate);
              script.onload = () => script.remove();

              document.querySelector('body').append(script);

              // Repetir procesos hasta que todo se encuentre correctamente cargado
              let fixer = 0;

              while (true) {
                const foundSchedule = [];

                // Buscar y almacenar todos los calendarios actuales
                document.querySelectorAll('#contenedor-calendario td').forEach((valua) => {
                  // Solo almacenar si tienen ID de calendario, y tienen contenido
                  if (valua.id.includes('schedule_') && valua.innerHTML !== '') {
                    foundSchedule.push(valua);
                  }
                });

                // Si las agendas cargadas corresponden a las obtenidas en el resumen
                // O el ciclo se ha repetido mucho (reservo dio error)
                if (foundSchedule.length === foundList.length || fixer > 7) {
                  let isReady = true;

                  // Recorrer calendarios
                  foundSchedule.forEach((valua) => {
                    // prettier-ignore
                    const schedule = valua.querySelector('.fc-content-skeleton .fc-event-container');

                    // Asignar a falso si alguna agenda aun no tiene sus elementos cargados
                    isReady = schedule.children.length !== 0 ? true : false;
                  });

                  // Finalizar bucle si corresponde
                  if (isReady) {
                    break;
                  }
                }

                // Mardito reservo
                fixer++;

                await new Promise((resolve) => setTimeout(() => resolve(), 50));
              }

              // Recargar Pagina
              location.reload();
            })();
          }
        }
      });
    });
  }

  function buildResumenButton() {
    const motherButton = document.querySelector('#barra_agendas a:last-child');
    const resumenButton = motherButton.cloneNode(true);

    resumenButton.href = '';
    resumenButton.querySelector('span').innerHTML = 'Resumen del Dia';
    resumenButton.querySelectorAll('img').forEach((value) => value.remove());
    resumenButton.onclick = (e) => e.preventDefault();
    resumenButton.addEventListener('click', () => {
      document.querySelector('#resumen-modal').style.display = 'block';

      // Sicronizar fecha con la asignada en reservo
      setDate($('#datepicker').val());
      setDateControls(false);
    });

    motherButton.parentElement.append(resumenButton);
  }

  function setDateControls(e) {
    if (e) {
      document
        .querySelectorAll('#resumen-modal-innerBody #innerBody-date .date-controls')
        .forEach((value) => {
          value.removeAttribute('disabled');
        });

      iframeState.isReady = true;
    } else {
      document
        .querySelectorAll('#resumen-modal-innerBody #innerBody-date .date-controls')
        .forEach((value) => {
          value.setAttribute('disabled', '');
        });

      iframeState.isReady = false;
    }
  }

  function setDate(e) {
    const mainHTML = document.querySelector('#resumen-modal-innerBody');

    // Aplicar cambios al datePicker
    $('#innerBody-date input').datepicker('setDate', e);
    mainHTML.querySelector('#innerBody-date span').innerHTML = datePickerFormat(e);

    // Procesos extraccion de datos del iframe
    iframeState.callback = () => {
      // Obtener HTMLs internos del iframe
      iframeState.init();
      setDateControls(true);

      // Obtener tabla de citas
      const rowsHTML = iframeState.document.querySelectorAll('#citasdia tbody tr');
      const data = {
        prp: { juan: [], sanguino: [] },
        visco: { juan: [], sanguino: [] },
        ozono: { juan: [], sanguino: [] },
        infilt: { juan: [], sanguino: [] },
        eco: { juan: [], sanguino: [] },
        electro: 0,
        schedule: {
          from: { value: 0, text: '' },
          to: { value: 0, text: '' },
          relative: { value: 0, text: '' },
        },
        doctorList: {},
        Agendados: 0,
        Sobrecupos: 0,
        Atendidos: 0,
        Confirmados: 0,
        Suspendidos: 0,
        SinConfirmar: 0,
      };

      // Recorrer tabla de citas
      rowsHTML.forEach((value) => {
        const currentRowData = {};

        // Recorrer celdas del row y extraer datos
        value.querySelectorAll('td').forEach((valua, k) => {
          const currentValue = valua.innerText;

          // 0: Hora
          if (k === 0) {
            currentRowData.hora = currentValue;
          }

          // 1:	RUT
          if (k === 1) {
            currentRowData.rut = currentValue;
          }

          // 3:	Descripción/Tratamiento
          if (k === 3) {
            currentRowData.tratamiento = currentValue;
          }

          // 5:	Estado
          if (k === 5) {
            const estadoArray = {
              A: 'Atendido',
              C: 'Confirmado',
              NC: 'No Confirmado',
              NL: 'No llegó',
              S: 'Suspendió',
              D: 'Pago descartado',
              LL: 'Llegó',
              LE: 'Lista de Espera',
              LAA: 'Listo para ser atendido',
            };

            currentRowData.estado = estadoArray[valua.children[0].value];
          }

          // 8:	Box/Prof
          if (k === 8) {
            currentRowData.doctor = currentValue;
          }
        });

        // Organizar datos por doctor
        // Si el doctor no existe en el array preparar objeto con el doctor correspondiente
        if (!(currentRowData.doctor in data.doctorList)) {
          data.doctorList[currentRowData.doctor] = {
            name: currentRowData.doctor,
            schedule: {
              from: { value: 0, text: '' },
              to: { value: 0, text: '' },
              relative: { value: 0, text: '', minutes: 0 },
            },
            Agendados: 0,
            Sobrecupos: 0,
            Atendidos: 0,
            Confirmados: 0,
            Suspendidos: 0,
            SinConfirmar: 0,
            pxList: [],
          };
        }

        // Agregar px en el array que corresponda
        data.doctorList[currentRowData.doctor].pxList.push({
          rut: currentRowData.rut,
          hora: getHourValues(currentRowData.hora),
          tratamiento: currentRowData.tratamiento,
          estado: currentRowData.estado,
          sobrecupo: false,
        });
      });

      // Recorrer lista de doctores y generar estadisticas
      Object.entries(data.doctorList).forEach(([, value]) => {
        // Recorrer pacientes agendados al doctor
        value.pxList.forEach((valua, k) => {
          getProcedimientos();
          getHorarios();
          getStats();

          function getProcedimientos() {
            const template = {
              'Dr. Juan Manuel Hernandez Martinez': 'juan',
              'Dr. Seymour Emir Sanguino Ojeda': 'sanguino',
              'Dr. Antonio Leon Velarde': '',
            };

            // Aplicar si el procedimiento es de juan, sanguino o el cardiologo
            if (value.name in template && !isSuspended(valua)) {
              const currentTratamiento = valua.tratamiento.toUpperCase();

              if (currentTratamiento.includes('ECO')) {
                const found = currentTratamiento.match(/ECO/gi);
                const n = found !== null ? found.length : 0;

                // Ingresar la hora del procedimientos el numero de veces encontrado
                for (let i = 0; i < n; i++) {
                  data.eco[template[value.name]].push(valua.hora.from.text);
                }
              } else {
                if (currentTratamiento.includes('VISCO')) {
                  const found = currentTratamiento.match(/VISCO/gi);
                  const exceptions = currentTratamiento.match(/HONORARIOS/gi);

                  const nFound = found !== null ? found.length : 0;
                  const nExceptions = exceptions !== null ? exceptions.length : 0;
                  const n = nFound - nExceptions;

                  // Ingresar la hora del procedimientos el numero de veces encontrado
                  for (let i = 0; i < n; i++) {
                    data.visco[template[value.name]].push(valua.hora.from.text);
                  }
                }

                if (currentTratamiento.includes('PRP')) {
                  const found = currentTratamiento.match(/PRP/gi);
                  const exceptions = currentTratamiento.match(/HONORARIOS/gi);

                  const nFound = found !== null ? found.length : 0;
                  const nExceptions = exceptions !== null ? exceptions.length : 0;
                  const n = nFound - nExceptions;

                  // Ingresar la hora del procedimientos el numero de veces encontrado
                  for (let i = 0; i < n; i++) {
                    data.prp[template[value.name]].push(valua.hora.from.text);
                  }
                }

                if (currentTratamiento.includes('OZONO')) {
                  const found = currentTratamiento.match(/OZONO/gi);
                  const n = found !== null ? found.length : 0;

                  // Ingresar la hora del procedimientos el numero de veces encontrado
                  for (let i = 0; i < n; i++) {
                    data.ozono[template[value.name]].push(valua.hora.from.text);
                  }
                }

                if (currentTratamiento.includes('INFILT') || currentTratamiento.includes('ARTRO')) {
                  const foundInf = currentTratamiento.match(/INFILT/gi);
                  const foundArt = currentTratamiento.match(/ARTRO/gi);
                  const nInf = foundInf !== null ? foundInf.length : 0;
                  const nArt = foundArt !== null ? foundArt.length : 0;
                  const n = nInf + nArt;

                  // Ingresar la hora del procedimientos el numero de veces encontrado
                  for (let i = 0; i < n; i++) {
                    data.infilt[template[value.name]].push(valua.hora.from.text);
                  }
                }
              }

              if (currentTratamiento.includes('ELECTROCARDIOGRAMA')) {
                data.electro += 1;
              }
            }
          }

          function getHorarios() {
            // Aplicar horarios solo si el px no esta suspendido
            if (!isSuspended(valua)) {
              // Proceder si no es un electrocardiograma
              if (valua.tratamiento !== 'ELECTROCARDIOGRAMA') {
                setSchedule(data.schedule, valua.hora);
                setSchedule(value.schedule, valua.hora);

                setRelativeSchedule(value.schedule, valua.hora);

                // Aplicar relative a Data
                setSchedule(data.schedule, value.schedule, true);
              }
            }
          }

          function getStats() {
            if (valua.tratamiento !== 'ELECTROCARDIOGRAMA') {
              if (valua.estado === 'Suspendió' || valua.estado === 'No llegó') {
                value.Suspendidos += 1;
              }
              // Agregar al stat de agendados solo si no esta suspendido
              else {
                if (valua.estado === 'Atendido' || valua.estado === 'Llegó') {
                  value.Atendidos += 1;
                }

                if (valua.estado === 'Confirmado') {
                  value.Confirmados += 1;
                }

                if (valua.estado === 'No Confirmado') {
                  value.SinConfirmar += 1;
                }

                // Comprobar Sobrecupo
                for (let i = 0; i < value.pxList.length; i++) {
                  const currentFrom = valua.hora.from.value;
                  const foundFrom = value.pxList[i].hora.from.value;
                  const foundTo = value.pxList[i].hora.to.value;

                  // Si el paciente no esta suspendido
                  if (!isSuspended(value.pxList[i])) {
                    // Y la hora encontrada esta dentro del comienzo de la actual
                    if (currentFrom >= foundFrom && currentFrom < foundTo) {
                      // Y no es el mismo paciente
                      if (valua.rut !== value.pxList[i].rut) {
                        // Y no fue contado como sobrecupo anteriormente ni el paciente actual ni el del array
                        if (!valua.sobrecupo && !value.pxList[i].sobrecupo) {
                          valua.sobrecupo = true;
                          value.Sobrecupos += 1;
                        }
                      }
                    }
                  }
                }

                value.Agendados += 1;
              }
            }
          }
        });

        // Obtener stats globales
        if (value.Agendados > 0) {
          data.Agendados += value.Agendados;
          data.Sobrecupos += value.Sobrecupos;
          data.Atendidos += value.Atendidos;
          data.Confirmados += value.Confirmados;
          data.Suspendidos += value.Suspendidos;
          data.SinConfirmar += value.SinConfirmar;
        } else {
          delete data.doctorList[value.name];
        }
      });

      // Presentar Resultados
      renderResults(data);

      // Aplicar data al iframeState
      iframeState.currentData = data;

      /*
        Funciones del proceso

      */
      // Aplicar horas a las respectivas variables
      function setSchedule(e, a, r = false) {
        // Aplicar valores si el horario al comienzo es menor que el registrado
        if (e.from.value === 0 || e.from.value > a.from.value) {
          e.from.value = a.from.value;
          e.from.text = a.from.text;
        }

        // Aplicar valores si el horario al final es mayor que el registrado
        if (e.to.value === 0 || e.to.value < a.to.value) {
          e.to.value = a.to.value;
          e.to.text = a.to.text;
        }

        // Aplicar valores al Relative de Data
        if (r) {
          if (e.relative.value === 0 || e.relative.value < a.relative.value) {
            e.relative.value = a.relative.value;
            e.relative.text = a.relative.text;
          }
        }
      }

      function setRelativeSchedule(e, a) {
        const currentMinutes = getMinutes(a);
        e.relative.minutes = e.relative.minutes + currentMinutes;

        // Aplicar valores si los minutos corresponden a mas del horario final registrado
        const relativeCurrentTo = getRelativeCurrentTo();

        if (e.relative.value < relativeCurrentTo) {
          const tempText =
            String(relativeCurrentTo).length === 4
              ? `${relativeCurrentTo}`
              : `0${relativeCurrentTo}`;
          const tampText = `${tempText.slice(0, 2)}:${tempText.slice(2, 4)}`;

          e.relative.value = relativeCurrentTo;
          e.relative.text = tampText;
        }

        // Calcular Horario final relativo
        function getRelativeCurrentTo() {
          // Descomponer valor del horario a minutos
          const relativeFromHours = Number(
            String(e.from.value).length === 4
              ? String(e.from.value).slice(0, 2)
              : String(e.from.value)[0]
          );

          const relativeFromTotal = e.from.value - 40 * relativeFromHours;
          let relativeCurrentTo = relativeFromTotal + e.relative.minutes;
          let relativeCurrentToValue = 0;

          // Rearmar valor relativo sumando el tiempo de las citas
          while (relativeCurrentTo !== 0) {
            if (relativeCurrentTo >= 60) {
              relativeCurrentToValue += 100;
              relativeCurrentTo -= 60;
            } else {
              relativeCurrentToValue += relativeCurrentTo;
              relativeCurrentTo = 0;
            }
          }

          return relativeCurrentToValue;
        }
      }

      // Obtener From-To de una agenda
      function getHourValues(e) {
        const [fromHour, toHour] = e.replaceAll(' ', '').split('-');
        return {
          from: {
            value: Number(fromHour.replace(':', '')),
            text: fromHour,
          },
          to: {
            value: Number(toHour.replace(':', '')),
            text: toHour,
          },
        };
      }

      // Obtener minutos totales de un periodo de tiempo
      function getMinutes({ from, to }) {
        const fromHours = Number(
          String(from.value).length === 4 ? String(from.value).slice(0, 2) : String(from.value)[0]
        );

        const toHours = Number(
          String(to.value).length === 4 ? String(to.value).slice(0, 2) : String(to.value)[0]
        );

        const tFrom = from.value - 40 * fromHours;
        const tTo = to.value - 40 * toHours;

        return tTo - tFrom;
      }

      // Verificar si el paciente esta suspendido o no llego
      function isSuspended(e) {
        if (e.estado === 'Suspendió' || e.estado === 'No llegó') {
          return true;
        }

        return false;
      }
    };

    // Cambiar fecha en el date del iframe
    if (iframeState.dateHTML !== null) {
      const dateArray = getDateArray(e);
      const selectedDate = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;

      iframeState.dateHTML.value = selectedDate;
      iframeState.dateSubmit.click();
      setDateControls(false);
      renderResults(false);
    }

    function renderResults(e) {
      const procedimientosHTML = mainHTML.querySelectorAll('.innerBody-resumen-div')[0];
      const procedimientosRows = procedimientosHTML.querySelectorAll('tbody tr');
      const totalesHTML = mainHTML.querySelectorAll('.innerBody-resumen-div')[1];
      const totalesRows = totalesHTML.querySelectorAll('ul')[1].children;
      const agendasHTML = mainHTML.querySelector('#innerBody-agendas tbody');

      // Presentar datos
      if (e) {
        // Procedimientos
        setProcedimientos(procedimientosRows[0].children[1], e.prp.juan);
        setProcedimientos(procedimientosRows[0].children[2], e.prp.sanguino);
        setProcedimientos(procedimientosRows[1].children[1], e.visco.juan);
        setProcedimientos(procedimientosRows[1].children[2], e.visco.sanguino);
        setProcedimientos(procedimientosRows[2].children[1], e.ozono.juan);
        setProcedimientos(procedimientosRows[2].children[2], e.ozono.sanguino);
        setProcedimientos(procedimientosRows[3].children[1], e.infilt.juan);
        setProcedimientos(procedimientosRows[3].children[2], e.infilt.sanguino);
        setProcedimientos(procedimientosRows[4].children[1], e.eco.juan);
        setProcedimientos(procedimientosRows[4].children[2], e.eco.sanguino);
        setProcedimientos(procedimientosRows[5].children[1], e.electro);

        // Totales
        const totalRelative =
          e.schedule.relative.value > e.schedule.to.value
            ? `<i>(${e.schedule.relative.text})</i>`
            : '';

        totalesRows[0].innerHTML = `${e.schedule.from.text} - ${e.schedule.to.text} ${totalRelative}`;
        setTotales(totalesRows[1], Object.keys(e.doctorList).length);
        setTotales(totalesRows[2], e.Agendados);
        setTotales(totalesRows[3], e.Sobrecupos);
        setTotales(totalesRows[4], e.Atendidos);
        setTotales(totalesRows[5], e.Confirmados);
        setTotales(totalesRows[6], e.Suspendidos);
        setTotales(totalesRows[7], e.SinConfirmar);

        // Agendas
        // Organizar lista
        const sortedList = [];

        Object.entries(e.doctorList).forEach(([, value]) => {
          const temp = { ...value };
          temp.n = temp.schedule.from.value;

          sortedList.push(temp);
        });

        sortedList.sort((a, b) => a.n - b.n);

        // Presentar lista
        sortedList.forEach((value, k) => {
          const tempRow = document.createElement('tr');
          relativeDoctor = tempRow.innerHTML = `
            <td style="text-align: center; border-right: 1px solid;">${k + 1}</td>
            <td style="max-width: calc(216px - 0.5rem);">${value.name}</td>
            <td style="width: calc(131px - 0.5rem); text-align: center;">
              ${value.schedule.from.text} - ${value.schedule.to.text}
              ${
                value.schedule.relative.value > value.schedule.to.value
                  ? `
                <br>
                <i style="font-size: smaller;">
                  (${value.schedule.from.text} - ${value.schedule.relative.text})
                </i>
                `
                  : ''
              }
            </td>
            <td style="
              font-size: larger;
              text-align: center;
              border-right: 1px solid;
              border-left: 1px solid;
            ">${value.Agendados}</td>
            <td style="
              font-size: larger;
              text-align: center;
              border-right: 1px solid;
            ">${value.Sobrecupos}</td>
            <td style="text-align: center; font-size: larger;">${value.Atendidos}</td>
            <td style="text-align: center; font-size: larger;">${value.Confirmados}</td>
            <td style="text-align: center; font-size: larger;">${value.Suspendidos}</td>
            <td style="text-align: center; font-size: larger;">${value.SinConfirmar}</td>
          `;

          agendasHTML.append(tempRow);
        });
      }
      // Limpiar Datos
      else {
        procedimientosRows.forEach((value) => {
          setProcedimientos(value.children[1], 'reset');

          if (value.children.length === 3) {
            setProcedimientos(value.children[2], 'reset');
          }
        });

        for (const value of totalesRows) {
          setTotales(value, 'reset');
        }

        agendasHTML.innerHTML = '';
      }

      // Aplicar cambios a cada seccion
      function setProcedimientos(html, e) {
        if (e === 'reset') {
          html.parentElement.removeAttribute('has-value');
          html.innerHTML = '-';
          html.removeAttribute('title');

          return;
        }

        if (e.length > 0) {
          html.parentElement.setAttribute('has-value', '');
          html.innerHTML = e.length;
          html.title = e.join(', ');
        } else {
          html.innerHTML = '';
        }
      }

      function setTotales(html, e) {
        if (e === 'reset') {
          html.removeAttribute('has-value');
          html.innerHTML = '-';

          return;
        }

        if (e > 0) {
          html.setAttribute('has-value', '');
        }

        html.innerHTML = e;
      }
    }
  }
}

// Detectar URL de la pagina. (Rutificador)
if (window.location.href === 'https://www.nombrerutyfirma.com/') {
  chrome.runtime.sendMessage({
    msg: 'rutificadorCall',
  });
}

// Generar mensaje de confirmacion
function generateMessage() {
  let nameHTML = document.getElementById('id_title');
  let doctorHTML = document.getElementById('select2-id_servicios__edit-container');

  if (nameHTML !== null && modalState) {
    let nameValue = nameHTML.value;
    let nameType = nameValue.slice(0, 4);

    if (nameType.toUpperCase() === 'NP: ') {
      let name = nameValue.slice(4);
      let doctor = doctorHTML.innerHTML;

      // Preparar nombre de doctor
      doctor = doctor.replace('Dr. ', '');
      doctor = doctor.replace('Dra. ', '');
      doctor = doctor.replace('Dr.', '');
      doctor = doctor.replace('Dra.', '');
      doctor = doctor.toUpperCase();

      /*
          Codigo Robado

      */
      var codigo = document.querySelector('#id_phone__edit_0').value.replace('+', '');
      var numero = document.querySelector('#id_phone__edit_1').value;
      // Numero Invalido
      if (numero.length !== 9) {
        alert('Para enviar mensaje debe ingresar un número válido.');
        return;
      }

      numero = numero.replace('+', '');
      numero = '56' + numero;

      var options = { year: 'numeric', month: 'long', day: 'numeric' };

      var hora = document.querySelector('#id_horaInicio__edit').value;
      var centro = 'Clinica Provincia De Petorca';
      let encoded = encodeURI(centro);
      let centro_decoded = decodeURI(encoded);
      var options = { year: 'numeric', month: 'long', day: 'numeric' };
      var fecha = document.querySelector('#id_fecha').value;
      var parts = fecha.split('-');
      var fecha = new Date(parts[0], parts[1] - 1, parts[2]);
      fecha = fecha.toLocaleDateString('es-ES', options);

      let text =
        'Hola ' +
        name +
        ' ¿Confirma su cita en ' +
        centro_decoded +
        ' el ' +
        fecha +
        ' a las ' +
        hora +
        ' horas con el profesional ' +
        doctor +
        '? Favor confirmar con SI o NO';

      if (withoutLicence.includes(doctor)) {
        text +=
          '\n\nLe recordamos que el profesional no emite Licencias Medicas. Disculpe los inconvenientes que pueda causarle.';
      }

      return { text, numero };
    } else {
      alert('Por favor seleccione una cita que no haya sido atendida.');
    }
  } else {
    alert('Por favor seleccione la cita a enviar el mensaje.');
  }

  return null;
}

// Aplicar formato al rut
function format(e) {
  const breakPoints = [3, 6, 9];
  let text = '';
  let k = 0;

  while (k < e.length - 2) {
    const current = e.length - 3 - k;

    if (breakPoints.includes(k)) {
      text = '.' + text;
    }

    text = e.charAt(current) + text;
    k++;
  }

  return `${text}-${e.charAt(e.length - 1)}`;
}

// Aplicar formato a un valor
function formatValue(e) {
  const value = e.toString();
  const breakPoints = [3, 6, 9];
  let text = '';
  let k = 0;

  while (k < value.length) {
    const current = value.length - k - 1;

    if (breakPoints.includes(k)) {
      text = '.' + text;
    }

    text = value.charAt(current) + text;
    k++;
  }

  return text;
}

// Crear estructura de presentacion de datos
function buildInfoViewer() {
  // Limpiar espacio y preparar representacion de datos
  try {
    // Solo si es la primera vez abriendo una planilla
    const infoViewerHTML = document.createElement('div');
    const parentHTML = document.querySelector('#editAppt #div_alertas_edit').parentElement;

    parentHTML.removeChild(parentHTML.children[2]);
    parentHTML.removeChild(parentHTML.children[1]);

    infoViewerHTML.innerHTML += `
      <style>
        #infoViewerParent {
          user-select: none;
        }

        #infoViewer {
          margin-top: 0.5rem;
          border-spacing: 0 0.5rem;
          border-collapse: separate;
        }

        #infoViewer tr {
          cursor: pointer;
        }

        .infoViewer_color {
          border: 1px solid #cccccc;
          border-radius: 12rem;
          width: 16px;
        }

        .infoViewer_color[color="blue"] {
          background-color: lightblue;
        }

        .infoViewer_color[color="green"] {
          background-color: lightgreen;
        }

        .infoViewer_color[color="orange"] {
          background-color: gold;
        }

        .infoViewer_color[color="red"] {
          background-color: lightcoral;
        }

        .infoViewer_text {
          padding-left: 0.5rem;
        }
      </style>

      <table id="infoViewer">
        <tbody>
          <tr id="infoViewer-RUT">
            <td class="infoViewer_color" color="blue"></td>
            <td class="infoViewer_text">RUT</td>
          </tr>

          <tr id="infoViewer-Name">
            <td class="infoViewer_color" color="blue"></td>
            <td class="infoViewer_text">Nombre</td>
          </tr>

          <tr id="infoViewer-Birthday">
            <td class="infoViewer_color" color="blue"></td>
            <td class="infoViewer_text">Fecha de Nacimiento</td>
          </tr>

          <tr id="infoViewer-Double">
            <td class="infoViewer_color" color="blue"></td>
            <td class="infoViewer_text">Duplicado</td>
          </tr>
        </tbody>
      </table>
    `;

    parentHTML.id = 'infoViewerParent';
    parentHTML.append(infoViewerHTML);
  } catch (e) {
    // De no ser la primera vez, devolver infoViewer a su estado por defecto
    document.querySelector('#infoViewer-RUT').onclick = '';
    document.querySelector('#infoViewer-RUT').removeAttribute('title');
    document.querySelector('#infoViewer-RUT .infoViewer_color').setAttribute('color', 'blue');

    document.querySelector('#infoViewer-Name').onclick = '';
    document.querySelector('#infoViewer-Name').removeAttribute('title');
    document.querySelector('#infoViewer-Name .infoViewer_color').setAttribute('color', 'blue');

    document.querySelector('#infoViewer-Birthday').onclick = '';
    document.querySelector('#infoViewer-Birthday').removeAttribute('title');
    document.querySelector('#infoViewer-Birthday .infoViewer_color').setAttribute('color', 'blue');

    document.querySelector('#infoViewer-Double').onclick = '';
    document.querySelector('#infoViewer-Double').removeAttribute('title');
    document.querySelector('#infoViewer-Double .infoViewer_color').setAttribute('color', 'blue');
  }
}

// Crear estructura de organizador de Nombres
function buildNameSorter() {
  // Limpiar espacio y preparar representacion de datos
  try {
    // Solo si es la primera vez abriendo una planilla
    const nameSorterHTML = document.createElement('div');
    const parentHTML = document.querySelector('#createAppt #div_alertas').parentElement;

    parentHTML.removeChild(parentHTML.children[2]);
    parentHTML.removeChild(parentHTML.children[1]);

    nameSorterHTML.innerHTML += `
      <style>
        #nameSorterParent {
          user-select: none;
        }

        #nameSorterParent #nameSorter {
          display: flex;
          flex-wrap: wrap;

          margin-left: 5.5rem;
          cursor: pointer;
        }
          
        #nameSorterParent #nameSorter span {
          padding: 6px;
          margin: 0 0.7rem 0.7rem 0;

          border: 1px solid #cccccc;
          border-radius: 0.5rem;
          background-color: aliceblue;
        }

        #nameSorterParent #nameSorter span:hover {
          background-color: antiquewhite;
        }
      </style>

      <div id="nameSorter">
      </div>
    `;

    parentHTML.id = 'nameSorterParent';
    parentHTML.append(nameSorterHTML);
  } catch (e) {
    // De no ser la primera vez, limpiar nameSorter
    document.querySelector('#nameSorter').innerHTML = '';
  }
}

// Procesar datos y aplicar cambios
function infoViewer() {
  const rutHTML = document.querySelector('#infoViewer-RUT');
  const birthdayHTML = document.querySelector('#infoViewer-Birthday');
  const doubleHTML = document.querySelector('#infoViewer-Double');

  // Comprobar RUT
  rutHTML.onclick = () => window.open(clientData.userLink, '_blank');
  if (clientData.Rut === 'No definida' || clientData.Rut === 'No definido') {
    rutHTML.children[0].setAttribute('color', 'red');
  } else {
    rutHTML.setAttribute('title', format(clientData.Rut));
    rutHTML.children[0].setAttribute('color', 'green');
  }

  // Comprobar Fecha de Nacimiento
  birthdayHTML.onclick = () => window.open(clientData.userLink, '_blank');
  if (clientData['Fecha de nacimiento'] === 'No definida') {
    birthdayHTML.children[0].setAttribute('color', 'red');
  } else {
    birthdayHTML.setAttribute('title', `${clientData.Edad} Años`);
    birthdayHTML.children[0].setAttribute('color', 'green');
  }

  // Comprobar Paciente duplicado
  doubleHTML.setAttribute('title', clientData.duplicated.length);
  if (clientData.duplicated.length !== 1) {
    // Comprobar que este duplicado mas que no exista (sin RUT)
    if (clientData.duplicated.length !== 0) {
      doubleHTML.children[0].setAttribute('color', 'red');
      doubleHTML.onclick = () => {
        // Copiar RUT al portapapeles
        navigator.clipboard.writeText(clientData.Rut);

        // Abrir pestaña de fusion
        window.open(
          `https://reservo.cl/pacienteDentista/asociarPacientes/${clientData.duplicated[0].id}/`,
          '_blank'
        );
      };
    }
    // Si el rut no existe, no presentar un color.
    else {
      doubleHTML.children[0].setAttribute('color', '');
    }
  } else {
    doubleHTML.children[0].setAttribute('color', 'green');
  }
}

// Procesar datos y aplicar cambios
function infoViewerName() {
  const nameHTML = document.querySelector('#infoViewer-Name');

  // Comprobar Nombre
  nameHTML.setAttribute('title', clientData.fullName);
  nameHTML.onclick = () => {
    // Solo copiar si el nombre existe
    if (clientData.fullName !== 'No Registrado' && clientData.fullName !== 'Solicitud Rechazada')
      navigator.clipboard.writeText(clientData.fullName).then(() => {
        alert(`Nombre copiado al portapapeles:\n\n${clientData.fullName}`);
      });
  };

  if (clientData.fullName === 'No Registrado') {
    nameHTML.children[0].setAttribute('color', 'orange');
  } else if (clientData.fullName === 'Solicitud Rechazada') {
    nameHTML.children[0].setAttribute('color', '');
  } else {
    const slicedName = nameSlicer(clientData.name);
    let ok = true;

    slicedName.forEach((value) => {
      if (!clientData.fullName.toLowerCase().includes(value)) {
        ok = false;
      }
    });

    if (!ok) {
      nameHTML.children[0].setAttribute('color', 'red');
    } else {
      nameHTML.children[0].setAttribute('color', 'green');
    }
  }
}

// Crear boton y eventos del Check Rut al registrar cliente
function buildRutButtonCheck() {
  const buttonCheck = document.getElementById('check-rut');

  // Crear boton
  if (buttonCheck === null) {
    const mainHTML = document.querySelector('#tr_id_rut').children[0];
    const button = document.createElement('div');

    mainHTML.style.position = 'relative';

    button.id = 'check-rut';
    button.innerHTML = `
      <style>
        #check-rut {
            position: absolute;
            right: 0.5rem;
            top: 3px;
            height: 26px;
            width: 26px;

            background-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20448%20512%22%3E%3Cpath%20d%3D%22M64%2080c-8.8%200-16%207.2-16%2016l0%20320c0%208.8%207.2%2016%2016%2016l320%200c8.8%200%2016-7.2%2016-16l0-320c0-8.8-7.2-16-16-16L64%2080zM0%2096C0%2060.7%2028.7%2032%2064%2032l320%200c35.3%200%2064%2028.7%2064%2064l0%20320c0%2035.3-28.7%2064-64%2064L64%20480c-35.3%200-64-28.7-64-64L0%2096zM337%20209L209%20337c-9.4%209.4-24.6%209.4-33.9%200l-64-64c-9.4-9.4-9.4-24.6%200-33.9s24.6-9.4%2033.9%200l47%2047L303%20175c9.4-9.4%2024.6-9.4%2033.9%200s9.4%2024.6%200%2033.9z%22%2F%3E%3C%2Fsvg%3E');
            background-position: center;
            background-repeat: no-repeat;
            background-color: transparent;
            border: none;

            cursor: pointer;
        }
      </style>
    `;

    mainHTML.append(button);
    buildRutButtonCheck();
  }
  // Asignar evento cada vez que se abra la planilla
  else {
    buttonCheck.onclick = () => {
      // Obtener rut del Input
      const rutValue = document.querySelector('#tr_id_rut input[name=rut]').value;

      // Enviar al background
      if (rutValue !== '') {
        // Asignar el ID de reservo para devolver la informacion
        chrome.runtime.sendMessage({
          msg: 'setReservoID',
        });

        // Enviar RUT a verificar
        chrome.runtime.sendMessage({
          msg: 'rutificadorSet',
          payload: format(rutValue),
        });
      } else {
        alert('El RUT no puede estar vacio.');
      }
    };
  }
}

// Presentar rut en casilla de Comentarios al registrar cliente & mostrar nameSorter
function checkViewer(e) {
  const commentsHTML = document.querySelector('#id_comentario');
  commentsHTML.value = e;

  // Si existe el nombre, preparar nameSorter
  if (e !== 'No Registrado' && e !== 'Solicitud Rechazada') {
    const nameHTML = document.querySelector('#id_name');
    const last0HTML = document.querySelector('#id_app_paterno');
    const last1HTML = document.querySelector('#id_app_materno');
    const nameSorterHTML = document.querySelector('#nameSorter');
    const slicedName = nameSlicer(e);
    const nameOrder = {
      2: [
        { name: '1', last0: '2', last1: '' },
        { name: '2', last0: '1', last1: '' },
      ],
      3: [
        { name: '3', last0: '1', last1: '2' },
        { name: '2', last0: '3', last1: '1' },
      ],
      4: [
        { name: '34', last0: '1', last1: '2' },
        { name: '234', last0: '1', last1: '' },
        { name: '4', last0: '123', last1: '' },
      ],
      5: [
        { name: '345', last0: '1', last1: '2' },
        { name: '2345', last0: '1', last1: '' },
        { name: '45', last0: '123', last1: '' },
      ],
      6: [
        { name: '3456', last0: '1', last1: '2' },
        { name: '56', last0: '123', last1: '4' },
        { name: '56', last0: '1', last1: '234' },
      ],
    };

    // Reiniciar nameSorter
    nameSorterHTML.innerHTML = '';

    // Si el tamaño del nombre existe en la lista, proceder
    if (slicedName.length in nameOrder) {
      // Recorrer lista de Organizacion segun el tamaño del nombre
      nameOrder[`${slicedName.length}`].forEach((value) => {
        // Generar un boton por cada elemento en el array
        const currentHTML = document.createElement('span');
        currentHTML.innerHTML = value.name + value.last0 + value.last1;

        // Asignar eventos
        currentHTML.addEventListener('mouseover', () => {
          applyName(value);
        });
        currentHTML.addEventListener('mouseout', () => {
          nameHTML.value = '';
          last0HTML.value = '';
          last1HTML.value = '';
        });
        currentHTML.addEventListener('click', () => {
          applyName(value);
          commentsHTML.value = '';
          nameSorterHTML.innerHTML = '';
        });

        // Inyectar en el modal
        nameSorterHTML.append(currentHTML);

        function applyName(e) {
          toApply(e.name, nameHTML);
          toApply(e.last0, last0HTML);
          toApply(e.last1, last1HTML);

          // Armar nombre segun el slicedName
          function toApply(name, html) {
            let k = 0;
            let text = '';

            for (const valua of name) {
              if (k !== 0) {
                text += ' ';
              }

              text += slicedName[valua - 1];
              k++;
            }

            html.value = text;
          }
        }
      });
    }
    // Caso contrario, informar de nombre incompatible
    else {
      const currentHTML = document.createElement('span');
      currentHTML.innerHTML = 'Nombre Incompatible.';

      // Inyectar en el modal
      nameSorterHTML.append(currentHTML);
    }
  }
}

// Divisor de nombres a Array
function nameSlicer(name) {
  const slicedName = [];
  let k = 0;

  // Separar nombre en partes de un array
  for (const e of name) {
    if (e !== ' ') {
      const isSpecial = vocalArray.findIndex((value) => value === e);
      let tempChar;

      if (isSpecial !== -1) {
        // Si el caracter es especial, convertir en normal
        if (isSpecial >= 0 && isSpecial <= 9) tempChar = 'a';
        if (isSpecial >= 10 && isSpecial <= 16) tempChar = 'e';
        if (isSpecial >= 17 && isSpecial <= 22) tempChar = 'i';
        if (isSpecial >= 23 && isSpecial <= 30) tempChar = 'o';
        if (isSpecial >= 31 && isSpecial <= 38) tempChar = 'u';
      } else {
        // Si no es el caso, proceder normalmente
        tempChar = e;
      }

      if (typeof slicedName[k] === 'undefined') {
        slicedName[k] = tempChar;
      } else {
        slicedName[k] += tempChar;
      }
    } else {
      k++;
    }
  }

  return slicedName;
}

/*
  Extension de Ventas

*/
// Escuchar evento al cambiar el medio de pago
try {
  // De cliente ya registrado
  new MutationObserver(() => {
    const voucherInput = getVoucherInput();

    if (voucherInput !== null) {
      const localResp = Number(localStorage.getItem('voucher'));
      const internalValue = localResp !== 0 ? localResp + 1 : null;

      if (internalValue !== null) {
        voucherInput.value = internalValue;
      }

      voucherInput.style.backgroundColor = 'lightyellow';
      getCurrentVoucher(voucherInput);
    }
  }).observe(document.querySelector('#tr_id_tipoPago_1').parentElement, { childList: true });
} catch (e) {}

// Deseleccionar automaticamente el boton de imprimir boleta
// Enviar RUT a Fonasa
try {
  // Inyectar solo si se encuentra en el modulo de ventas
  if (document.title === 'Venta') {
    /*
      Guardar Vaucher en el localStorage

    */
    // Al presionar pagar
    document.querySelector('#confirmar').addEventListener('click', () => {
      const voucherInput = getVoucherInput();

      // Setear solo si el metodo de pago es Debito o Credito
      if (voucherInput !== null) {
        localStorage.setItem('voucher', voucherInput.value);
        document.querySelector('html').setAttribute('paid', 'true');
      }
    });

    /*
      Boton Fonasa

    */
    // Deseleccionar boleta
    document.querySelector("table[style='margin-bottom:0px;'] td input").click();

    // Boton de Enviar RUT
    const copyButton = document.createElement('button');

    // Estilo del boton
    copyButton.setAttribute(
      'style',
      'background-color: unset; border: none; width: 35px; height: 29px; padding: 0'
    );

    // Icono del Boton
    copyButton.innerHTML = `<svg viewBox="0 0 38.761776581426645 32.32075471698113" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1{fill:#05c08a;}.cls-1,.cls-2{stroke-width:0px;}.cls-2{fill:#092f6d;}</style></defs><path d="m49.14,27.71c0,1.55-.87,2.33-2.64,2.33s-2.67-.78-2.67-2.33v-13.05c0-.68.22-1.27.68-1.68.47-.43,1.12-.65,1.99-.65,1.77,0,2.64.78,2.64,2.33v13.05h0Zm-.5-18.83c-.53.56-1.24.84-2.05.84s-1.55-.28-2.08-.84c-.53-.56-.81-1.24-.81-2.05s.28-1.46.87-2.02c.59-.53,1.24-.81,1.99-.81.84,0,1.52.28,2.05.81.53.53.81,1.21.81,2.02s-.25,1.46-.78,2.05" class="cls-2"/><path d="m62.25,20.13c0-1.15-.22-2.05-.68-2.7-.47-.68-1.12-.99-1.93-.99-2.08,0-3.11,1.3-3.11,3.91v7.46c0,1.49-.9,2.24-2.67,2.24s-2.61-.75-2.61-2.24v-7.77c0-2.67.78-4.66,2.3-6,1.55-1.34,3.42-1.99,5.65-1.99,2.58,0,4.51.93,5.78,2.83,1.34-1.9,3.32-2.83,5.97-2.83,2.24,0,4.1.65,5.5,1.99,1.43,1.3,2.14,3.32,2.14,6.06v7.67c0,1.49-.9,2.24-2.67,2.24s-2.61-.75-2.61-2.24v-7.67c0-2.55-.96-3.85-2.86-3.85-.84,0-1.55.34-2.08,1.06-.53.68-.81,1.68-.81,2.92v7.55c0,1.49-.9,2.24-2.67,2.24s-2.61-.75-2.61-2.24v-7.64h-.03Z" class="cls-2"/><path d="m86.11,18.79h6.93c-.16-.84-.53-1.52-1.15-2.05-.62-.5-1.37-.75-2.24-.75-1.9,0-3.08.93-3.54,2.8m-2.92,8.92c-1.68-1.71-2.52-3.91-2.52-6.59s.84-4.72,2.49-6.46c1.65-1.77,3.79-2.64,6.43-2.64s4.54.75,6.12,2.21c1.55,1.46,2.36,3.32,2.36,5.56,0,1.62-.68,2.39-2.02,2.39h-10.13c.09,2.55,1.68,3.79,4.72,3.79,1.27,0,2.64-.31,4.16-.9.68-.25,1.24-.12,1.74.37.47.5.71,1.12.71,1.8s-.31,1.21-.96,1.62c-1.46.93-3.42,1.4-5.81,1.4-3.2.03-5.62-.84-7.3-2.55" class="cls-2"/><path d="m106.06,17.64c-.84.93-1.27,2.08-1.27,3.42,0,1.49.4,2.7,1.18,3.64s1.9,1.37,3.32,1.37,2.45-.47,3.26-1.43c.81-.93,1.21-2.14,1.21-3.57,0-1.34-.4-2.49-1.21-3.42s-1.9-1.43-3.26-1.43c-1.3.03-2.39.5-3.23,1.43m7.71-4.23V4.09c0-.71.22-1.3.68-1.71.47-.4,1.12-.62,1.93-.62,1.77,0,2.67.78,2.67,2.33v15.81c0,1.27-.19,2.49-.53,3.64-.37,1.15-.93,2.27-1.68,3.26-.75,1.03-1.8,1.83-3.11,2.45-1.34.62-2.89.93-4.63.93-2.89,0-5.22-.84-6.93-2.55s-2.58-3.85-2.58-6.43.9-4.91,2.67-6.62,3.91-2.55,6.4-2.55c2.21,0,3.85.47,4.97,1.4l.12-.03Z" class="cls-2"/><path d="m1.04,12.73c0,3.14,1.3,5.93,3.39,7.95l8.39,8.23c1.43,1.4,3.6,3.2,7.02,3.2s5.84-1.99,7.02-3.2l10.1-10.28c.53-.53.87-1.27.87-2.11,0-1.62-1.27-2.89-2.86-2.89-.84,0-1.55.34-2.08.87l-10.41,10.22c-.68.65-1.62,1.06-2.67,1.06-.99,0-1.86-.4-2.52-1.06l-8.7-8.2c-1.03-.93-1.68-2.3-1.68-3.79,0-2.8,2.3-5.1,5.13-5.1,1.46,0,2.77.62,3.73,1.55l1.9,1.8c.5.53,1.24.87,2.08.87,1.62,0,2.89-1.27,2.89-2.95,0-.78-.31-1.46-.78-1.99l-1.99-1.96c-2.02-1.99-4.78-3.23-7.86-3.23C5.95,1.73,1.04,6.67,1.04,12.73" class="cls-2"/><path d="m11.73,15.28c0,.81.31,1.58.87,2.08l5.1,4.57c1.4,1.27,2.95,1.27,4.29,0l11.99-12.37c.5-.53.81-1.24.81-2.05,0-1.55-1.27-2.8-2.86-2.8-.81,0-1.52.31-2.02.81l-9.79,10.1c-.22.22-.5.25-.71.03l-2.67-2.42c-.5-.5-1.24-.84-2.05-.84-1.62-.03-2.95,1.27-2.95,2.89" class="cls-1"/></svg>`;

    // Enviar a Fonasa al dar click
    copyButton.onclick = (e) => {
      e.preventDefault();
      const pxText = document.querySelector('#person b').innerHTML;
      let currentRut = '';
      let k = 0;

      // Extraer RUT del texto
      for (let k = 0; k < pxText.length; k++) {
        const currentChar = pxText.charAt(k);

        if (currentChar !== ' ') {
          currentRut += currentChar;
        } else {
          break;
        }
      }

      // Comprobar que el usuario tenga RUT
      if (parseInt(currentRut.charAt(0)) == currentRut.charAt(0)) {
        chrome.runtime.sendMessage({
          msg: 'backgroundFonasaCall',
          payload: currentRut,
        });
      } else {
        alert('Paciente sin RUT.');
      }
    };

    // Insertar el boton en el HTML
    const clientNameHTML = document.querySelector('#cliente_seleccionado');
    clientNameHTML.insertBefore(copyButton, clientNameHTML.firstChild);

    /*
      Autocompletar Pagos Fonasa

    */
    const paymentModal = document.createElement('div');
    paymentModal.id = 'payment-type-modal';
    paymentModal.innerHTML = `
      <style>
        #payment-type-modal {
          display: none;
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -55%);

          padding: 1.5rem;

          background-color: white;
          border: 1px solid rgb(156 163 175);
          border-radius: 1rem;

          z-index: 999;
        }

        #payment-type-modal button {
          font-size: 28px;
          padding: 3rem;
          border: 1px solid rgb(156 163 175);
          border-radius: 1rem;
          margin: 0.5rem;

          color: white;
          border: 1px solid rgb(156 163 175);
        }

        #payment-type-modal #efectivo-button {
          background-color: #338833;
        }

        #payment-type-modal #debito-button {
          background-color: #3D85C6;
        }

        #payment-type-modal #credito-button {
          background-color: #993333;
        }
      </style>

      <button id="efectivo-button">Efectivo</button>
      <button id="debito-button">Debito</button>
      <button id="credito-button">Credito</button>
    `;

    // Setear Onclicks
    paymentModal.querySelectorAll('button').forEach((value) => {
      value.onclick = () => autoPayment(value.id);
    });

    document.querySelector('body').append(paymentModal);

    function autoPayment(e) {
      const setters = {
        tipoPago: [],

        // Guardar el HTML del tipo de pago (se enumeran por el indice)
        setTipoPago(e) {
          const current = document.querySelector(`#id_tipoPago_${e}`);
          this.tipoPago.push(current);
        },

        // Agregar otro tipo de pago
        addTipoPago() {
          document.querySelector('#add-another_1').click();
        },

        // Cambiar seleccion de los selects a los correspondientes
        changeSelection(n, v) {
          if (n === 1) {
            switch (v) {
              case 'efectivo-button':
                this.tipoPago[n - 1].selectedIndex = 1;
                break;

              case 'debito-button':
                this.tipoPago[n - 1].selectedIndex = 3;
                break;

              case 'credito-button':
                this.tipoPago[n - 1].selectedIndex = 2;
                break;
            }
          } else {
            this.tipoPago[n - 1].selectedIndex = v;
          }
        },

        // Disparar evento de cambio en los selects
        applyChanges(e) {
          this.tipoPago[e - 1].dispatchEvent(new Event('change', { bubbles: true }));
        },

        // Aplicar nuevos valores segun el tipo de pago usado (???? con el que programo esto)
        setPagoValue(e, v) {
          switch (e) {
            case 'efectivo-button':
              document.querySelector('#tipoPagovalor_1').value = v;
              break;

            case 'debito-button':
              document.querySelector('#id_montodebito_1').value = v;
              break;

            case 'credito-button':
              document.querySelector('#id_montotarjeta_1').value = v;
              break;
          }
        },
      };

      paymentModal.style.display = 'none';

      setters.setTipoPago(1);
      setters.changeSelection(1, e);
      setters.applyChanges(1);

      setters.addTipoPago();
      setters.setTipoPago(2);
      setters.changeSelection(2, 6);
      setters.applyChanges(2);

      setters.setPagoValue(e, autocompleteData.copago);
      document.querySelector('#id_numerobono_1').value = autocompleteData.numeroBono;
      document.querySelector('#id_montobono_1').value = autocompleteData.bonif;

      // Autocompletar valor boleta
      new MutationObserver(() => {
        // Buscar el input con el valor en el Modal de emision de boletas
        document.querySelectorAll('#modal_detalle_boletas #table_1 input').forEach((value) => {
          // Al encontrarlo, cambiar valor por el valor del copago
          if (value.id.includes('boleta_preciounitario_1')) {
            value.value = autocompleteData.copago.replace('.', '');
          }

          if (value.id.includes('boleta_precio_1')) {
            value.value = autocompleteData.copago;
          }

          if (value.id.includes('boleta_total_1')) {
            value.value = autocompleteData.copago;
          }
        });
      }).observe(document.querySelector('#modal_detalle_boletas'), {
        childList: true,
        subtree: true,
      });
    }
  }
} catch (e) {}

// Funcion para obtener el numero de voucher actual.
function getCurrentVoucher(e) {
  // Crear variable con Iframe
  const iframeHTML = document.createElement('iframe');

  // Asignar valores y parametros
  iframeHTML.src = 'https://reservo.cl/caja/finanzasinicial/';
  iframeHTML.id = 'voucher-iframe';
  iframeHTML.setAttribute('style', 'position: absolute; left: -99999px');

  // Ejecutar cuando el iframe termine de cargar
  iframeHTML.addEventListener('load', () => {
    // Obtener document interno del iframe
    const iframeDocument = iframeHTML.contentDocument;

    // Codigo al entrar en Finanzas
    if (iframeDocument.location.pathname.includes('/caja/finanzasinicial/')) {
      // Dar click a ver Caja para ver todos los movimientos
      iframeDocument.querySelector('#caja').parentElement.querySelector('a').click();
    }
    // Codigo al entrar en la Caja actual
    else {
      // MARDITO RESERVO
      // Detectar la carga de la tabla de ventas.
      new MutationObserver((a) => {
        let loaded = false;

        // Recorrer todos los eventos
        a.forEach((value) => {
          // Al detectar la carga de la tabla de ventas, proceder
          if (value.target.id === 'body_tabla_ventas') {
            // Si hay nuevos elementos, proceder
            if (value.addedNodes.length !== 0) {
              loaded = true;
            }
          }
        });

        // Todo igual.
        if (loaded) {
          // Obtener tabla de todos los movimientos
          const rowList = iframeDocument.querySelectorAll('#movimientos tr');

          // Recorrer toda la tabla
          for (const value of rowList) {
            // Si no es el membrete de la tabla
            if (value.parentElement.nodeName === 'TBODY') {
              // Obtener la celda donde se encuentra el voucher
              const currentCellHTML = value.children[0].innerHTML;
              const voucherIndex = currentCellHTML.indexOf('Voucher');

              // Si la palabra Voucher se encuentra en la celda, proceder
              if (voucherIndex !== -1) {
                let k = voucherIndex;
                let resp = '';

                // Recorrer todo el HTML interno de la celda hasta obtener el numero
                while (k < currentCellHTML.length) {
                  const char = currentCellHTML.charAt(k);

                  // Comprobar que el caracter sea un numero
                  if (parseInt(char) == char) {
                    resp = resp + String(char);
                  }
                  // Si encontro numeros y ahora ya no hay, terminar bucle
                  else if (resp !== '') {
                    break;
                  }

                  k++;
                }

                // Si ya encontro el numero del voucher actual, finalizar.
                if (resp !== '') {
                  e.value = Number(resp) + 1;

                  // Evitar reemplazar el valor interno si el pago ya se efectuo
                  if (document.querySelector('html').getAttribute('paid') === null) {
                    localStorage.setItem('voucher', Number(resp));
                  }
                  break;
                }
              }
            }
          }

          e.style.backgroundColor = '';
          iframeHTML.remove();
        }
      }).observe(iframeDocument.querySelector('body'), {
        subtree: true,
        childList: true,
      });
    }
  });

  // Crear Iframe para proceder con todo el codigo
  document.querySelector('body').append(iframeHTML);
}

// Obtener input del Voucher
function getVoucherInput() {
  // Obtener HTML de la tabla de pagos
  const payHTML = document.querySelector('#tr_id_tipoPago_1').parentElement;
  let foundInput = null;

  // Recorrer todos los elementos de la tabla
  for (let k = 0; k < payHTML.children.length; k++) {
    // Tomar ID de cada elemento en la tabla
    const currentID = payHTML.children[k].id;

    // Comprobar de que el elemento sea el metodo de pago de Debito o Credito
    if (currentID === 'Tarjeta_1' || currentID === 'Debito_1') {
      // Buscar en todas las celdas del medio de pago
      payHTML.children[k].querySelectorAll('td').forEach((value) => {
        // Seleccionar solo el row que contiene el voucher
        if (value.innerHTML === 'Voucher:') {
          // Obtener el input del row
          foundInput = value.parentElement.querySelector('input');
        }
      });
    }
  }

  return foundInput;
}

/*
  Extension Fonasa

*/
// Fase 0 (Login)
// FASTSWITCH
if (document.title.includes('Ingreso - Bono Electrónico - Venta Directa')) {
  const modalHTML = document.createElement('div');
  modalHTML.id = 'fastswitch-modal';
  modalHTML.innerHTML = `
    <style>
      #fastswitch-modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        margin: 0;
        background-color: rgba(0, 0, 0, 0.6);

        user-select: none;
      }

      #fastswitch-modal #fs-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        position: absolute;    
        top: 45%;
        left: 50%;
        transform: translate(-50%, -55%);
        
        width: 400px;
        padding: 1rem;

        background-color: white;
        border: 3px solid #8CC63E;
        border-radius: 8px;
      }

      #fastswitch-modal #fs-container button {
        font-size: 1.5rem;
        width: 75%;

        padding: 0.5rem;
        margin: 0.5rem;

        color: white;
        background-color: #749AB3;
        border: 1px solid lightgray;
        border-radius: 1rem;

        cursor: pointer;
      }
    </style>

    <div id="fs-container">
      <button value="28203131-0">Yo</button>
      <button value="25488889-3">Zulisss</button>
      <button value="26200247-0">Isaisaisa</button>
      <br />
      <button value="back">Volver</button>
    </div>
  `;

  // Asignar eventos a todas las opciones
  modalHTML.querySelectorAll('#fastswitch-modal button').forEach((value) => {
    value.onclick = () => {
      modalHTML.style.display = 'none';

      // Si se selecciona cualquier boton excepto Volver, proceder
      if (value.value !== 'back') {
        document.querySelector('#rut').value = value.value;
        // TE ODIO FONASA
        document.querySelector('#rut').dispatchEvent(new Event('blur', { bubbles: true }));
      }
    };
  });

  // Inyectar Modal
  document.querySelector('body').append(modalHTML);
}

// Fase 1
if (document.title.includes('Bono Electronico - Venta Directa')) {
  const prestadorHTML = document.querySelector('#selRutConvenio');
  const financiadorHTML = document.querySelector('#selCodFinanciador');

  // Seleccionar Financiador cuando cargue
  new MutationObserver((e) => {
    if (e.length === 2 || e.length === 3) {
      const financiadorLenght = financiadorHTML.options.length;

      financiadorHTML.selectedIndex = financiadorLenght - 1;

      // Dejar seleccionado el rut
      document.querySelector('#txtRutBenef').focus();

      // Llamar al background para Autollenar RUT si corresponde.
      chrome.runtime.sendMessage({
        msg: 'backgroundCheckFonasaRUT',
      });
    }
  }).observe(financiadorHTML, { childList: true });

  // Fase 2
  new MutationObserver((e) => {
    // Detectar cuando se abra la pantalla de la Fase 2 para rellenar automaticamente
    // Si el evento contiene nuevos elementos agregados
    if ('addedNodes' in e[0]) {
      // Y si existen elementos (?) js cosas
      if (e[0].addedNodes.length !== 0) {
        // Si el elemento es el modal
        if (e[0].addedNodes[0].id === 'MB_window') {
          // Repetir busqueda hasta que carguen los inputs
          const tempInterval = setInterval(() => {
            const modalInputs = document.querySelectorAll('#MB_window input');

            // Cuando esten los inputs listos, rellenar y continuar.
            if (modalInputs.length !== 0) {
              modalInputs[0].value = '77817653-K';
              modalInputs[1].value = 'Clinica Provincia de Petorca';

              // Continuar cuando se pueda
              setInterval(() => {
                document.querySelector('#btnAceptar').click();
              }, 10);

              clearInterval(tempInterval);
            }
          }, 10);
        }
      }
    }
  }).observe(document.querySelector('body'), { childList: true });

  // Seleccionar Prestador
  prestadorHTML.options[1].selected = true;
  prestadorHTML.dispatchEvent(new Event('change'));
}

// Fase 3
if (document.title.includes('Bono Electronico - Venta Interfaz')) {
  // Detectar cuando el formulario de pago este cargado
  new MutationObserver(() => {
    // Seleccionar como medio de pago efectivo y aceptarle, respectivamente.
    document.querySelector('#selFrmPagoBenef').selectedIndex = 1;
    document.querySelector('#addPagoBenef_0').click();

    // Mostrar monto a pagar de forma VISIBLE.
    // Solo ejecutar 1 vez.
    if (document.querySelector('#ext-total') === null) {
      const ammountHTML = document.createElement('div');
      const costHTML = document.querySelector('#tdTotalPagar');

      ammountHTML.id = 'ext-total';
      ammountHTML.innerHTML = `Total: <b>${costHTML.innerHTML}$.</b>`;
      ammountHTML.setAttribute(
        'style',
        `
        font-size: xxx-large;
        border-top: 5px solid black;
        padding-top: 1rem;
        padding-left: 2rem;
        padding-bottom: 1rem;
        background-color: antiquewhite;
        user-select: none;
        cursor: pointer;
        `
      );
      ammountHTML.onclick = () => {
        try {
          const prestacion = document.querySelector('#tdTotalPrestac').innerHTML;
          const bonif = document.querySelector('#tdTotalBonif').innerHTML;
          const seguroComp = document.querySelector('#tdTotalSegComp').innerHTML;
          const copago = document.querySelector('#tdTotalPagar').innerHTML;
          const numeroBono = document.querySelector('#tbodyResultado_0 td').innerHTML;

          chrome.runtime.sendMessage({
            msg: 'backgroundAutocompleteVenta',
            payload: {
              prestacion,
              bonif: formatValue(
                Number(bonif.replaceAll('.', '')) + Number(seguroComp.replaceAll('.', ''))
              ),
              copago,
              numeroBono,
            },
          });
        } catch (e) {
          alert('Debe emitir el Bono antes de proceder al pago en Reservo.');
        }
      };

      // Insertar en el body.
      document.querySelector('.botonera.right').insertAdjacentElement('afterend', ammountHTML);

      // Detectar posibles cambios en el monto a pagar para actualizar el valor
      new MutationObserver(() => {
        ammountHTML.innerHTML = `Total: <b>${costHTML.innerHTML}$.</b>`;
      }).observe(document.querySelector('#tdTotalPagar'), { childList: true, subtree: true });
    }
  }).observe(document.querySelector('#contentFormaPago'), { childList: true });
}

// Conectar al socket de corresponder
/*
chrome.runtime.sendMessage({
  msg: 'backgroundCheckSocket',
});
*/

// 18224442-2
// 3223122-5
// document.querySelector("#tbodyResultado_0").innerHTML !== ""
// btnVolverApp

/*
  EXPORTADOR PARA DAYIREE

*/
// localStorage.setItem("dayireCosa", JSON.stringify();
/*
const dayireList = JSON.parse(localStorage.getItem('dayireCosa'));
const searchBar = document.querySelector('#id_buscar');
const searchBarForm = document.querySelector('#filtro');

async function run() {
  let k = 0;

  while (k < dayireList.length) {
    const currentItem = dayireList[k];

    if (searchBar.value !== currentItem.nombre) {
      if (currentItem.telefono === '') {
        searchBar.value = currentItem.nombre;
        searchBarForm.submit();

        await sleep(500);
      }
    } else {
      const foundNumbers = document.querySelectorAll('.priority-7');

      if (foundNumbers.length === 2) {
        dayireList[k].telefono = foundNumbers[1].innerHTML;
        localStorage.setItem('dayireCosa', JSON.stringify(dayireList));
      } else {
        alert('el nombre no es unico o no existe.');
        break;
      }
    }

    k++;
  }
}

async function sleep(e) {
  return new Promise((resolve) => setTimeout(() => resolve(), e));
}

run();
console.log(dayireList);

/*
  dayireList.forEach(async (value, k) => {
    if (searchBar.value !== value.nombre) {
      if (value.telefono === '') {
        searchBar.value = value.nombre;
        searchBarForm.submit();

        await sleep(500);
      }
    } else {
      const foundNumbers = document.querySelectorAll('.priority-7');

      if (foundNumbers.length === 2) {
        dayireList[k].telefono = foundNumbers[1].innerHTML;
        localStorage.setItem('dayireCosa', JSON.stringify(dayireList));
      } else {
        alert('el nombre no es unico o no existe.');
      }
    }
  });
  */

/*
localStorage.setItem("dayireCosa", JSON.stringify([
    { nombre: "Alan José Tapia Maturana", telefono: "" },
    { nombre: "Ana Maria Ibacache Araya", telefono: "" },
    { nombre: "Carla Francisca Ester Chavez Aguilar", telefono: "" },
    { nombre: "Carlos Alberto Bruna Arancibia", telefono: "" },
    { nombre: "Carolina Paz Irrazabal Toloza", telefono: "" },
    { nombre: "Catalina Anais Collins Olivares", telefono: "" },
    { nombre: "Cecilia Andrea Campos Flores", telefono: "" },
    { nombre: "Cynthia Andrea Olivares Valencia", telefono: "" },
    { nombre: "Daniela Del Carmen Merino Mencias", telefono: "" },
    { nombre: "Daniela Rebusnante Delgado", telefono: "" },
    { nombre: "Edison Felipe Arredondo Hernandez", telefono: "" },
    { nombre: "Elizabeth Ivette Narvaez Basaez", telefono: "" },
    { nombre: "Fabiola Maritza Manzano Segura", telefono: "" },
    { nombre: "Franchesca De Los Angeles Gallardo Torres", telefono: "" },
    { nombre: "Gabriel Antonio Donoso Aguilar", telefono: "" },
    { nombre: "Joel Ibacache Valdivia", telefono: "" },
    { nombre: "Jose David Gutierrez Mery", telefono: "" },
    { nombre: "Liliana Andrea Reinoso Aravena", telefono: "" },
    { nombre: "Macarena Del Carmen Herrera Olmos", telefono: "" },
    { nombre: "Manuel Antonio Galarce Sanchez", telefono: "" },
    { nombre: "Marcela Del Pilar Gonzalez Mondaca", telefono: "" },
    { nombre: "Margarita Isabel Olave Queupan", telefono: "" },
    { nombre: "Maria Alejandra Muñoz", telefono: "" },
    { nombre: "Maria Farias Leiva", telefono: "" },
    { nombre: "Mariela O'Neil Peña Villarroel", telefono: "" },
    { nombre: "Marioli Tapia", telefono: "" },
    { nombre: "Marisel Ester Sepulveda Guzman", telefono: "" },
    { nombre: "Marjorie Bustamante Sazo", telefono: "" },
    { nombre: "Matías Fuenzalida San Martín", telefono: "" },
    { nombre: "Matias Julian Ponce Irrazabal", telefono: "" },
    { nombre: "Mirtha Graciela Ponce Lopez", telefono: "" },
    { nombre: "Natacha Carolina Silva Savedra", telefono: "" },
    { nombre: "Nataly Fuentes Serrano", telefono: "" },
    { nombre: "Ondina Del Carmen Villarroel Delgado", telefono: "" },
    { nombre: "Paola Andrea Reyes Astudillo", telefono: "" },
    { nombre: "Paola Isabel Camacho Hurtado", telefono: "" },
    { nombre: "Paola Noemi Martinez Vargas", telefono: "" },
    { nombre: "Paula Elizabeth Saavedra Ibacache", telefono: "" },
    { nombre: "Rosario Antonia Varas Donoso", telefono: "" },
    { nombre: "Susan Ramirez Moraga", telefono: "" },
    { nombre: "Tamara Cortez Acosta", telefono: "" },
    { nombre: "Tamara Patricia Olivares Narvaez", telefono: "" },
    { nombre: "Valentina Marcela Norambuena Figueroa", telefono: "" },
    { nombre: "Viviana Milena Del Rosario Alfaro", telefono: "" },
    { nombre: "Ximena Pilar Chacana Olmos", telefono: "" },
    { nombre: "Yeniffer Rivillo González", telefono: "" }
]));
*/
