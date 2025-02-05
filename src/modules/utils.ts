import { ipcRenderer } from 'electron';

let newWinOpen = false;

const inputElement = document.getElementById('user-input');
const submitButton = document.getElementById('submit-input');
const syncedMessageElement = document.getElementById('synced-message');

// submit form index page
if (submitButton && inputElement) {
  submitButton.addEventListener('click', () => {
    const userInput = (inputElement as HTMLInputElement).value;
    if (userInput) {
      if (!newWinOpen) {
        ipcRenderer.send('open-new-window', userInput);
        newWinOpen = true;
      }
      ipcRenderer.send('update-value', userInput);
    }
  });

  // modify the value of the text field
  inputElement.addEventListener('input', (e) => {
    if (!e.target) return;

    ipcRenderer.send('update-value', (e.target as HTMLInputElement).value);
  });
}

// Listener to sync value
ipcRenderer.on('update-value', (_event, updatedInput) => {
  if (syncedMessageElement) {
    syncedMessageElement.innerText = updatedInput;
  }
});
