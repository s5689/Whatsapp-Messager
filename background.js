let playerID = 0;

chrome.runtime.onMessage.addListener((e, idk, resp) => {
  if (e.msg === "open") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      chrome.tabs.sendMessage(tab.id, { msg: "open" });
    });
  }

  if (e.msg === "closeWhatsapp") {
    chrome.tabs.query({}, (tabs) => {
      // const tab = tabs[0];
      tabs.forEach((value) => {
        console.log(value);
        if (value.title === "Compartir en Whatsapp") {
          chrome.tabs.remove(value.id);
        }

        if (e.currentWindow === value.url) {
          chrome.tabs.update(value.id, { active: true }, (tab) => {});
        }
      });
    });
  }
});
