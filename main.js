const { app, BrowserWindow, screen } = require('electron'); // On ajoute 'screen'
const path = require('path');

function createWindow () {
  
  // 1. On récupère la taille réelle de l'écran de l'utilisateur
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // 2. Calcul du facteur de zoom intelligent
  // On se base sur un écran standard Full HD (1920px de large).
  // Si l'écran est plus grand (ex: 4K), on zoome.
  // Si l'écran est plus petit (laptop), on garde l'échelle normale (1.0).
  
  let zoomFactor = 1.0;
  
  // Si l'écran est très large (> 2000px), on applique un zoom pour éviter que tout soit minuscule
  if (width > 2000) {
      zoomFactor = 1.5; 
  } else if (width > 1600) {
      zoomFactor = 1.25;
  } else {
      zoomFactor = 1.0; // Pc portable standard
  }

  // Création de la fenêtre
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      zoomFactor: zoomFactor // <--- Zoom dynamique appliqué ici
    },
    autoHideMenuBar: true,
    show: false // On cache la fenêtre le temps qu'elle charge
  });

  // 3. On force le mode "Maximisé" (Plein écran fenêtré)
  win.maximize();
  win.show(); // On affiche la fenêtre une fois qu'elle est en plein écran

  // Chargement du fichier
  win.loadFile('index.html');
  
  // Gestion du redimensionnement (Responsive)
  win.on('resize', () => {
      // Si l'utilisateur change d'écran en cours de route, on peut ajouter de la logique ici
      // mais le CSS (flexbox) gère déjà l'adaptation du contenu.
  });
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