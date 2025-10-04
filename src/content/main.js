import reservoEvents from './reservo/reservoEvents';
import whatsappMessager from './reservo/whatsappMessager';
import appointmentChecker from './reservo/appointmentChecker';
import rutificador from './rutificador';
import recordCopier from './reservo/recordCopier';

/*
if (document.location.href.includes('reservo.cl/appointment')) {
  reservoEvents();
  whatsappMessager();
  appointmentChecker();
}

if (document.location.href.includes('nombrerutyfirma.com')) {
  rutificador();
}
*/

if (document.location.href.includes('reservo.cl/atencion/')) {
  recordCopier();
}
