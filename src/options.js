

function setCultureText(selector, messageId){
  document.querySelector(selector).innerText = chrome.i18n.getMessage(messageId);
}

function save() {
  var host = document.getElementById('host').value;
  var subfolder = document.getElementById('subfolder').value;
  chrome.storage.sync.set({
    host: host,
    subfolder: subfolder ,
  }, function() {
    var status = document.getElementById('status')
    status.classList.remove('invisible');
    setTimeout(function() {
      status.classList.add('invisible');
    }, 750);
  });
}

function init() {

  setCultureText("#hostTitle", "option_label_host");
  setCultureText("#subfolderTitle", "option_label_subfolder");

  chrome.storage.sync.get({
    host,
    subfolder,
    userId
  }, (items) => {
    document.getElementById('userId').textContent = items.userId;
    document.getElementById('host').value = items.host;
    document.getElementById('subfolder').value = items.subfolder;
  });
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('save').addEventListener('click', save);