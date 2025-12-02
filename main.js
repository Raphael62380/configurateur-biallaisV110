const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Création de la fenêtre du logiciel
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'icon.png'), // Votre icône
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true // Cache la barre de menu "Fichier, Édition..." pour faire plus Pro
  });

  // Chargement de votre fichier index.html
  win.loadFile('index.html');
  
  // Décommenter la ligne suivante pour ouvrir les outils de dév (si bug)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});