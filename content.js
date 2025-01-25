let modalState = false;
let isReady = false;
let clientData = {};
const withoutLicence = ['PABLO PACHECO', 'JAVIER SANCHEZ ARREAZA'];
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

chrome.runtime.onMessage.addListener((e) => {
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
    clientData.fullName = e.payload;
    infoViewer();
  }
});

// Detectar cuando se abra la planilla del cliente
let x = new MutationObserver((e) => {
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
});

// Escuchar evento al abrir la planilla del cliente
try {
  x.observe(document.getElementById('myModal3').parentElement, {
    childList: true,
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
  rutHTML.setAttribute('title', format(clientData.Rut));
  rutHTML.onclick = () => window.open(clientData.userLink, '_blank');
  if (clientData.Rut === 'No definida' || clientData.Rut === 'No definido') {
    rutHTML.children[0].setAttribute('color', 'red');
  } else {
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
  } else {
    doubleHTML.children[0].setAttribute('color', 'green');
  }
}
