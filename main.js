const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Création de la fenêtre principale
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Configurateur Biallais",
    // L'icône est optionnelle, supprimez la ligne si vous n'avez pas de fichier icon.ico
    icon: path.join(__dirname, 'icon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // Permet de charger les images locales sans erreur de sécurité
      webSecurity: false 
    }
  });

  // Chargement de votre interface
  win.loadFile('index.html');

  // Masquer la barre de menu grise par défaut (Fichier, Édition...)
  win.setMenuBarVisibility(false);
  
  // Lancer l'application en plein écran maximisé
  win.maximize();
}

app.whenReady().then(createWindow);

// Quitter l'application quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});