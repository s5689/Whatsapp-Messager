let modalState = false;
let isReady = false;

chrome.runtime.onMessage.addListener((e) => {
  if (e.msg === "open") {
    let nameHTML = document.getElementById("id_title");
    let doctorHTML = document.getElementById(
      "select2-id_servicios__edit-container"
    );

    if (nameHTML !== null && modalState) {
      let nameValue = nameHTML.value;
      let nameType = nameValue.slice(0, 4);

      if (nameType === "NP: ") {
        let name = nameValue.slice(4);
        let doctor = doctorHTML.innerHTML;

        // Preparar nombre de doctor
        doctor = doctor.replace("Dr. ", "");
        doctor = doctor.replace("Dra. ", "");
        doctor = doctor.replace("Dr.", "");
        doctor = doctor.replace("Dra.", "");
        doctor = doctor.toUpperCase();

        /*
          Codigo Robado

        */
        var codigo = document
          .querySelector("#id_phone__edit_0")
          .value.replace("+", "");
        var numero = document.querySelector("#id_phone__edit_1").value;
        // Numero Invalido
        if (numero.length !== 9) {
          alert("Para enviar mensaje debe ingresar un número válido.");
          return;
        }

        numero = numero.replace("+", "");
        numero = "56" + numero;

        var options = { year: "numeric", month: "long", day: "numeric" };

        var hora = document.querySelector("#id_horaInicio__edit").value;
        var centro = "Clinica Provincia De Petorca";
        let encoded = encodeURI(centro);
        let centro_decoded = decodeURI(encoded);
        var options = { year: "numeric", month: "long", day: "numeric" };
        var fecha = document.querySelector("#id_fecha").value;
        var parts = fecha.split("-");
        var fecha = new Date(parts[0], parts[1] - 1, parts[2]);
        fecha = fecha.toLocaleDateString("es-ES", options);
        /*
        var text =
          "Hola ¿confirma su cita en " +
          centro_decoded +
          " el " +
          fecha +
          " a las " +
          hora +
          "?";
        */
        let text =
          "Hola " +
          name +
          " ¿Confirma su cita en " +
          centro_decoded +
          " el " +
          fecha +
          " a las " +
          hora +
          " horas con el profesional " +
          doctor +
          "? Favor confirmar con SI o NO";
        text = encodeURIComponent(text);
        var regex_numeros = "^[0-9]{11,15}$";
        if (!numero.match(regex_numeros)) {
          alert(
            "Para enviar mensaje debe ingresar un número internacional válido"
          );
        } else {
          window.open("https://wa.me/" + numero + "?text=" + text, "_blank");
          window.open("https://wa.me/" + numero + "?text=" + text, "_blank");

          setTimeout(() => {
            chrome.runtime.sendMessage({
              msg: "closeWhatsapp",
              currentWindow: document.URL,
            });
          }, 1000);
        }
      } else {
        alert("Por favor seleccione una cita que no haya sido atendida.");
      }
    } else {
      alert("Por favor seleccione la cita a enviar el mensaje.");
    }
  }
});

// Detectar cuando se abra la planilla del cliente
let x = new MutationObserver((e) => {
  if (e[0].removedNodes) {
    // Abrir
    if (e.length === 4 || e.length === 12) {
      modalState = true;
    }

    // Cerrar
    if (e.length === 1) {
      modalState = false;
    }
  }
});

x.observe(document.getElementById("myModal3").parentElement, {
  childList: true,
});
