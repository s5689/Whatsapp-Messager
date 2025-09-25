export async function backgroundCall(e) {
  return new Promise((res, err) => {
    chrome.runtime.sendMessage(e, (resp) => {
      if (resp) {
        res(resp);
      } else {
        err();
      }
    });
  });
}
