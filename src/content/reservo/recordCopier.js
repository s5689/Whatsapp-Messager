export default function recordCopier() {
  const iframeRecord = document.getElementById('iframe_ficha');

  iframeRecord.addEventListener('load', () => {
    const thisContent = iframeRecord.contentDocument;
    const foundForms = thisContent.querySelectorAll('form');

    if (foundForms.length === 0) {
      const pageForms = [];

      document
        .getElementById('reservo-pinia')
        .querySelectorAll('form')
        .forEach((value) => {
          if (value.id.includes('newform_form_')) {
            pageForms.push(value);
          }
        });

      processForm(pageForms);
    } else {
      processForm(foundForms);
    }
  });
}

function processForm(foundForms) {
  for (const value of foundForms) {
    const foundRows = value.querySelectorAll('td div');
    const currentName = foundRows[0].innerText;

    if (currentName === 'Ficha Kinesiología') {
      const newButton = document.createElement('button');

      newButton.innerHTML = 'Copiar ultima ficha';
      newButton.className = 'xs-only:w-full btn btn-success text-lg px-10 py-2 hidden-print';
      newButton.addEventListener('click', (e) => {
        e.preventDefault();

        let foundKine = false;
        const foundRecordList = document
          .getElementById('historico-table')
          .querySelectorAll('tbody');

        for (const valua of foundRecordList) {
          const viewRecordButton = valua.querySelector('button');
          const cells = valua.querySelectorAll('td');

          if (cells[2].innerText.includes('Nombre: Ficha Kinesiologica')) {
            new MutationObserver((e) => {
              e.forEach(({ addedNodes }) => {
                if (addedNodes.length !== 0) {
                  const currentIframe = addedNodes[0].querySelector('iframe');

                  currentIframe.addEventListener('load', () => {
                    const currentContent = currentIframe.contentDocument;
                    const innerDiv = currentContent.getElementById('printcontent');

                    new MutationObserver((a) => {
                      a.forEach(({ addedNodes }) => {
                        if (addedNodes && addedNodes[0].nodeName === 'FORM') {
                          console.log(addedNodes[0]);
                        }
                      });
                    }).observe(innerDiv, { childList: true, subtree: true });
                  });
                }
              });
            }).observe(viewRecordButton.closest('tbody'), { childList: true });

            viewRecordButton.click();
            foundKine = true;
            break;
          }
        }

        if (!foundKine) {
          alert('No hay fichas de Kinesiologia para copiar.');
        }
      });

      foundRows[0].insertAdjacentElement('afterend', newButton);
      break;
    }
  }
}
