import { BACKGROUND } from '../../globals';
import { modalState } from '../db';
import { backgroundCall } from '../lib';

let isBuilt = false;

function buildInfoViewer() {
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

  isBuilt = true;
}

function cleanInfoViewer() {
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

function setInfoViewer(clientData) {
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

function openExtraData() {
  // Inicio de la manipulacion del modal programatico
  modalState.extraDataSystemTrigger = true;

  // Ocultar pantalla de datos
  document.getElementById('modal_datos_extras').style.transform = 'scale(0)';

  // Abrir datos extras automaticamente para extraer informacion
  document.getElementById('datos_extra').click();

  // Eliminar fila extra de existir (bug)
  if (document.querySelector('#editAppt:last-child tr:last-child').clientHeight < 5) {
    document.querySelector('#editAppt:last-child tr:last-child').remove();
  }
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

export default function appointmentChecker() {
  // Callback al abrir una planilla de cita
  modalState.onAppointmentChange((e) => {
    if (e) {
      !isBuilt ? buildInfoViewer() : cleanInfoViewer();
      openExtraData();
    }
  });

  // Callback al abrir los datos extras
  modalState.onExtraDataChange(async (e) => {
    // Si estan cargados los datos
    if (e) {
      // Cerrar modal de datos extras
      document.getElementById('editar_perfil_datos_extra').parentElement.children[0].click();

      // Fin de la manipulacion del modal programatico
      modalState.extraDataSystemTrigger = false;

      // Leer y almacenar datos
      const raw = document.querySelectorAll('#modal_datos_extras tr');
      const clientData = {};

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
      await fetch(`https://reservo.cl/pacienteDentista/buscarAjaxPerson/?term=+${clientData.Rut}`, {
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
        });

      // Una vez terminado de obtener todos los datos, representar
      setInfoViewer(clientData);

      // Y enviar rut al background
      await backgroundCall({
        msg: 'check-rut',
        payload: format(clientData.Rut),
        target: BACKGROUND,
      });

      console.log('a');

      // Devolver valores por defecto a pantalla de datos
      document.getElementById('modal_datos_extras').style.transform = 'scale(1)';
    }
  });
}
