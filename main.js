const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow () {
  
  // 1. On récupère la taille de l'écran pour calculer le zoom
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  // 2. Calcul du zoom (On garde cette logique pour que ce soit lisible sur 4K)
  let zoomFactor = 1.0;
  if (width > 2000) {
      zoomFactor = 1.5; 
  } else if (width > 1600) {
      zoomFactor = 1.25;
  }

  // 3. Création de la fenêtre
  const win = new BrowserWindow({
    // Taille de démarrage (fenêtre non maximisée)
    width: 1400, 
    height: 900,
    minWidth: 1024, // On empêche de rendre la fenêtre trop petite
    minHeight: 768,
    center: true,   // La fenêtre s'ouvre pile au milieu de l'écran
    
    icon: path.join(__dirname, 'icon.png'),
    
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      zoomFactor: zoomFactor // On applique le zoom calculé
    },
    autoHideMenuBar: true, // Cache le menu "Fichier/Edition"
    show: false // On attend que ce soit prêt pour afficher
  });

  // 4. On supprime la ligne win.maximize() pour ne pas être en plein écran
  // win.maximize(); <--- CETTE LIGNE A ÉTÉ RETIRÉE

  // On affiche la fenêtre directement
  win.show();

  // Chargement du fichier
  win.loadFile('index.html');
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