export default function recordCopier() {
  const iframeRecord = document.getElementById('iframe_ficha');

  // Iniciar sistema al cargar una nueva ficha
  iframeRecord.addEventListener('load', () => {
    const thisContent = iframeRecord.contentDocument;
    const foundForms = thisContent.querySelectorAll('form');

    // Si el iframe no contiene el formulario
    if (foundForms.length === 0) {
      const pageForms = [];

      // Buscar formulario en el documento actual
      document
        .getElementById('reservo-pinia')
        .querySelectorAll('form')
        .forEach((value) => {
          if (value.id.includes('newform_form_')) {
            pageForms.push(value);
          }
        });

      // Proceder con el formulario encontrado
      processForm(pageForms);
    }
    // Si lo contiene, proceder
    else {
      processForm(foundForms);
    }
  });
}

function processForm(foundForms) {
  // Recorrer todos los formularios encontrados
  for (const value of foundForms) {
    const foundRows = value.querySelectorAll('td div');
    const currentName = foundRows[0].innerText;

    // Buscar el primer formulario que contenga la descripcion deseada
    if (currentName === 'Ficha Kinesiología') {
      const newButton = document.createElement('button');

      // Configurar boton
      newButton.innerHTML = 'Copiar ultima ficha';
      newButton.className = 'xs-only:w-full btn btn-success text-lg px-10 py-2 hidden-print';

      // Proceder al dar click
      newButton.addEventListener('click', (e) => {
        e.preventDefault();

        // Flag para disparar error si no se encuentra ninguna ficha con la descripcion actual
        let foundKine = false;

        // Obtener todas las fichas anteriormente registradas
        const foundRecordList = document
          .getElementById('historico-table')
          .querySelectorAll('tbody');

        // Recorrer fichas
        for (const valua of foundRecordList) {
          const viewRecordButton = valua.querySelector('button');
          const cells = valua.querySelectorAll('td');

          // Comprobar informacion de la segunda celda (contenedor del tipo de ficha)
          // Proceder si es encontrada
          if (cells[2].innerText.includes('Nombre: Ficha Kinesiologica')) {
            // Crear MutationObserver para proceder al terminar de cargar los datos de la ficha
            new MutationObserver((e) => {
              // Recorrer cambios generados en la ficha
              e.forEach(({ addedNodes }) => {
                // Si el nodo en cuestion tiene nodos añadidos y no es del tipo comment (bug)
                if (addedNodes.length !== 0 && addedNodes[0].nodeName !== '#comment') {
                  // Obtener el iframe creado
                  const currentIframe = addedNodes[0].querySelector('iframe');

                  // Proceder al terminar de cargar el iframe
                  currentIframe.addEventListener('load', () => {
                    const currentContent = currentIframe.contentDocument;
                    const innerDiv = currentContent.getElementById('printcontent');

                    // Esperar a la insercion de tablas en el iframe
                    new MutationObserver((a) => {
                      // Recorrer cambios generados en la tabla
                      a.forEach(({ addedNodes }) => {
                        // Si hay cambios y el nodo agregados es un formulario, proceder
                        if (addedNodes && addedNodes[0].nodeName === 'FORM') {
                          const lastRecord = {
                            textarea: addedNodes[0].querySelectorAll('textarea'),
                            input: addedNodes[0].querySelectorAll('input'),
                          };

                          const newRecord = {
                            textarea: value.querySelectorAll('textarea'),
                            input: value.querySelectorAll('input'),
                          };

                          // Recorrer viejo formulario contra el nuevo, y reemplazar datos
                          lastRecord.textarea.forEach((valui, k) => {
                            const clone = valui.cloneNode(true);
                            clone.removeAttribute('readonly');

                            newRecord.textarea[k].replaceWith(clone);
                          });

                          lastRecord.input.forEach((valui, k) => {
                            const clone = valui.cloneNode(true);
                            clone.removeAttribute('readonly');
                            clone.removeAttribute('disabled');

                            newRecord.input[k].replaceWith(clone);
                          });

                          // Cerrar ficha
                          viewRecordButton.click();
                        }
                      });
                    }).observe(innerDiv, { childList: true, subtree: true });
                  });
                }
              });
            }).observe(viewRecordButton.closest('tbody'), { childList: true });

            // Abrir ficha
            viewRecordButton.click();

            // Denegar error
            foundKine = true;

            // No buscar mas fichas
            break;
          }
        }

        // Si no se encontro ninguna ficha, mostrar error
        if (!foundKine) {
          alert('No hay fichas de Kinesiologia para copiar.');
        }
      });

      // Insertar boton en el formulario
      foundRows[0].insertAdjacentElement('afterend', newButton);
      break;
    }
  }
}
