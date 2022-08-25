const getRandomToken = () => {
  var randomPool = new Uint8Array(8);
  crypto.getRandomValues(randomPool);
  var hex = '';
  for (var i = 0; i < randomPool.length; ++i) {
      hex += randomPool[i].toString(16);
  }
  return hex;
}

const $export = (tabId) => {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: request
  });
}

const request = () => {
  chrome.storage.sync.get(['host', 'userId'], (items) => {

    const lineSelector = "hr"; 
    const mainContentSelector = "div.page > div.container";
    const vehicleInfoContentSelector = "div.page > div.container > div.row";
    const vehicleInfoSelector = "#tab-info-vehiculo";
    const vehicleInfoTitleSelector = "#tab-info-vehiculo > h3";
    const vehicleInfoTableSelector = "#tab-info-vehiculo > table";
    const plateSelector = "table.table tr:nth-child(8) td:nth-child(2) small";

    let tab = document.querySelector(vehicleInfoSelector);
    if (tab == null) {
      return false;
    }

    let documentClone = document.documentElement.cloneNode(true);
    documentClone.querySelectorAll(lineSelector).forEach(node => {
      node.remove();
    });

    let bodyClone = document.body.cloneNode();
    let containerClone = document.querySelector(mainContentSelector).cloneNode();
    let rowClone = document.querySelector(vehicleInfoContentSelector).cloneNode();
    let h3Clone = document.querySelector(vehicleInfoTitleSelector).cloneNode(true);
    let tableClone = document.querySelector(vehicleInfoTableSelector).cloneNode(true);

    rowClone.appendChild(h3Clone);
    rowClone.appendChild(tableClone);
    containerClone.appendChild(rowClone);
    bodyClone.appendChild(containerClone);
    
    documentClone.removeChild(documentClone.querySelector("body"));
    documentClone.appendChild(bodyClone);

    let data = {
      userId: items.userId,
      htmlContent: documentClone.outerHTML,
      filename: documentClone.querySelector(plateSelector).innerText
    };

    fetch(`${items.host}/api/repuve/export`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        'Accept': 'application/octet-stream'
      },
      cache: 'no-cache',
      body: JSON.stringify(data),
      mode: 'cors',
      redirect: 'follow',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        }
        console.log('The service refused the request.');
      })
      .then(blob => {
        data.extension = '.pdf';
        data.url = URL.createObjectURL(blob);
        chrome.runtime.sendMessage(chrome.runtime.id, {
          action: "download",
          data: data
        });
      })
      .catch((reason) => {
        console.error(`Could not export Repuve information. (${reason})`);
      });
  });
};

const read = (message) => {
  switch (message.action) {
    case "download":
      chrome.storage.sync.get(['subfolder'], (items) => {
        let filename = items.subfolder + message.data.filename + message.data.extension;
        download(message.data.url, filename);
      })
      break;
    default:
      console.error("Invalid operation.");
      break;
  }
}

const download = (url, filename) => {
  chrome.downloads.download({
    url: url,
    filename: filename
  });
}

chrome.runtime.onInstalled.addListener(() => {
  let userId = getRandomToken();
  console.log(userId);
  chrome.storage.sync.set({
    host: "http://151.80.251.163:9090",
    subfolder: "placas/",
    userId: userId 
  });
})

chrome.action.onClicked.addListener((tab) => {
  $export(tab.id);
});

chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  $export(details.tabId);
}, {
  hostContains: 'www2.repuve.gob.mx'
})

chrome.runtime.onMessage.addListener((message) => {
  read(message);
});