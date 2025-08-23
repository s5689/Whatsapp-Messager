import { BACKGROUND, CONTENT } from '../../globals';
import { modalState } from '../db';

const withoutLicence = ['PABLO PACHECO'];

// Generar mensaje de confirmacion
function generateMessage() {
  let nameHTML = document.getElementById('id_title');
  let doctorHTML = document.getElementById('select2-id_servicios__edit-container');

  if (nameHTML !== null && modalState.appointment) {
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
      let numero = document.querySelector('#id_phone__edit_1').value;
      // Numero Invalido
      if (numero.length !== 9) {
        alert('Para enviar mensaje debe ingresar un número válido.');
        return;
      }

      numero = numero.replace('+', '');
      numero = '56' + numero;

      let options = { year: 'numeric', month: 'long', day: 'numeric' };

      let hora = document.querySelector('#id_horaInicio__edit').value;
      let fecha = document.querySelector('#id_fecha').value;
      let parts = fecha.split('-');
      fecha = new Date(parts[0], parts[1] - 1, parts[2]);
      fecha = fecha.toLocaleDateString('es-ES', options);

      let text =
        'Hola ' +
        name +
        ' ¿Confirma su cita en la Clinica Provincia De Petorca el ' +
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

export default function whatsappMessager() {
  // Preparar listener del backend
  chrome.runtime.onMessage.addListener((e) => {
    // Detectar llamada del background al abrir la extension (para WhatsApp)
    if (e.msg === 'popup-open' && e.target === CONTENT) {
      const resp = generateMessage();

      if (resp !== null) {
        const { text, numero } = resp;

        if (numero.match('^[0-9]{11,15}$')) {
          chrome.runtime.sendMessage({
            msg: 'closeWhatsapp',
            payload: text,
            target: BACKGROUND,
          });

          setTimeout(() => {
            window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(text), '_blank');
            window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(text), '_blank');
          }, 100);
        } else {
          alert('Para enviar mensaje debe ingresar un número internacional válido');
        }
      }
    }

    // Copiar mensaje de WhatsApp al portapapeles
    if (e.msg === 'copyMessage' && e.target === CONTENT) {
      const resp = generateMessage();

      if (resp !== null) {
        const { text } = resp;

        navigator.clipboard.writeText(text).then(() => {
          alert('Mensaje copiado al portapapeles.');
        });
      }
    }
  });
}
