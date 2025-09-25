import { modalState } from '../db';

export default function reservoEvents() {
  // Eventos al abrir la planillas de agendas
  // De cliente ya registrado
  new MutationObserver((e) => {
    if (e[0].removedNodes) {
      // Abrir
      if (e.length === 4 || e.length === 12) {
        modalState.appointment = true;
      }

      // Cerrar cualquier planilla
      if (checkClose(e)) {
        modalState.appointment = false;
        modalState.register = false;
      }

      // Logica de comprobacion de cierre de planilla
      function checkClose(e) {
        try {
          const length = e.length === 1;
          const nodesLength = e[0].removedNodes.length !== 0;
          const classListLength = e[0].removedNodes[0].classList.length === 1;

          return length && nodesLength && classListLength;
        } catch (e) {
          return false;
        }
      }
    }
  }).observe(document.getElementById('myModal3').parentElement, { childList: true });

  // De cliente a registrar
  new MutationObserver((e) => {
    // Asegurar que se trata de registrar cliente y no cliente registrado
    if (e.length !== 1 && !modalState.appointment) {
      modalState.register = true;
    }
  }).observe(document.getElementById('myModal').parentElement, { childList: true });

  // De datos del cliente
  new MutationObserver((e) => {
    // Al cargar datos
    if (e[0].addedNodes.length !== 0) {
      modalState.extraData = true;
    }

    // Al descargar datos
    if (e[0].removedNodes.length !== 0) {
      modalState.extraData = false;
    }
  }).observe(document.querySelector('#info_modal_datos_extra'), { childList: true });

  // Eliminar fondo oscuro al abrir datos del cliente de forma programatica
  new MutationObserver((e) => {
    // Proceder solo si el modal se abrio de forma programatica
    if (modalState.extraDataSystemTrigger) {
      // Buscar en todos los cambios en el body
      e.forEach((value) => {
        const currentlyAdded = value.addedNodes[0];

        // Si hay nuevos elementos agregados
        if (currentlyAdded) {
          // Y es el fondo oscuro
          if (currentlyAdded.getAttribute('class') === 'modal-backdrop fade in') {
            // Eliminar
            currentlyAdded.remove();
          }
        }
      });
    }
  }).observe(document.body, { childList: true });
}
