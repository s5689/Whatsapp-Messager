import { modalState } from '../db';

// Eventos al abrir la planillas de agendas
try {
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
} catch (e) {}
