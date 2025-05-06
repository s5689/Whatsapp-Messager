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
      infoViewer();
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

              // Una vez terminado de obtener todos los datos, enviar rut al background
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
      }
    }
  }).observe(document.getElementById('myModal3').parentElement, { childList: true });

  // De cliente a registrar
  new MutationObserver((e) => {
    // Asegurar que se trata de registrar cliente y no cliente registrado
    if (e.length !== 1 && !modalState) {
      // Preparar boton de comprobar rut al agregar cliente
      buildRutButtonCheck();
    }
  }).observe(document.getElementById('myModal').parentElement, { childList: true });

  /*
    POSIBLE MEJORA:
    Basar el resumen de citas en base al listado de citas
      > Crear un boton que abra un modal que contenga la info
  */
  // De resumen de Citas
  document.querySelector('#iframeregistroconfirmacion').addEventListener('load', () => {
    const iframeDocument = document.querySelector('#iframeregistroconfirmacion').contentDocument;
    const citasTable = iframeDocument.querySelectorAll('#tickets_email')[0];
    const citasRows = citasTable.querySelectorAll('tbody tr');
    const selectedDate = { calendar: '', reservo: '', reservoPrint: '' };
    const reservoCalendars = [];
    const doctorList = [];

    // Obtener todos los doctores individuales que atenderan
    citasRows.forEach((value) => {
      const currentChildren = value.children;
      const currentLastCell = currentChildren[currentChildren.length - 1];
      const currentDoctor = currentLastCell.innerHTML.slice(0, -1);
      const foundDoctor = doctorList.findIndex((valua) => valua.name === currentDoctor);

      // Si el doctor no esta en el array, crear
      if (foundDoctor === -1) {
        doctorList.push({ name: currentDoctor, ammount: 1 });
      }
      // Si ya esta, sumar un paciente
      else {
        doctorList[foundDoctor].ammount += 1;
      }
    });

    // Si la pagina actual es de citas multiples, obtener doctores mostrados
    const multiCalendar = { state: false, equal: false, text: '' };

    if (location.pathname === '/appointment/viewAllAppts/') {
      const allCalendars = [];

      // Buscar y almacenar todos los calendarios actuales
      document.querySelectorAll('#contenedor-calendario td').forEach((value) => {
        // Solo almacenar si tienen ID de calendario, y tienen contenido
        if (value.id.includes('schedule_') && value.innerHTML !== '') {
          allCalendars.push(value);
        }
      });

      // Recorrer calendarios
      allCalendars.forEach((value) => {
        const currentName = value.querySelector('.fc-center').innerText;
        const currentSchedule = value.querySelector('.fc-content-skeleton .fc-event-container');

        // Si hay agendas en el calendario
        if (currentSchedule.length !== 0) {
          // Recorrer las agendas
          for (let k = 0; k < currentSchedule.children.length; k++) {
            // Si la cita no es un Bloqueo de agenda
            if (currentSchedule.children[k].style.backgroundColor !== 'black') {
              // Si el doctor no se encuentra en el array
              if (reservoCalendars.findIndex((value) => value === currentName) === -1) {
                reservoCalendars.push(currentName);
              }
            }
          }
        }
      });

      // Confirmar el multicalendario
      multiCalendar.state = true;
    }

    // Obtener las fechas seleccionadas en Reservo y en el calendario
    selectedDate.calendar = formatDate(iframeDocument.querySelector("[name='fecha']").value);
    selectedDate.reservo = formatDate(document.querySelector('#datepicker').value);
    multiCalendar.equal = selectedDate.calendar === selectedDate.reservo ? true : false;

    // Generar texto para Reservo si hay multicalendario
    if (multiCalendar.state) {
      selectedDate.reservoPrint = `Fecha en Multicalendario: ${selectedDate.reservo}<br />`;
    }

    // Organizar lista de doctores para la interfaz
    let doctorListText = '';

    doctorList.forEach((value) => {
      let toAlert = '';

      // Si el multicalendario esta activado, comprobar
      if (multiCalendar.state) {
        let isFound = false;

        // Recorrer los calendarios con agendas en reservo
        reservoCalendars.forEach((valua) => {
          // Si el doctor actual tiene px en reservo, confirmar encontrado
          if (value.name.includes(valua.slice(0, -1))) {
            isFound = true;
          }
        });

        // Si no se encontro en reservo y las fechas son iguales, presentar error
        if (!isFound && multiCalendar.equal) {
          toAlert = '<span style="color:red;">(!)</span>';
        }
      }

      // Armar texto
      doctorListText += `<li>${value.name}: <b>${value.ammount} ${toAlert}</b></li>`;
    });

    // Mostrar cantidad de pacientes de reservo si esta en modo multicalendario
    // y si las fechas son iguales
    if (multiCalendar.state && multiCalendar.equal) {
      multiCalendar.text = `(${reservoCalendars.length})`;
    }

    // Crear Interfaz de estadisticas
    const statsHTML = document.createElement('div');
    statsHTML.setAttribute(
      'style',
      `
        text-align: left;
        font-size: large;
        background-color: antiquewhite;
        padding: 1rem;
        border-radius: 2rem;
      `
    );

    // Armar HTML
    statsHTML.innerHTML = `
      Fecha Seleccionada: ${selectedDate.calendar}<br />
      ${selectedDate.reservoPrint}<br />
      Doctores en el dia: <b>${doctorList.length} ${multiCalendar.text}</b><br />
      Pacientes Agendados: <b>${citasRows.length}</b><br />
      <br />
      Cantidad de Pacientes por Doctor <i>(Incluye suspendidos)</i>:<br />
      <ul>${doctorListText}</ul>
    `;

    // Inyectar en el Iframe
    iframeDocument.querySelector('form').insertAdjacentElement('afterend', statsHTML);

    // Formatear la fecha de los calendarios
    function formatDate(e) {
      const splitDate = e.split('-');
      const weekDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      if (splitDate[0].length === 4) {
        const temp0 = splitDate[2];
        const temp1 = splitDate[0];

        splitDate[0] = temp0;
        splitDate[2] = temp1;
      }

      const mergedDate = `${splitDate[0]}/${splitDate[1]}/${splitDate[2]}`;
      const tempDate = new Date(`${splitDate[2]}/${splitDate[1]}/${splitDate[0]}`);

      return `${weekDay[tempDate.getDay()]} ${mergedDate}`;
    }
  });
} catch (e) {}

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
            <td class="infoViewer_color" color="orange"></td>
            <td class="infoViewer_text">RUT</td>
          </tr>

          <tr id="infoViewer-Name">
            <td class="infoViewer_color" color="orange"></td>
            <td class="infoViewer_text">Nombre</td>
          </tr>

          <tr id="infoViewer-Birthday">
            <td class="infoViewer_color" color="orange"></td>
            <td class="infoViewer_text">Fecha de Nacimiento</td>
          </tr>

          <tr id="infoViewer-Double">
            <td class="infoViewer_color" color="orange"></td>
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
    document.querySelector('#infoViewer-RUT .infoViewer_color').setAttribute('color', 'orange');

    document.querySelector('#infoViewer-Name').onclick = '';
    document.querySelector('#infoViewer-Name').removeAttribute('title');
    document.querySelector('#infoViewer-Name .infoViewer_color').setAttribute('color', 'orange');

    document.querySelector('#infoViewer-Birthday').onclick = '';
    document.querySelector('#infoViewer-Birthday').removeAttribute('title');
    document
      .querySelector('#infoViewer-Birthday .infoViewer_color')
      .setAttribute('color', 'orange');

    document.querySelector('#infoViewer-Double').onclick = '';
    document.querySelector('#infoViewer-Double').removeAttribute('title');
    document.querySelector('#infoViewer-Double .infoViewer_color').setAttribute('color', 'orange');
  }
}

// Procesar datos y aplicar cambios
function infoViewer() {
  const rutHTML = document.querySelector('#infoViewer-RUT');
  const nameHTML = document.querySelector('#infoViewer-Name');
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
    const slicedName = [];
    let ok = true;
    let k = 0;

    // Separar nombre de Reservo en partes de un array
    for (const e of clientData.name) {
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

// Presentar rut en casilla de Comentarios al registrar cliente
function checkViewer(e) {
  const commentsHTML = document.querySelector('#id_comentario');
  commentsHTML.value = e;
}

/*
  Extension de Ventas

*/
// Escuchar evento al cambiar el medio de pago
try {
  // De cliente ya registrado
  new MutationObserver(() => {
    // Obtener HTML de la tabla de pagos
    const payHTML = document.querySelector('#tr_id_tipoPago_1').parentElement;

    // Recorrer todos los elementos de la tabla
    for (let k = 0; k < payHTML.children.length; k++) {
      // Tomar ID de cada elemento en la tabla
      const currentID = payHTML.children[k].id;

      // Comprobar de que el elemento sea el metodo de pago de Debito o Credito
      if (currentID === 'Tarjeta_1' || currentID === 'Debito_1') {
        // Buscar en todas las celdas del medio de pago
        payHTML.children[k].querySelectorAll('td').forEach((value) => {
          // Seleccionar solo el row que contiene el boucher
          if (value.innerHTML === 'Voucher:') {
            // Obtener el input del row
            const voucherInput = value.parentElement.querySelector('input');
            getCurrentVoucher(voucherInput);
          }
        });
      }
    }
  }).observe(document.querySelector('#tr_id_tipoPago_1').parentElement, { childList: true });
} catch (e) {}

// Deseleccionar automaticamente el boton de imprimir boleta
// Enviar RUT a Fonasa
try {
  // Inyectar solo si se encuentra en el modulo de ventas
  if (document.title === 'Venta') {
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
                  break;
                }
              }
            }
          }

          // Si se recorrio toda la tabla pero no hubo voucher, regresar 0.
          if (e.value === '') {
            e.value = 0;
          }

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
      <button value="">Zulisss</button>
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

// 3223122-5
// document.querySelector("#tbodyResultado_0").innerHTML !== ""
// btnVolverApp
