# Electron-IPC-Multi-Window Application

This is a sample project that demonstrates how to create a pure Electron application, without frameworks or libraries, with multiple synchronized windows. It allows users to enter text in a main window and view the synchronized text in a secondary window. Just JavaScript!

## Features

- **Main Window**: Allows the user to input text and click a button to open a new window.
- **Secondary Window**: Displays the synchronized text from the main window in real-time.
- **Real-Time Synchronization**: Text entered in the main window is automatically updated in the secondary window.


## Prerequisites

Make sure you have Node.js installed on your machine. You will also need the `npm` package manager, which comes with Node.js.

## How to Clone and Run the Project

1. Clone the repository:
   ```bash
   $ git clone --branch pure-electron https://github.com/Tatiwel/electron-multi-window.git
   ```

2. Navigate to the project directory:
   ```bash
   $ cd electron-multi-window
   ```

3. Install dependencies:
   ```bash
   $ npm install
   ```

4. Start the application:
   ```bash
   $ npm start
   ```

## Demo

![Demo](misc/demo-pure-electron.gif)
## Project Structure

```
electron-multi-window/
├── src/
│   ├── main/
│   │   ├── main.js
│   │   ├── preload.js
│   ├── renderer/
│   │   ├── css/
│   │   │   ├── styles.css
│   │   ├── js/
│   │   │   ├── utils.js
│   │   ├── pages/
│   │   │   ├── index.html
│   │   │   ├── newWindow.html
├── .gitignore
├── package.json
├── README.md
```

- **`src/main`**: Contains the main process files for Electron.
- **`src/renderer`**: Contains the renderer process files, including HTML, CSS, and JavaScript.

## How It Works

1. **Main Window**:
   - The index.html file contains an input field and a button.
   - The utils.js file manages input events and sends messages to the main process via **`ipcRenderer`**.

2. **Secondary Window**:
   - The [`newWindow.html`](src/renderer/pages/newWindow.html) file displays the synchronized text.
   - The main process, managed by [`main.js`](src/main/main.js), creates and controls the secondary window.

3. **Synchronization**:
   - The `ipcMain` n the main process listens for events from  `ipcRenderer`  and sends messages to synchronize text between windows.

## Technologies Used

- [Electron](https://www.electronjs.org/): A framework for building desktop applications using JavaScript, HTML, and CSS.
- [Node.js](https://nodejs.org/): A runtime environment for JavaScript on the backend.

## Autor

Project developed by **Daniel** (**Tatiwel**).

## License

This project is licensed under the ISC license. See the [package.json](package.json) file for more details.
