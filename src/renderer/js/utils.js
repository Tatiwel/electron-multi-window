const { ipcRenderer } = require('electron');

let newWinOpen = false;

const inputElement = document.getElementById('user-input');
const submitButton = document.getElementById('submit-input');
const syncedMessageElement = document.getElementById('synced-message');

// submit form index page
if (submitButton && inputElement) {
  submitButton.addEventListener('click', () => {
    const userInput = inputElement.value;
    if (userInput) {
      ipcRenderer.send('open-new-window', userInput);
      ipcRenderer.send('update-value', userInput);
    }
  });
  // modify the value of the text field
  inputElement.addEventListener('input', (e) => {
    ipcRenderer.send('update-value', e.target.value);
  });
}

// Listener to sync value
ipcRenderer.on('update-value', (event, updatedInput) => {
  if (syncedMessageElement) {
    syncedMessageElement.innerText = updatedInput;
  }
});
