document.addEventListener('DOMContentLoaded', () => {

    const APP_VERSION = "v5.13 (Multi-Mortiers)"; 
    const versionDiv = document.getElementById('app-version');
    if(versionDiv) versionDiv.textContent = `Biallais Config - ${APP_VERSION}`;

    // =======================================================================
    // 1. CONFIGURATION DES PRIX (TARIF 2026)
    // =======================================================================
    
    const COULEURS_SPECIALES = ['superblanc', 'bleu', 'vert']; 

    const PRIX_SAC_MORTIER = {
        'grisclair': 8.11,
        'blanc': 8.74,
        'superblanc': 8.74,
        'tonpierre': 8.74,
        'autre': 14.33 
    };

    const PRIX_BLOC_NU = {
        'p1': { 'lisse': { 'std': 4.09, 'spec': 7.31 }, 'roc': { 'std': 5.16, 'spec': 8.78 } },
        'p2': { 'lisse': { 'std': 3.55, 'spec': 6.29 }, 'roc': { 'std': 4.69, 'spec': 7.86 } },
        'p3': { 'lisse': { 'std': 2.55, 'spec': 4.73 }, 'roc': { 'std': 3.32, 'spec': 5.61 } },
        'p4': { 'lisse': { 'std': 1.65, 'spec': 2.82 } },
        'p5': { 'lisse': { 'std': 0.82, 'spec': 1.86 }, 'roc': { 'std': 0.97, 'spec': 2.11 } },
        'p6': { 'lisse': { 'std': 0.97, 'spec': 1.55 } },
        'p7': { 'lisse': { 'std': 1.37, 'spec': 2.46 }, 'roc': { 'std': 1.70, 'spec': 2.88 } },
        'p8': { 'lisse': { 'std': 1.65, 'spec': 3.73 }, 'roc': { 'std': 1.80, 'spec': 4.03 } },
        'p9': { 'lisse': { 'std': 1.75, 'spec': 2.79 } },
    };

    // --- NETTOYAGE FORCE ---
    const overlayZone = document.getElementById('initial-overlay');
    if (overlayZone) {
        const ghostImages = overlayZone.querySelectorAll('img');
        ghostImages.forEach(img => img.remove());
    }

    let autoUpdateTimer = null; 

    // --- ELEMENTS DOM ---
    const bouton = document.getElementById('genererBouton');
    const btnResetConfig = document.getElementById('btnResetConfig'); 
    const btnExportCctp = document.getElementById('btnExportCctp');
    const canvas = document.getElementById('apercuCanvas');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    const containerProduit = document.getElementById('container-produit');
    const containerFinition = document.getElementById('container-finition');
    const containerCouleur = document.getElementById('select-couleur'); 
    const infoEpaisseurDiv = document.getElementById('info-epaisseur'); 
    const dimensionsInfoSpan = document.getElementById('dimensions-info');

    const selectAppareillage = document.getElementById('select-appareillage');
    const selectJoint = document.getElementById('select-joint');
    const selectTypeJoint = document.getElementById('select-type-joint'); 
    
    const sliderJointH = document.getElementById('slider-joint-h');
    const sliderJointHVal = document.getElementById('slider-joint-h-valeur');
    const sliderJointV = document.getElementById('slider-joint-v');
    const sliderJointVVal = document.getElementById('slider-joint-v-valeur');
    
    const sliderRoc = document.getElementById('slider-roc');
    const sliderRocValeur = document.getElementById('slider-roc-valeur');
    const rocDistributionWrapper = document.getElementById('wrapper-repartition'); 
    const containerRocOptions = document.getElementById('container-roc-options');

    const containerColorDist = document.getElementById('container-color-dist');
    
    // --- RELIEF 3D ---
    const containerReliefSection = document.getElementById('container-relief-section');
    const selectReliefType = document.getElementById('select-relief-type');
    const sliderReliefPercent = document.getElementById('slider-relief-percent');
    const sliderReliefVal = document.getElementById('slider-relief-valeur');
    const containerReliefPercent = document.getElementById('container-relief-percent');
    
    const containerReliefOutOptions = document.getElementById('container-relief-out-options');
    const selectReliefColor = document.getElementById('select-relief-color');
    const selectReliefFinish = document.getElementById('select-relief-finish'); 
    
    const containerReliefInOptions = document.getElementById('container-relief-in-options');
    const selectReliefInColor = document.getElementById('select-relief-in-color');
    const selectReliefInFinish = document.getElementById('select-relief-in-finish');

    // --- RÈGLES ---
    const btnAddRule = document.getElementById('btn-add-rule');
    const btnResetRules = document.getElementById('btn-reset-rules');
    const inputRow = document.getElementById('new-line-number');
    const inputFinish = document.getElementById('new-line-finish');
    const inputColor = document.getElementById('new-line-color');
    const inputJoint = document.getElementById('new-line-joint'); 
    const rulesContainer = document.getElementById('active-rules-container');
    let rulesData = []; 

    // --- EXPORT ---
    const btnExportJpg = document.getElementById('btnExportJpg');
    const btnExportPng = document.getElementById('btnExportPng');
    const btnExportPdf = document.getElementById('btnExportPdf');
    const msgAstuceRoc = document.getElementById('msg-astuce-roc');
    
    // --- SCÈNES ---
    const selectScene = document.getElementById('select-scene');
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomControls = document.getElementById('zoom-controls');
    const canvasWrapper = document.querySelector('.canvas-container-wrapper');
    const patternLayer = document.getElementById('wall-pattern-layer');

    const userSurfaceInput = document.getElementById('user-global-surface');
    let lastStatsReal = {};
    let lastConfigProduit = null;
    let lastWidthMM = 0;
    let lastHeightMM = 0;

    // --- GESTION TIROIR ROUGES ---
    const btnOpenRouges = document.getElementById('btn-open-rouges');
    const subPaletteRouge = document.getElementById('sub-palette-rouge');

    if (btnOpenRouges && subPaletteRouge) {
        btnOpenRouges.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const isHidden = subPaletteRouge.style.display === 'none';
            subPaletteRouge.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                btnOpenRouges.style.backgroundColor = "#ef9a9a";
                btnOpenRouges.style.borderColor = "#c62828";
            } else {
                btnOpenRouges.style.backgroundColor = "#ffebee";
                btnOpenRouges.style.borderColor = "#e57373";
            }
        });
    }
    document.addEventListener('click', (e) => {
        if (btnOpenRouges && subPaletteRouge) {
            const isMobile = window.innerWidth <= 900;
            if (!isMobile && !btnOpenRouges.contains(e.target) && !subPaletteRouge.contains(e.target)) {
                subPaletteRouge.style.display = 'none';
                btnOpenRouges.style.backgroundColor = "#ffebee";
                btnOpenRouges.style.borderColor = "#e57373";
            }
        }
    });

    // =========================================================================
    // 12. GÉNÉRATEUR DE CCTP
    // =========================================================================

    const CCTP_TEMPLATES = {
        'MASONRY_HEADER': 
            "MAÇONNERIES DE BLOCS ARCHITECTONIQUES DESTINÉS À RESTER APPARENTS\n" +
            "Conformément au DTU 20.1 et à la norme NF P 14-102 (Blocs en Béton)\n\n" +
            "1. MATÉRIAUX\n" +
            "Blocs de construction décoratifs, garantis sans efflorescence de chaux, type BIACOLOR de chez BIALLAIS INDUSTRIES ou équivalent technique approuvé.\n" +
            "Certification : NF et CE 2+.\n" +
            "Classement : P120 (12 MPa) pour blocs pleins/perforés ou P60/P80 pour blocs creux.\n\n" +
            "1.1. Caractéristiques du Bloc sélectionné :\n" +
            "- Format : {PRODUCT_NAME}\n" +
            "- Dimensions de fabrication : {DIMS_FAB}\n" +
            "- Dimensions de coordination : {DIMS_COORD}\n" +
            "- Finition : {FINISH_DESC}\n" +
            "- Teinte : {COLOR_DESC}\n\n" +
            "1.2. Mortier de pose :\n" +
            "Le mortier sera un mortier industriel prêt à gâcher, spécifique, hydrofugé dans la masse et garanti sans efflorescence (type BIAMORTIER M10).\n" +
            "Dosage en liant > 350 kg/m³ de sable sec. Granulométrie 0-3 mm.\n" +
            "Teinte du joint : {JOINT_COLOR}.\n\n" +
            "2. MISE EN ŒUVRE (DTU 20.1)\n" +
            "- Les murs étant destinés à rester apparents, il ne devra y avoir aucune discontinuité entre les joints verticaux et horizontaux.\n" +
            "- Épaisseur des joints : {JOINT_SIZE} mm environ.\n" +
            "- Le profil des joints devra être réalisé au fer (joint plat ou demi-rond) pour éviter la stagnation des eaux.\n" +
            "- Protection : En cours de travaux, les murs doivent être protégés des intempéries (bâchage) pour éviter les coulures et l'humidification excessive.\n" +
            "- Nettoyage : Les éventuelles bavures de mortier doivent être nettoyées immédiatement à l'éponge et à l'eau claire.\n" +
            "- Calepinage : L'entreprise devra respecter le calepinage fourni, y compris l'alternance des nuances si un panachage est prescrit.",

        'GLUED_HEADER':
            "PLAQUETTES DE PAREMENT ARCHITECTONIQUES (POSE COLLÉE)\n" +
            "Conformément au DTU 52.2 (Pose collée des revêtements céramiques et assimilés)\n\n" +
            "1. MATÉRIAUX\n" +
            "Plaquettes de parement en béton architectonique, garanties sans efflorescence, type BIACOLOR de chez BIALLAIS INDUSTRIES.\n\n" +
            "1.1. Caractéristiques :\n" +
            "- Format : {PRODUCT_NAME}\n" +
            "- Épaisseur : 20 mm\n" +
            "- Finition : {FINISH_DESC}\n" +
            "- Teinte : {COLOR_DESC}\n\n" +
            "1.2. Système de collage :\n" +
            "- Colle : Mortier-colle performant (C2S1) adapté à l'extérieur (type ParexLanko ou équivalent).\n" +
            "- Jointoiement : Mortier de jointoiement hydrofugé spécifique (type BIAJOINT).\n" +
            "- Teinte du joint : {JOINT_COLOR}.\n\n" +
            "2. MISE EN ŒUVRE\n" +
            "- Support : Le support doit être propre, sain, plan et sec.\n" +
            "- Encollage : Double encollage obligatoire (sur le support et au dos de la plaquette) pour assurer un transfert total.\n" +
            "- Jointoiement : Réalisé au pochoir ou à la poche à douille, finition lissée au fer.\n" +
            "- Nettoyage à l'avancement impératif."
    };

    function generateCCTP() {
        const doc = new window.jspdf.jsPDF();
        const productId = getSingleValue(containerProduit);
        const finishes = getMultiValues(containerFinition);
        const colors = getMultiValues(containerCouleur);
        
        let baseText = "";
        let dimsFab = "";
        let dimsCoord = "";
        let productName = "";

        switch(productId) {
            case 'p1': // Bloc 19
                productName = "Bloc 19x19x39";
                dimsFab = "190 x 190 x 390 mm";
                dimsCoord = "200 x 200 x 400 mm";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p2': // Bloc 15
                productName = "Bloc 15x19x39";
                dimsFab = "150 x 190 x 390 mm";
                dimsCoord = "150 x 200 x 400 mm";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p3': // Bloc 9
                productName = "Bloc 9x19x39";
                dimsFab = "90 x 190 x 390 mm";
                dimsCoord = "100 x 200 x 400 mm";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p4': // Maxi 6x22x22
                productName = "Maxibrique 6x22x22";
                dimsFab = "60 x 220 x 220 mm";
                dimsCoord = "Variable selon joint (Standard ~10mm)";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p5': // Brique P5
                productName = "Brique 6x10,5x22 (P5)";
                dimsFab = "60 x 105 x 220 mm";
                dimsCoord = "70 x 115 x 230 mm";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p6': // Plaquette
                productName = "Plaquette 6x2x22";
                dimsFab = "60 x 20 x 220 mm";
                dimsCoord = "N/A (Collé)";
                baseText = CCTP_TEMPLATES.GLUED_HEADER;
                break;
            case 'p7': // Maxi 19
                productName = "Maxibrique 19x09x24 (P7)";
                dimsFab = "190 x 90 x 240 mm";
                dimsCoord = "200 x 100 x 250 mm";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p8': // Allongée
                productName = "Brique Allongée 6x11x44 (P8)";
                dimsFab = "60 x 110 x 440 mm";
                dimsCoord = "70 x 120 x 450 mm";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
                break;
            case 'p9': // Plaq Longue
                productName = "Plaquette Allongée 6x1,8x44";
                dimsFab = "60 x 18 x 440 mm";
                dimsCoord = "N/A (Collé)";
                baseText = CCTP_TEMPLATES.GLUED_HEADER;
                break;
            default:
                productName = "Produit Biallais";
                baseText = CCTP_TEMPLATES.MASONRY_HEADER;
        }

        let finishDesc = finishes.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(" + ");
        if (finishes.includes('lisse') && finishes.includes('roc')) {
            finishDesc = "Panachage LISSE et ROC (Proportion à définir sur calepinage)";
        }

        let colorDesc = colors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(" + ");
        if (colors.length > 1) {
            colorDesc = `Mélange Multicolore : ${colorDesc}`;
        }

        const jointH = document.getElementById('slider-joint-h').value;
        const jointV = document.getElementById('slider-joint-v').value;
        const selectJoint = document.getElementById('select-joint');
        const jointColorName = selectJoint.options[selectJoint.selectedIndex].text;

        let finalCCTP = baseText
            .replace('{PRODUCT_NAME}', productName)
            .replace('{DIMS_FAB}', dimsFab)
            .replace('{DIMS_COORD}', dimsCoord)
            .replace('{FINISH_DESC}', finishDesc)
            .replace('{COLOR_DESC}', colorDesc)
            .replace('{JOINT_SIZE}', `${jointH}mm (H) x ${jointV}mm (V)`)
            .replace('{JOINT_COLOR}', jointColorName);

        doc.setFontSize(16);
        doc.setTextColor(40, 167, 69);
        doc.text("EXTRAIT CCTP - PRESCRIPTION TYPE", 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Généré le ${new Date().toLocaleDateString()} via Biallais Configurator`, 20, 28);

        doc.setFontSize(11);
        doc.setTextColor(0);
        
        const splitText = doc.splitTextToSize(finalCCTP, 170);
        doc.text(splitText, 20, 40);

        doc.save(`CCTP_Biallais_${productName.replace(/ /g, '_')}.pdf`);
    }

    if (btnExportCctp) {
        btnExportCctp.addEventListener('click', generateCCTP);
    }

    const SCENES_CONFIG = {
        'neutre': { img: null, mode: 'canvas' },
        'facade': { img: null, mode: 'pattern', scalePattern: 0.35, css: 'rotateY(0deg)', scaleMobile: 0.25, cssMobile: 'rotateY(0deg)' },
        'jardin': { img: null, mode: 'pattern', scalePattern: 0.3, css: 'perspective(1000px) rotateY(35deg) translate(-50px, 0)', scaleMobile: 0.2, cssMobile: 'perspective(600px) rotateY(20deg) translate(0, 0)' }
    };

    function triggerAutoUpdate() {
        if (autoUpdateTimer) clearTimeout(autoUpdateTimer);
        if(bouton) {
            bouton.textContent = "Actualisation...";
            bouton.style.opacity = "0.7";
        }
        autoUpdateTimer = setTimeout(() => {
            lancerGenerationMoteur();
        }, 500);
    }

    function updateUIValues() {
        if(sliderRoc && sliderRocValeur) sliderRocValeur.textContent = sliderRoc.value + '%';
        if(sliderJointH && sliderJointHVal) sliderJointHVal.textContent = sliderJointH.value + ' mm';
        if(sliderJointV && sliderJointVVal) sliderJointVVal.textContent = sliderJointV.value + ' mm';
        if(sliderReliefPercent && sliderReliefVal) sliderReliefVal.textContent = sliderReliefPercent.value + '%';
    }

    if (userSurfaceInput) {
        userSurfaceInput.addEventListener('input', () => {
            if (lastConfigProduit) {
                updateTechSummary(lastWidthMM, lastHeightMM, lastConfigProduit, lastStatsReal);
            }
        });
    }

    const inputsToWatch = [
        selectAppareillage, selectJoint, selectTypeJoint, 
        sliderJointH, sliderJointV, sliderRoc, selectScene,
        selectReliefType, sliderReliefPercent,
        selectReliefColor, selectReliefFinish,
        selectReliefInColor, selectReliefInFinish
    ];
    
    inputsToWatch.forEach(el => {
        if(el) {
            el.addEventListener('input', () => {
                updateUIValues();
                if (el === sliderJointH || el === selectAppareillage) updateMaxRows(); 
                triggerAutoUpdate();
            });
            el.addEventListener('change', () => {
                updateUIValues();
                if (el === sliderJointH || el === selectAppareillage) updateMaxRows();
                triggerAutoUpdate();
            });
        }
    });

    if (selectReliefType) {
        selectReliefType.addEventListener('change', () => {
            const val = selectReliefType.value;
            if (containerReliefPercent) containerReliefPercent.style.display = (val === 'none') ? 'none' : 'flex';
            if (containerReliefOutOptions) {
                const showOut = (val === 'random-out' || val === 'random-mix');
                containerReliefOutOptions.style.display = showOut ? 'block' : 'none';
            }
            if (containerReliefInOptions) {
                const showIn = (val === 'random-in' || val === 'random-mix');
                containerReliefInOptions.style.display = showIn ? 'block' : 'none';
            }
            triggerAutoUpdate();
        });
    }

    let currentZoom = 1;
    let isDragging = false;
    let startX, startY;
    let translateX = 0, translateY = 0;

    function applyTransform() {
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    }

    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            currentZoom = parseFloat(e.target.value);
            if (currentZoom === 1) {
                translateX = 0; translateY = 0;
                canvasWrapper.classList.remove('grab-cursor');
            } else {
                canvasWrapper.classList.add('grab-cursor');
            }
            applyTransform();
        });
    }

    if (canvasWrapper) {
        canvasWrapper.addEventListener('mousedown', (e) => {
            if (currentZoom > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                canvasWrapper.classList.add('grabbing-cursor');
            }
        });
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                canvasWrapper.classList.remove('grabbing-cursor');
            }
        });
        canvasWrapper.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            applyTransform();
        });
    }

    if (selectScene && patternLayer) {
        selectScene.addEventListener('change', (e) => {
            updateSceneView(e.target.value);
        });
    }

    function updateSceneView(sceneKey) {
        const config = SCENES_CONFIG[sceneKey];
        if (!config) return;

        const layer = document.getElementById('wall-pattern-layer');
        const cvs = document.getElementById('apercuCanvas');

        if (config.mode === 'canvas') {
            if(layer) layer.style.display = 'none';
            cvs.style.display = 'block'; 
            if(zoomControls) zoomControls.style.display = 'flex';
            if(zoomSlider) { zoomSlider.value = 1; zoomSlider.dispatchEvent(new Event('input')); }
            cvs.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        } 
        else {
            if (layer) {
                cvs.style.display = 'block'; 
                try {
                    const textureUrl = cvs.toDataURL(); 
                    cvs.style.display = 'none'; 
                    layer.style.display = 'block';
                    layer.style.backgroundImage = `url(${textureUrl})`;
                    const dpr = window.devicePixelRatio || 1;
                    const isMobile = window.innerWidth <= 900; 
                    const currentScale = (isMobile && config.scaleMobile) ? config.scaleMobile : config.scalePattern;
                    const currentCss = (isMobile && config.cssMobile) ? config.cssMobile : config.css;
                    const finalSize = (cvs.width / dpr) * currentScale;
                    layer.style.backgroundSize = `${finalSize}px auto`;
                    layer.style.transform = `translate(-50%, -50%) ${currentCss}`;
                } catch (e) {
                    console.error("Erreur Canvas Tainted", e);
                    cvs.style.display = 'none';
                    layer.style.display = 'block';
                    layer.style.background = '#eee';
                    layer.innerHTML = "<div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px;background:white;border-radius:8px;'>Impossible de générer la texture 3D (Sécurité Navigateur).</div>";
                }
            }
            if(zoomControls) zoomControls.style.display = 'none';
        }
    }

    const LARGEUR_CIBLE_MM = 2000; 
    const HAUTEUR_CIBLE_MM = 1600; 
    
    // RESTRICTIONS GLOBALES
    const NO_ROC_PRODUCTS = ['p4', 'p6', 'p9'];
    const NO_ROC_COLORS = ['terredesienne', 'orange', 'corail', 'tomette', 'carmin', 'liedevin'];
    const PRODUCTS_MIN_JOINT_8MM = ['p1', 'p2', 'p4', 'p7'];
    
    // Config produits
    const PRODUITS_CONFIG = {
        'p1': { dims: { largeur: 390, hauteur: 190 }, texture_mm: 500 },
        'p2': { dims: { largeur: 390, hauteur: 190 }, texture_mm: 500 },
        'p3': { dims: { largeur: 390, hauteur: 190 }, texture_mm: 500 },
        'p4': { dims: { largeur: 220, hauteur: 60 },  texture_mm: 300 },
        'p5': { dims: { largeur: 220, hauteur: 60 },  texture_mm: 300 }, 
        'p6': { dims: { largeur: 220, hauteur: 60 },  texture_mm: 300 },
        'p7': { dims: { largeur: 240, hauteur: 90 },  texture_mm: 300 },
        'p8': { dims: { largeur: 440, hauteur: 60 },  texture_mm: 500 },
        'p9': { dims: { largeur: 440, hauteur: 60 },  texture_mm: 500 }
    };

    // MISE A JOUR DES CONSOMMATIONS SELON VOTRE DEMANDE
    const CONSOMMATION_MORTIER_REF = { 
        'p1': 40,  // Bloc 19x39
        'p2': 30,  // Bloc 15
        'p3': 18,  // Bloc 9 19 39
        'p4': 110, // Maxibrique 6x22x22
        'p5': 38,  // Brique 6x10.5x22 (P5)
        'p6': 9,   // Plaquette 6x22 (Biajoint)
        'p7': 65,  // Maxibrique 19x9x24
        'p8': 36,  // Brique allongée
        'p9': 8    // Plaquette allongée (Biajoint)
    };

    const INFOS_EPAISSEUR = {
        'p1': 'Disponible en Lisse et/ou Roc', 'p2': 'Disponible en Lisse et/ou Roc', 
        'p3': 'Disponible en Lisse et/ou Roc', 'p4': 'Disponible en Lisse uniquement',
        'p5': 'Disponible en Lisse et/ou Roc', 'p6': 'Disponible en Lisse uniquement', 
        'p7': 'Disponible en Lisse et/ou Roc', 'p8': 'Disponible en Lisse et/ou Roc', 
        'p9': 'Disponible en Lisse uniquement'
    };
    
    const TAILLE_REELLE_TEXTURE_JOINT_MM = 600;
    const NOMBRE_VARIATIONS = 3; 

    // --- COULEURS FALLBACK ---
    const FALLBACK_COLORS = {
        'blanc': '#ecf0f1', 'tonpierre': '#e6d8ad', 'jaune': '#f1c40f', 'saumon': '#ffab91', 'rouge': '#c0392b',
        'chocolat': '#5d4037', 'brun': '#795548', 'grisclair': '#bdc3c7', 'grisfonce': '#7f8c8d', 'anthracite': '#2c3e50',
        'superblanc': '#ffffff', 'bleu': '#3498db', 'vert': '#2ecc71',
        'terredesienne': '#A0522D', 'orange': '#E67E22', 'corail': '#FF7F50',
        'tomette': '#BF5841', 'carmin': '#960018', 'liedevin': '#581845'
    };

    // --- GESTION RESTRICTIONS ---
    function checkReliefCompatibility(productId) {
        if (!containerReliefSection || !selectReliefType) return;
        const allowed = ['p5', 'p8'];
        const isAllowed = allowed.includes(productId);
        if (isAllowed) {
            containerReliefSection.style.display = 'block';
        } else {
            containerReliefSection.style.display = 'none';
            if (selectReliefType.value !== 'none') {
                selectReliefType.value = 'none';
                selectReliefType.dispatchEvent(new Event('change'));
            }
        }
    }

    function checkAppareillageCompatibility(productId) {
        if (!selectAppareillage) return;
        const optFlamand = selectAppareillage.querySelector('option[value="flamand"]');
        const optAnglais = selectAppareillage.querySelector('option[value="anglais"]');
        const isP5 = (productId === 'p5');
        
        if (optFlamand) {
            optFlamand.disabled = !isP5;
            if (!isP5 && optFlamand.textContent.indexOf('⛔') === -1) optFlamand.textContent += " (Uniquement Brique P5)";
            else if (isP5) optFlamand.textContent = "Appareillage Flamand (Belge)";
        }
        if (optAnglais) {
            optAnglais.disabled = !isP5;
            if (!isP5 && optAnglais.textContent.indexOf('⛔') === -1) optAnglais.textContent += " (Uniquement Brique P5)";
            else if (isP5) optAnglais.textContent = "Appareillage Anglais";
        }

        const currentVal = selectAppareillage.value;
        if (!isP5 && (currentVal === 'flamand' || currentVal === 'anglais')) {
            selectAppareillage.value = 'demi-brique';
            alert("⚠️ L'appareillage sélectionné n'est disponible qu'avec le format 'Brique 6x10,5x22' (P5). Retour au standard.");
        }
    }

    function updateMaxRows() {
        const produitVal = getSingleValue(containerProduit);
        const config = PRODUITS_CONFIG[produitVal];
        const appareillage = selectAppareillage ? selectAppareillage.value : 'aligne';
        const jointH = sliderJointH ? parseInt(sliderJointH.value) : 10;
        
        if (config) {
            const moduleH = config.dims.hauteur + jointH;
            let maxRows = Math.round(HAUTEUR_CIBLE_MM / moduleH);
            if (appareillage === 'demi-brique' || appareillage === 'moucharabieh') { if (maxRows % 2 !== 0) maxRows++; }
            else if (appareillage === 'tiers') { while (maxRows % 3 !== 0) maxRows++; }
            
            const spanInfo = document.getElementById('info-max-lines');
            const inputNum = document.getElementById('new-line-number');
            if (spanInfo) spanInfo.textContent = `(Dispo : 1 à ${maxRows})`;
            if (inputNum) {
                inputNum.placeholder = `Ex: 1, 3, 5 (Max ${maxRows})`;
                inputNum.dataset.max = maxRows;
            }
        }
    }

    function validateRocConstraints() {
        const productId = getSingleValue(containerProduit);
        const selectedColors = getMultiValues(containerCouleur);
        const rocOption = containerFinition.querySelector('.custom-option[data-value="roc"]');
        const lisseOption = containerFinition.querySelector('.custom-option[data-value="lisse"]');
        const isProductRestricted = NO_ROC_PRODUCTS.includes(productId);
        const hasRestrictedColor = selectedColors.some(c => NO_ROC_COLORS.includes(c));

        if (isProductRestricted || hasRestrictedColor) {
            rocOption.classList.add('disabled');
            if (rocOption.classList.contains('selected')) {
                rocOption.classList.remove('selected');
                lisseOption.classList.add('selected');
            }
        } else {
            rocOption.classList.remove('disabled');
        }
        checkRocVisibility();
    }

    function checkVerticalJointLimit(productId) {
        if (!sliderJointV) return;
        if (PRODUCTS_MIN_JOINT_8MM.includes(productId)) {
            sliderJointV.min = 8;
            if (parseInt(sliderJointV.value) < 8) { sliderJointV.value = 8; sliderJointVVal.textContent = '8 mm'; }
        } else { sliderJointV.min = 1; }
    }

    if (btnAddRule) {
        btnAddRule.addEventListener('click', (e) => {
            e.preventDefault();
            const rawText = inputRow.value;
            const rowsToAdd = rawText.split(',').map(str => parseInt(str.trim())).filter(num => !isNaN(num) && num > 0);
            if (rowsToAdd.length === 0) { alert("Numéro de ligne invalide."); return; }
            const finish = inputFinish.value; const color = inputColor.value; const joint = inputJoint ? inputJoint.value : ""; 
            rowsToAdd.forEach(row => { rulesData = rulesData.filter(r => r.row !== row); rulesData.push({ row, finish, color, joint }); });
            rulesData.sort((a, b) => a.row - b.row);
            renderRules(); inputRow.value = ''; inputRow.focus(); triggerAutoUpdate(); 
        });
    }

    if (btnResetRules) {
        btnResetRules.addEventListener('click', (e) => {
            e.preventDefault();
            rulesData = [];
            renderRules();
            triggerAutoUpdate();
        });
    }

    const inputsLigneForcee = [inputRow, inputFinish, inputColor, inputJoint];
    inputsLigneForcee.forEach(element => {
        if (element) {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); if (btnAddRule) btnAddRule.click(); }
            });
        }
    });

    function renderRules() {
        if (!rulesContainer) return;
        rulesContainer.innerHTML = '';
        if (rulesData.length === 0) { rulesContainer.innerHTML = '<small style="color:#999; font-style:italic;">Aucune.</small>'; return; }
        const colorLabels = { 'blanc': 'Blanc', 'tonpierre': 'Ton Pierre', 'jaune': 'Jaune', 'saumon': 'Saumon', 'rouge': 'Rouge', 'chocolat': 'Chocolat', 'brun': 'Brun', 'grisclair': 'Gris Clair', 'grisfonce': 'Gris Foncé', 'anthracite': 'Anthracite', 'superblanc': 'Super Blanc', 'bleu': 'Bleu', 'vert': 'Vert', 'terredesienne': 'Terre de Sienne', 'orange': 'Orange', 'corail': 'Corail', 'tomette': 'Tomette', 'carmin': 'Carmin', 'liedevin': 'Lie de Vin' };
        rulesData.forEach((rule, index) => {
            const tag = document.createElement('div');
            tag.className = 'rule-tag';
            const finishLabel = (rule.finish === 'roc') ? 'Roc' : 'Lisse';
            let text = `L${rule.row} : ${finishLabel}`;
            if (rule.color) { const cLabel = colorLabels[rule.color] || rule.color; text += ` (${cLabel})`; }
            tag.innerHTML = `<span>${text}</span> <span class="remove-tag" data-index="${index}" title="Supprimer" style="cursor:pointer;color:red;font-weight:bold;">&times;</span>`;
            rulesContainer.appendChild(tag);
        });
        rulesContainer.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => { rulesData.splice(parseInt(e.target.dataset.index), 1); renderRules(); triggerAutoUpdate(); });
        });
    }

    function updateEpaisseurText(valeurProduit) {
        if (infoEpaisseurDiv && INFOS_EPAISSEUR[valeurProduit]) {
            const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.28H3.73L12 5.45zM11 10v6h2v-6h-2zm0 8v2h2v-2h-2z"/></svg>`;
            infoEpaisseurDiv.innerHTML = iconHtml + "<span>" + INFOS_EPAISSEUR[valeurProduit] + "</span>";
            infoEpaisseurDiv.style.display = 'flex';
        } else if (infoEpaisseurDiv) { infoEpaisseurDiv.style.display = 'none'; }
    }

    function setupSingleChoice(containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        if (containerId === 'container-produit') {
            const selected = container.querySelector('.custom-option.selected');
            if (selected) {
                const val = selected.dataset.value;
                updateEpaisseurText(val); validateRocConstraints(); checkVerticalJointLimit(val); updateMaxRows(); checkAppareillageCompatibility(val); checkReliefCompatibility(val);
            }
        }
        container.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (!option) return;
            container.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            if (containerId === 'container-produit') {
                const val = option.dataset.value;
                updateEpaisseurText(val); validateRocConstraints(); checkVerticalJointLimit(val); updateMaxRows(); checkAppareillageCompatibility(val); checkReliefCompatibility(val);
            }
            triggerAutoUpdate(); 
        });
    }

    function setupMultiChoice(containerElement) {
        if(!containerElement) return;
        containerElement.addEventListener('click', (e) => {
            if (e.target.closest('.category-trigger')) return; 
            const option = e.target.closest('.custom-option');
            if (!option) return;
            if(option.classList.contains('disabled')) return;
            option.classList.toggle('selected');
            
            if(containerElement === containerCouleur || containerElement.id === 'sub-palette-rouge') {
                validateRocConstraints();
            }
            
            checkRocVisibility(); checkColorDistribution(); triggerAutoUpdate(); 
        });
    }

    setupSingleChoice('container-produit');
    setupMultiChoice(containerFinition);
    setupMultiChoice(containerCouleur);

    function checkRocVisibility() {
        const rocOption = containerFinition.querySelector('.custom-option[data-value="roc"]');
        const lisseOption = containerFinition.querySelector('.custom-option[data-value="lisse"]');
        const isRoc = rocOption && rocOption.classList.contains('selected');
        const isLisse = lisseOption && lisseOption.classList.contains('selected');
        
        if(rocOption.classList.contains('disabled')) {
             if(rocDistributionWrapper) rocDistributionWrapper.style.display = 'none';
        } else {
             if (rocDistributionWrapper) {
                 const shouldShow = (isRoc && isLisse);
                 rocDistributionWrapper.style.display = shouldShow ? 'block' : 'none';
                 if (shouldShow) updateUIValues(); 
             }
        }
        if (containerRocOptions) containerRocOptions.style.display = 'block';
        if (msgAstuceRoc) msgAstuceRoc.style.display = 'none';
    }
    
    function checkColorDistribution() {
        if (!containerColorDist) return;
        const selectedColors = containerCouleur.querySelectorAll('.custom-option.selected');
        const containerSliders = document.getElementById('dynamic-sliders-container');
        if (selectedColors.length >= 2) {
            containerColorDist.style.display = 'block';
            const existingValues = {}; let hasExisting = false;
            containerSliders.querySelectorAll('input').forEach(input => {
                existingValues[input.dataset.color] = parseInt(input.value); hasExisting = true;
            });
            containerSliders.innerHTML = ''; 
            const totalDisplayDiv = document.createElement('div');
            totalDisplayDiv.style.marginBottom = '15px'; totalDisplayDiv.style.fontWeight = 'bold'; totalDisplayDiv.style.textAlign = 'center'; totalDisplayDiv.style.color = '#333';
            totalDisplayDiv.innerHTML = 'Total : <span id="total-pourcentage">100</span>% / 100%';
            containerSliders.appendChild(totalDisplayDiv);
            const count = selectedColors.length; const defaultShare = Math.floor(100 / count); let remainder = 100 - (defaultShare * count);
            const initialValuesMap = {};
            selectedColors.forEach((opt, index) => {
                const colorCode = opt.dataset.value;
                if (hasExisting && existingValues[colorCode] !== undefined) { initialValuesMap[colorCode] = existingValues[colorCode]; }
                else { initialValuesMap[colorCode] = defaultShare + (index < remainder ? 1 : 0); }
            });
            let currentTotalInit = 0; Object.values(initialValuesMap).forEach(v => currentTotalInit += v);
            if (currentTotalInit > 100) { selectedColors.forEach((opt, index) => { initialValuesMap[opt.dataset.value] = defaultShare + (index < remainder ? 1 : 0); }); }

            selectedColors.forEach(opt => {
                const colorCode = opt.dataset.value; const colorName = opt.querySelector('span').textContent;
                const row = document.createElement('div');
                row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.marginBottom = '5px'; row.style.gap = '10px';
                const label = document.createElement('span'); label.textContent = colorName; label.style.fontSize = '0.85rem'; label.style.width = '80px'; label.style.fontWeight = 'bold';
                const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '1'; input.value = initialValuesMap[colorCode]; input.style.flex = '1'; input.dataset.color = colorCode; 
                const valSpan = document.createElement('span'); valSpan.textContent = input.value + '%'; valSpan.style.width = '35px'; valSpan.style.fontSize = '0.8rem'; valSpan.style.textAlign = 'right';
                input.addEventListener('input', () => {
                    let currentVal = parseInt(input.value);
                    const allInputs = Array.from(containerSliders.querySelectorAll('input[type="range"]'));
                    let sumOthers = 0; allInputs.forEach(inp => { if (inp !== input) sumOthers += parseInt(inp.value); });
                    const maxAvailable = 100 - sumOthers;
                    if (currentVal > maxAvailable) { currentVal = maxAvailable; input.value = currentVal; }
                    valSpan.textContent = currentVal + '%';
                    const newTotal = sumOthers + currentVal;
                    const totalSpan = document.getElementById('total-pourcentage');
                    if(totalSpan) { totalSpan.textContent = newTotal; totalSpan.style.color = (newTotal === 100) ? 'green' : 'orange'; }
                    triggerAutoUpdate(); 
                });
                row.appendChild(label); row.appendChild(input); row.appendChild(valSpan); containerSliders.appendChild(row);
            });
            const totalSpan = document.getElementById('total-pourcentage');
            if(totalSpan) {
                let initSum = 0; Object.values(initialValuesMap).forEach(v => initSum += v);
                totalSpan.textContent = initSum; totalSpan.style.color = (initSum === 100) ? 'green' : 'orange';
            }
        } else { containerColorDist.style.display = 'none'; }
    }

    function showLoading() {
        if(loadingOverlay) loadingOverlay.classList.remove('hidden');
        if(bouton) { bouton.disabled = true; bouton.textContent = "Chargement..."; }
    }
    function hideLoading() {
        if(loadingOverlay) loadingOverlay.classList.add('hidden');
        if(bouton) { bouton.disabled = false; bouton.textContent = "Mélanger / Régénérer"; bouton.style.opacity = "1"; }
        
        // ON CACHE LE LOGO DÈS QUE C'EST FINI
        const initialOverlay = document.getElementById('initial-overlay');
        if(initialOverlay && !initialOverlay.classList.contains('hidden')) {
            initialOverlay.classList.add('hidden');
        }
    }
    
    function getSingleValue(container) {
        const selected = container.querySelector('.custom-option.selected'); return selected ? selected.dataset.value : 'p1';
    }
    function getMultiValues(container) {
        const values = []; const selected = container.querySelectorAll('.custom-option.selected');
        selected.forEach(opt => values.push(opt.dataset.value));
        // MODIFICATION : On retire le fallback automatique
        // if (values.length === 0) { ... }
        return values;
    }
    function chargerImage(src) {
        return new Promise((resolve) => {
            const img = new Image(); img.onload = () => resolve({ src: src, img: img, status: 'ok' }); img.onerror = () => resolve({ src: src, img: null, status: 'error' }); img.src = src;
        });
    }
    
    function setupCanvas(widthMM, heightMM) {
        canvas.style.width = '100%'; canvas.style.height = 'auto';
        const dpr = window.devicePixelRatio || 1; const scaleRatio = 0.8; 
        const widthPx = Math.round(widthMM * scaleRatio); const heightPx = Math.round(heightMM * scaleRatio);
        canvas.width = widthPx * dpr; canvas.height = heightPx * dpr;
        const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
        return { ctx, width: widthPx, height: heightPx, scaleFactor: scaleRatio };
    }

    bouton.addEventListener('click', () => { lancerGenerationMoteur(); });

    // BOUTON RESET : LOGIQUE COMPLÈTE
    if(btnResetConfig) {
        btnResetConfig.addEventListener('click', () => {
            if(!confirm("Voulez-vous vraiment réinitialiser tout le configurateur et revenir à zéro ?")) return;

            // 1. Reset Produit (P1 par défaut)
            containerProduit.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            containerProduit.querySelector('[data-value="p1"]').classList.add('selected');

            // 2. Clear Couleurs (Aucune sélection = Mode Esquisse)
            containerCouleur.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            if(subPaletteRouge) {
                subPaletteRouge.style.display = 'none';
                subPaletteRouge.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            }
            if(btnOpenRouges) {
                btnOpenRouges.style.backgroundColor = "#ffebee";
                btnOpenRouges.style.borderColor = "#e57373";
            }
            containerColorDist.style.display = 'none';

            // 3. Reset Finitions (Lisse par défaut)
            containerFinition.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            containerFinition.querySelector('[data-value="lisse"]').classList.add('selected');
            if(rocDistributionWrapper) rocDistributionWrapper.style.display = 'none';
            if(containerRocOptions) containerRocOptions.style.display = 'none';

            // 4. Reset Selects & Inputs
            if(selectAppareillage) selectAppareillage.value = 'demi-brique';
            if(selectJoint) selectJoint.value = 'joint_grisclair.png';
            if(selectTypeJoint) selectTypeJoint.value = 'plat';
            if(sliderJointH) { sliderJointH.value = 10; updateUIValues(); }
            if(sliderJointV) { sliderJointV.value = 10; updateUIValues(); }
            if(sliderRoc) { sliderRoc.value = 25; updateUIValues(); }

            // 5. Reset Rules
            rulesData = [];
            renderRules();

            // 6. Reset 3D Relief
            if(selectReliefType) {
                selectReliefType.value = 'none';
                selectReliefType.dispatchEvent(new Event('change')); 
            }

            // 7. Reset Vue
            if(selectScene) selectScene.value = 'neutre';
            if(zoomSlider) { zoomSlider.value = 1; zoomSlider.dispatchEvent(new Event('input')); }

            // 8. RÉAFFICHAGE VIDÉO (Au lieu de lancer le moteur esquisse)
            
            // On vide le canvas visuellement pour que ce soit propre
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            
            // On réaffiche l'overlay
            const initialOverlay = document.getElementById('initial-overlay');
            if (initialOverlay) {
                initialOverlay.classList.remove('hidden');
                const video = initialOverlay.querySelector('video');
                if(video) video.play();
            }

            // On réarme l'événement pour cacher l'overlay au prochain clic
            const configPanel = document.querySelector('.config-panel');
            if (configPanel) { 
                // Pour éviter les doublons d'écouteurs, on supprime l'ancien (si possible) et on remet
                configPanel.removeEventListener('mousedown', dismissWelcomeScreen);
                configPanel.addEventListener('mousedown', dismissWelcomeScreen, { once: true });
                configPanel.removeEventListener('touchstart', dismissWelcomeScreen);
                configPanel.addEventListener('touchstart', dismissWelcomeScreen, { once: true });
            }
        });
    }

    // MODIFICATION : Suppression de l'appel automatique au démarrage
    // Le code ci-dessous est commenté/supprimé pour laisser la vidéo visible
    // setTimeout(() => { lancerGenerationMoteur(); }, 500);

    function lancerGenerationMoteur() {
        showLoading();
        
        setTimeout(() => {
            const produitChoisi = getSingleValue(containerProduit);
            const finitionsChoisies = getMultiValues(containerFinition);
            const couleursChoisies = getMultiValues(containerCouleur);
            const appareillageChoisi = selectAppareillage.value;
            const nomFichierJointGlobal = selectJoint ? selectJoint.value : 'joint_grisclair.png';
            const typeJoint = selectTypeJoint ? selectTypeJoint.value : 'plat'; 
            const largeurJointH = sliderJointH ? parseInt(sliderJointH.value) : 10; 
            const largeurJointV = sliderJointV ? parseInt(sliderJointV.value) : 10; 
            const pourcentageRoc = parseInt(sliderRoc.value);
            
            const reliefType = selectReliefType ? selectReliefType.value : 'none';
            const reliefPercent = sliderReliefPercent ? parseInt(sliderReliefPercent.value) : 0;
            const reliefOutColor = selectReliefColor ? selectReliefColor.value : 'auto';
            const reliefOutFinish = selectReliefFinish ? selectReliefFinish.value : 'auto';
            const reliefInColor = selectReliefInColor ? selectReliefInColor.value : 'auto';
            const reliefInFinish = selectReliefInFinish ? selectReliefInFinish.value : 'auto';
            
            const lignesRocMap = {}; const lignesLisseMap = {}; const lignesJointMap = {}; 
            const colorWeights = {}; let totalWeight = 0;
            
            const sliders = document.querySelectorAll('#dynamic-sliders-container input');
            if (sliders.length > 0) {
                sliders.forEach(input => { const weight = parseInt(input.value); colorWeights[input.dataset.color] = weight; totalWeight += weight; });
            } else if (couleursChoisies.length > 0) {
                 couleursChoisies.forEach(c => { colorWeights[c] = 100; totalWeight+=100; });
            }
            if (totalWeight === 0 && couleursChoisies.length > 0) { couleursChoisies.forEach(c => { colorWeights[c] = 100; totalWeight+=100; }); }

            rulesData.forEach(r => {
                const colorToUse = (r.color && r.color !== "") ? r.color : null;
                if (r.finish === 'roc') lignesRocMap[r.row] = colorToUse; else lignesLisseMap[r.row] = colorToUse;
                if (r.joint) lignesJointMap[r.row] = r.joint;
            });

            let configProduit = PRODUITS_CONFIG[produitChoisi]; if (!configProduit) configProduit = PRODUITS_CONFIG['p1'];

            const listeACharger = [nomFichierJointGlobal];
            
            // MODIFICATION: On ne charge les textures que si des couleurs sont choisies
            if (couleursChoisies.length > 0) {
                Object.values(lignesJointMap).forEach(j => { if (j && !listeACharger.includes(j)) listeACharger.push(j); });

                couleursChoisies.forEach(couleur => {
                    finitionsChoisies.forEach(finition => {
                        for (let i = 1; i <= NOMBRE_VARIATIONS; i++) listeACharger.push(`${couleur}_${finition}_${i}.png`);
                    });
                });

                Object.values(lignesRocMap).forEach(c => { if(c) for(let i=1; i<=NOMBRE_VARIATIONS; i++) listeACharger.push(`${c}_roc_${i}.png`); });
                Object.values(lignesLisseMap).forEach(c => { if(c) for(let i=1; i<=NOMBRE_VARIATIONS; i++) listeACharger.push(`${c}_lisse_${i}.png`); });

                if (reliefType !== 'none' && reliefPercent > 0) {
                    const configsToLoad = [];
                    if (reliefType === 'random-out' || reliefType === 'random-mix') {
                        configsToLoad.push({ col: reliefOutColor, fin: reliefOutFinish });
                    }
                    if (reliefType === 'random-in' || reliefType === 'random-mix') {
                        configsToLoad.push({ col: reliefInColor, fin: reliefInFinish });
                    }

                    configsToLoad.forEach(cfg => {
                        let cols = (cfg.col !== 'auto') ? [cfg.col] : []; 
                        let fins = (cfg.fin !== 'auto') ? [cfg.fin] : ['lisse', 'roc']; 
                        
                        cols.forEach(c => {
                            fins.forEach(f => {
                                 let finishToLoad = f;
                                 if (f === 'roc' && NO_ROC_COLORS.includes(c)) {
                                     finishToLoad = 'lisse';
                                 }
                                 for(let i=1; i<=NOMBRE_VARIATIONS; i++) {
                                     const name = `${c}_${finishToLoad}_${i}.png`;
                                     if (!listeACharger.includes(name)) listeACharger.push(name);
                                 }
                            });
                        });
                    });
                }
            }

            Promise.all(listeACharger.map(src => chargerImage(src)))
                .then(resultats => {
                    const jointsLibrary = {}; const imagesMap = {};
                    resultats.forEach((res, index) => {
                        const nom = listeACharger[index];
                        if (res.status === 'ok') {
                            if (nom.includes('joint')) jointsLibrary[nom] = res.img;
                            else {
                                const parts = nom.split('_'); 
                                if (parts.length >= 2) {
                                    const key = parts[0] + '_' + parts[1];
                                    if (!imagesMap[key]) imagesMap[key] = [];
                                    imagesMap[key].push(res.img);
                                }
                            }
                        }
                    });

                    try {
                        const imgGlobalJoint = jointsLibrary[nomFichierJointGlobal];
                        dessinerMur(
                            imagesMap, couleursChoisies, finitionsChoisies,
                            imgGlobalJoint, jointsLibrary, 
                            appareillageChoisi, configProduit, 
                            pourcentageRoc, colorWeights,
                            lignesRocMap, lignesLisseMap, lignesJointMap,
                            largeurJointH, largeurJointV, typeJoint,
                            reliefType, reliefPercent, 
                            reliefOutColor, reliefOutFinish,
                            reliefInColor, reliefInFinish 
                        );
                        
                        if(selectScene && selectScene.value !== 'neutre') { updateSceneView(selectScene.value); }

                    } catch (e) { console.error("Erreur dessin", e); }
                })
                .catch(err => console.error("Erreur chargement", err))
                .finally(() => { hideLoading(); });
        }, 50);
    }

    function dessinerMur(imagesMap, couleurs, finitions, imgGlobalJoint, jointsLibrary, appareillage, configProduit, pourcentageRoc, colorWeights, lignesRocMap, lignesLisseMap, lignesJointMap, largeurJointH, largeurJointV, typeJoint, reliefType, reliefPercent, reliefOutColor, reliefOutFinish, reliefInColor, reliefInFinish) {
        
        // MODIFICATION: DÉTECTION MODE ESQUISSE
        const modeEsquisse = (couleurs.length === 0);
        
        let statsReal = {};

        let moduleW;
        if (appareillage === 'moucharabieh') moduleW = configProduit.dims.largeur * (4/3);
        else moduleW = configProduit.dims.largeur + largeurJointV;

        const moduleH = configProduit.dims.hauteur + largeurJointH;
        const nbCols = Math.round(LARGEUR_CIBLE_MM / moduleW);
        let nbRows = Math.round(HAUTEUR_CIBLE_MM / moduleH);
        
        if (['demi-brique', 'moucharabieh', 'flamand'].includes(appareillage)) { if (nbRows % 2 !== 0) nbRows++; }
        else if (appareillage === 'tiers') { while (nbRows % 3 !== 0) nbRows++; }

        const exactWidthMM = nbCols * moduleW;
        const exactHeightMM = nbRows * moduleH;
        
        if(dimensionsInfoSpan) dimensionsInfoSpan.textContent = `Zone : ${Math.round(exactWidthMM)} x ${Math.round(exactHeightMM)} mm`;

        const { ctx, width, height, scaleFactor: ECHELLE } = setupCanvas(exactWidthMM, exactHeightMM);

        const dimsMM = configProduit.dims;
        const tailleTextureBriqueMM = configProduit.texture_mm;
        
        const LARGEUR_JOINT_H_PX = largeurJointH * ECHELLE;
        const LARGEUR_JOINT_V_PX = largeurJointV * ECHELLE;
        const LARGEUR_BRIQUE_PX = dimsMM.largeur * ECHELLE;
        const HAUTEUR_BRIQUE_PX = dimsMM.hauteur * ECHELLE;
        const LARGEUR_BOUTISSE_PX = 105 * ECHELLE;

        const OMBRE_FONCEE = 'rgba(0, 0, 0, 0.45)'; 
        const OMBRE_CLAIRE = 'rgba(255, 255, 255, 0.3)'; 
        const OMBRE_TAILLE = Math.round(Math.max(1, LARGEUR_JOINT_H_PX * 0.2)); 
        const JOINT_CONCAVE_OMBRE = 'rgba(0, 0, 0, 0.2)'; 
        const JOINT_CONCAVE_CLAIRE = 'rgba(255, 255, 255, 0.1)';
        const JOINT_CONCAVE_LIGNE_PX = Math.round(Math.max(1, LARGEUR_JOINT_H_PX * 0.4)); 

        // BACKGROUND
        if (modeEsquisse) {
            ctx.fillStyle = "#ffffff"; // Fond blanc pour l'esquisse
        } else {
            let patternMortierGlobal = null;
            let colorDefault = "#cccccc";

            if (imgGlobalJoint) {
                patternMortierGlobal = ctx.createPattern(imgGlobalJoint, 'repeat');
                let scale = (TAILLE_REELLE_TEXTURE_JOINT_MM * ECHELLE) / imgGlobalJoint.width;
                patternMortierGlobal.setTransform(new DOMMatrix().scale(scale));
            }
            // --- CORRECTION MOUCHARABIEH 3D ---
            if (appareillage === 'moucharabieh') {
                ctx.fillStyle = "#2c2c2c"; 
            } else {
                ctx.fillStyle = patternMortierGlobal ? patternMortierGlobal : colorDefault;
            }
        }
        ctx.fillRect(0, 0, width, height);

        // LIGNES DE JOINT EN MODE ESQUISSE (OPTIONNEL : on laisse juste le fond blanc et les briques feront le reste)
        
        if (!modeEsquisse && typeJoint === 'demi-rond' && appareillage !== 'moucharabieh') {
            for (let y = 0; y < height + LARGEUR_JOINT_H_PX; y += (HAUTEUR_BRIQUE_PX + LARGEUR_JOINT_H_PX)) {
                ctx.fillStyle = JOINT_CONCAVE_OMBRE;
                ctx.fillRect(0, y + (LARGEUR_JOINT_H_PX / 2) - (JOINT_CONCAVE_LIGNE_PX / 2), width, JOINT_CONCAVE_LIGNE_PX);
                ctx.fillStyle = JOINT_CONCAVE_CLAIRE;
                ctx.fillRect(0, y, width, 1); 
            }
        }
        
        let numeroRang = 0; 
        const STEP_Y = HAUTEUR_BRIQUE_PX + LARGEUR_JOINT_H_PX;
        
        // PRÉPARATION DECK COULEURS (Seulement si pas esquisse)
        let colorDeck = [];
        let deckIndex = 0;
        
        if (!modeEsquisse) {
            const totalBriquesEstime = (nbCols * nbRows) * 1.5; 
            let totalWeight = 0;
            couleurs.forEach(c => totalWeight += (colorWeights[c] || 0));
            if (totalWeight === 0) totalWeight = 100;

            couleurs.forEach(c => {
                const weight = colorWeights[c] || 0;
                const count = Math.round((weight / totalWeight) * totalBriquesEstime);
                for(let i=0; i<count; i++) colorDeck.push(c);
            });

            for (let i = colorDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [colorDeck[i], colorDeck[j]] = [colorDeck[j], colorDeck[i]];
            }
        }

        for (let y = LARGEUR_JOINT_H_PX; y < height; y += STEP_Y) {
            
            let rowEdgeColor = null;
            let rowEdgeFinition = 'lisse';

            if (!modeEsquisse) {
                if (deckIndex < colorDeck.length) { rowEdgeColor = colorDeck[deckIndex]; deckIndex++; } else { rowEdgeColor = couleurs[Math.floor(Math.random() * couleurs.length)]; }

                if (finitions.includes('lisse') && finitions.includes('roc')) {
                     rowEdgeFinition = (Math.random() * 100 < pourcentageRoc) ? 'roc' : 'lisse';
                } else if (finitions.includes('roc')) { rowEdgeFinition = 'roc'; }
            }

            let currentPatternV = null;
            if(!modeEsquisse) {
                currentPatternV = imgGlobalJoint ? ctx.createPattern(imgGlobalJoint, 'repeat') : "#ccc"; // Simplifié ici
                const forcedJointName = lignesJointMap[numeroRang + 1];
                if (forcedJointName && jointsLibrary[forcedJointName]) {
                    const imgSpecific = jointsLibrary[forcedJointName];
                    const pSpecific = ctx.createPattern(imgSpecific, 'repeat');
                    let scale = (TAILLE_REELLE_TEXTURE_JOINT_MM * ECHELLE) / imgSpecific.width;
                    pSpecific.setTransform(new DOMMatrix().scale(scale));
                    currentPatternV = pSpecific;
                }
            }

            const infoLigneRoc = lignesRocMap[numeroRang + 1]; 
            const infoLigneLisse = lignesLisseMap[numeroRang + 1];

            // --- CALCUL DU DÉCALAGE X ---
            let decalageX = 0;
            if (appareillage === 'demi-brique' && numeroRang % 2 !== 0) decalageX = -(LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX) / 2;
            else if (appareillage === 'tiers') {
                if (numeroRang % 3 === 1) decalageX = -(LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX) / 3;
                if (numeroRang % 3 === 2) decalageX = -(LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX) * 2/3;
            }
            else if (appareillage === 'moucharabieh' && numeroRang % 2 !== 0) {
                decalageX = -(LARGEUR_BRIQUE_PX * (2/3));
            }
            else if (appareillage === 'flamand' && numeroRang % 2 !== 0) {
                decalageX = -(LARGEUR_BRIQUE_PX * 0.75); 
            }
            else if (appareillage === 'anglais' && numeroRang % 2 !== 0) {
                 decalageX = -(LARGEUR_BOUTISSE_PX / 2);
            }

            let x = decalageX - LARGEUR_BRIQUE_PX; 
            let briqueIndexInRow = 0;

            while (x < width) {
                let currentBriqueWidth = LARGEUR_BRIQUE_PX; 

                if (appareillage === 'flamand') {
                    if (briqueIndexInRow % 2 !== 0) currentBriqueWidth = LARGEUR_BOUTISSE_PX; 
                }
                else if (appareillage === 'anglais') {
                    if (numeroRang % 2 !== 0) currentBriqueWidth = LARGEUR_BOUTISSE_PX; 
                }

                if (modeEsquisse) {
                    // --- DESSIN ESQUISSE (TRAIT DE CRAYON) ---
                    ctx.strokeStyle = "#999999"; // Gris moyen pour le trait
                    ctx.lineWidth = 1;
                    // Dessin du rectangle vide
                    ctx.strokeRect(x, y, currentBriqueWidth, HAUTEUR_BRIQUE_PX);
                    
                    // Petit effet optionnel pour simuler le volume léger
                    // ctx.fillStyle = "rgba(0,0,0,0.02)";
                    // ctx.fillRect(x, y, currentBriqueWidth, HAUTEUR_BRIQUE_PX);

                } else {
                    // --- LOGIQUE COMPLETE TEXTURE ---
                    let couleurName, finitionName = 'lisse'; 
                    
                    if (infoLigneRoc !== undefined) {
                        finitionName = 'roc';
                        couleurName = (infoLigneRoc !== null) ? infoLigneRoc : couleurs[Math.floor(Math.random() * couleurs.length)];
                    } else if (infoLigneLisse !== undefined) {
                        finitionName = 'lisse';
                        couleurName = (infoLigneLisse !== null) ? infoLigneLisse : couleurs[Math.floor(Math.random() * couleurs.length)];
                    } else {
                        const isCutBlock = (x < -1) || (x + currentBriqueWidth > width + 1);
                        if (isCutBlock) {
                            couleurName = rowEdgeColor;
                            finitionName = rowEdgeFinition;
                        } else {
                            if (deckIndex < colorDeck.length) { couleurName = colorDeck[deckIndex++]; } 
                            else { couleurName = couleurs[0]; }
                            
                            if (finitions.includes('lisse') && finitions.includes('roc')) {
                                finitionName = (Math.random() * 100 < pourcentageRoc) ? 'roc' : 'lisse';
                            } else if (finitions.includes('roc')) { finitionName = 'roc'; }
                        }
                    }

                    // --- DÉCISION DU RELIEF 3D ---
                    let mode3D = 'normal'; 
                    if (reliefType !== 'none' && x > 0 && x < width - currentBriqueWidth) {
                        if (Math.random() * 100 < reliefPercent) {
                            if (reliefType === 'random-out') mode3D = 'out';
                            else if (reliefType === 'random-in') mode3D = 'in';
                            else if (reliefType === 'random-mix') mode3D = (Math.random() > 0.5) ? 'out' : 'in';
                        }
                    }

                    // --- OVERRIDE SI RELIEF ---
                    if (mode3D === 'out') {
                        if (reliefOutColor && reliefOutColor !== 'auto') couleurName = reliefOutColor;
                        if (reliefOutFinish && reliefOutFinish !== 'auto') finitionName = reliefOutFinish;
                    }
                    if (mode3D === 'in') {
                        if (reliefInColor && reliefInColor !== 'auto') couleurName = reliefInColor;
                        if (reliefInFinish && reliefInFinish !== 'auto') finitionName = reliefInFinish;
                    }
                    
                    if (finitionName === 'roc' && NO_ROC_COLORS.includes(couleurName)) {
                        finitionName = 'lisse';
                    }

                    // STATS
                    if (couleurName && finitionName) {
                        const statKey = `${couleurName}|${finitionName}`;
                        statsReal[statKey] = (statsReal[statKey] || 0) + 1;
                    }
                    
                    const key = couleurName + '_' + finitionName;
                    const imgList = imagesMap[key];
                    
                    if (imgList && imgList.length > 0) {
                        const img = imgList[Math.floor(Math.random() * imgList.length)];
                        const p = ctx.createPattern(img, 'repeat');
                        let scale = (tailleTextureBriqueMM * ECHELLE) / img.width;
                        p.setTransform(new DOMMatrix().scale(scale));
                        
                        ctx.save();
                        let drawX = x; let drawY = y;
                        
                        if (mode3D === 'out') {
                            const shift = ECHELLE * 4; drawX -= shift; drawY -= shift;
                            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x + shift, y + shift, currentBriqueWidth, HAUTEUR_BRIQUE_PX);
                        }
                        
                        ctx.translate(drawX, drawY);
                        
                        // =================================================================
                        // EFFET DE PROFONDEUR "EXTRUSION SOLIDE" MOUCHARABIEH
                        // =================================================================
                        if (appareillage === 'moucharabieh') {
                            const profondeur3D = 25 * ECHELLE; 
                            ctx.fillStyle = "#0a0a0a"; 
                            ctx.fillRect(profondeur3D, profondeur3D, currentBriqueWidth, HAUTEUR_BRIQUE_PX);
                        }

                        if (appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                            ctx.fillStyle = currentPatternV; ctx.fillRect(currentBriqueWidth, 0, LARGEUR_JOINT_V_PX, HAUTEUR_BRIQUE_PX);
                        }

                       if (appareillage === 'moucharabieh') {
                            // En mode texture, on utilise le mortier global
                            const patternMortierGlobal = imgGlobalJoint ? ctx.createPattern(imgGlobalJoint, 'repeat') : "#ccc"; 
                            // (Note: patternMortierGlobal redéclaré ici pour simplifier la portée dans cette boucle massive, 
                            // idéalement devrait être passé en arg, mais on fait simple pour préserver le code)
                             ctx.fillStyle = patternMortierGlobal; // Simplification
                        
                            const mortierH = LARGEUR_JOINT_H_PX; const tiers = currentBriqueWidth / 3; 
                            ctx.fillRect(0, HAUTEUR_BRIQUE_PX, tiers, mortierH); ctx.fillRect(2 * tiers, HAUTEUR_BRIQUE_PX, tiers, mortierH);
                            ctx.fillRect(0, -mortierH, tiers, mortierH); ctx.fillRect(2 * tiers, -mortierH, tiers, mortierH);
                            ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(0, HAUTEUR_BRIQUE_PX, tiers, 2); ctx.fillRect(2 * tiers, HAUTEUR_BRIQUE_PX, tiers, 2);
                        }
                        
                        ctx.fillStyle = OMBRE_FONCEE;
                        ctx.fillRect(0, HAUTEUR_BRIQUE_PX - OMBRE_TAILLE, currentBriqueWidth, OMBRE_TAILLE); 
                        if (LARGEUR_JOINT_V_PX > 0) ctx.fillRect(currentBriqueWidth - OMBRE_TAILLE, 0, OMBRE_TAILLE, HAUTEUR_BRIQUE_PX); 

                        const baseColor = FALLBACK_COLORS[couleurName] || '#cccccc';
                        ctx.fillStyle = baseColor;
                        if (LARGEUR_JOINT_V_PX === 0 && appareillage !== 'moucharabieh') { ctx.fillRect(0, OMBRE_TAILLE, currentBriqueWidth, HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); } 
                        else { ctx.fillRect(OMBRE_TAILLE, OMBRE_TAILLE, currentBriqueWidth - (2 * OMBRE_TAILLE), HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); }

                        ctx.fillStyle = OMBRE_CLAIRE;
                        ctx.fillRect(0, 0, currentBriqueWidth - (LARGEUR_JOINT_V_PX > 0 ? OMBRE_TAILLE : 0), OMBRE_TAILLE); 
                        if (LARGEUR_JOINT_V_PX > 0) ctx.fillRect(0, 0, OMBRE_TAILLE, HAUTEUR_BRIQUE_PX - OMBRE_TAILLE); 

                        ctx.fillStyle = p;
                        if (LARGEUR_JOINT_V_PX === 0 && appareillage !== 'moucharabieh') { ctx.fillRect(0, OMBRE_TAILLE, currentBriqueWidth, HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); } 
                        else { ctx.fillRect(OMBRE_TAILLE, OMBRE_TAILLE, currentBriqueWidth - (2 * OMBRE_TAILLE), HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); }
                        
                        if (mode3D === 'in') {
                            const innerShadowSize = ECHELLE * 6; 
                            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, currentBriqueWidth, innerShadowSize); ctx.fillRect(0, 0, innerShadowSize, HAUTEUR_BRIQUE_PX); 
                            ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(0, 0, currentBriqueWidth, HAUTEUR_BRIQUE_PX);
                        }
                        else if (mode3D === 'out') {
                            ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(0, 0, currentBriqueWidth, ECHELLE * 2); ctx.fillRect(0, 0, ECHELLE * 2, HAUTEUR_BRIQUE_PX);
                        }

                        if (typeJoint === 'demi-rond' && appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                            const ligneV_PX = Math.max(1, LARGEUR_JOINT_V_PX * 0.4);
                            ctx.fillStyle = JOINT_CONCAVE_OMBRE; ctx.fillRect(currentBriqueWidth + (LARGEUR_JOINT_V_PX / 2) - (ligneV_PX / 2), 0, ligneV_PX, HAUTEUR_BRIQUE_PX);
                        }
                        ctx.restore();
                    } else {
                        const fallbackColor = FALLBACK_COLORS[couleurName] || '#999';
                        ctx.fillStyle = fallbackColor; ctx.fillRect(x, y, currentBriqueWidth, HAUTEUR_BRIQUE_PX);
                    }
                }

                let currentStepX = currentBriqueWidth + LARGEUR_JOINT_V_PX;
                if (appareillage === 'moucharabieh') currentStepX = LARGEUR_BRIQUE_PX * (4/3); 

                x += currentStepX;
                briqueIndexInRow++;
            }
            numeroRang++; 
        }
        updateTechSummary(exactWidthMM, exactHeightMM, configProduit, statsReal);
    }

    // ==========================================
    // ESTIMATION TECHNIQUE & FINANCIÈRE AVANCÉE
    // ==========================================
    
    function updateTechSummary(widthMM, heightMM, configProduit, statsReal) {
        const summaryDiv = document.getElementById('tech-summary');
        if(!summaryDiv) return;
        
        lastStatsReal = statsReal; lastConfigProduit = configProduit; lastWidthMM = widthMM; lastHeightMM = heightMM;

        const userSurfInput = document.getElementById('user-global-surface');
        const userSurfVal = (userSurfInput && userSurfInput.value) ? parseFloat(userSurfInput.value) : 0;
        
        const produitCode = getSingleValue(document.getElementById('container-produit'));

        // 1. Calcul Surface
        let surfaceReferenceM2 = 0;
        if (userSurfVal > 0) {
            surfaceReferenceM2 = userSurfVal; 
            document.getElementById('sum-surface').textContent = userSurfVal.toFixed(2) + " m² (Projet)";
        } else {
            surfaceReferenceM2 = (widthMM * heightMM) / 1000000; 
            document.getElementById('sum-surface').textContent = surfaceReferenceM2.toFixed(2) + " m² (Visuel)";
        }

        // 2. Calcul Briques
        const moduleSurfM2 = ((configProduit.dims.largeur + 10) * (configProduit.dims.hauteur + 10)) / 1000000; 
        const totalBriquesTheorique = Math.ceil(surfaceReferenceM2 / moduleSurfM2);
        document.getElementById('sum-briques').textContent = totalBriquesTheorique;

        // 3. Calcul Mortier (Base)
        const refConso = CONSOMMATION_MORTIER_REF[produitCode] || 0;
        const currentJointH = document.getElementById('slider-joint-h') ? parseInt(document.getElementById('slider-joint-h').value) : 10;
        const currentJointV = document.getElementById('slider-joint-v') ? parseInt(document.getElementById('slider-joint-v').value) : 10;
        const facteurJoint = (currentJointH + currentJointV) / 20;

        // --- NOUVEAU CALCUL RÉPARTITION MORTIER ---
        // On estime la surface d'un rang pour savoir combien de m² sont "forcés"
        const moduleH = configProduit.dims.hauteur + currentJointH;
        // On utilise la hauteur réelle du mur (heightMM) pour l'estimation du nombre de rangs
        const totalRowsEstimes = Math.max(1, Math.round(heightMM / moduleH));
        const surfaceParRang = surfaceReferenceM2 / totalRowsEstimes;

        // On prépare les "seaux" de mortier par couleur
        let repartitionMortier = {};
        
        // Mortier par défaut (celui du select principal)
        const selectJoint = document.getElementById('select-joint');
        const globalJointVal = selectJoint.value; // ex: "joint_grisclair.png"
        const globalJointTxt = selectJoint.options[selectJoint.selectedIndex].text; // ex: "Gris Clair (Standard)"
        
        // Au départ, tout est en mortier global
        repartitionMortier[globalJointTxt] = surfaceReferenceM2;

        // On parcourt les règles pour ajuster
        // rulesData est une variable globale définie plus haut
        if (rulesData && rulesData.length > 0) {
            rulesData.forEach(rule => {
                if (rule.joint && rule.joint !== "") {
                    // Trouver le nom lisible du joint forcé
                    let specificJointName = "Autre";
                    const option = selectJoint.querySelector(`option[value="${rule.joint}"]`);
                    if(option) specificJointName = option.text;
                    else specificJointName = rule.joint.replace('joint_', '').replace('.png', '');

                    // On retire la surface d'un rang au global
                    repartitionMortier[globalJointTxt] = Math.max(0, repartitionMortier[globalJointTxt] - surfaceParRang);
                    
                    // On ajoute la surface au spécifique
                    if (!repartitionMortier[specificJointName]) repartitionMortier[specificJointName] = 0;
                    repartitionMortier[specificJointName] += surfaceParRang;
                }
            });
        }

        // --- AFFICHAGE HTML ---
        const mortierDetailsDiv = document.getElementById('mortier-details-list');
        const isPlaquette = ['p6', 'p9'].includes(produitCode);
        const mortarTypeName = isPlaquette ? "Biajoint" : "Biamortier";
        
        if (mortierDetailsDiv) {
            let htmlContent = `<ul style="padding-left: 20px; margin: 0; font-size:0.9rem;">`;
            
            for (const [jointName, surface] of Object.entries(repartitionMortier)) {
                if (surface > 0.01) { // On n'affiche que s'il y a de la surface
                    const consoTheo = refConso * facteurJoint;
                    const poidsTotal = surface * consoTheo;
                    const nbSacs = Math.ceil(poidsTotal / 25);
                    
                    htmlContent += `
                        <li style="margin-bottom:8px; border-bottom:1px dashed #ccc; padding-bottom:5px;">
                            <strong>${mortarTypeName} - ${jointName}</strong><br>
                            Surface : ${surface.toFixed(2)} m² <span style="color:#666; font-size:0.8em;">(Conso ~${consoTheo.toFixed(1)} kg/m²)</span><br>
                            <span style="color: #28a745; font-weight: bold;">➔ ${nbSacs} sacs de 25kg</span> (${poidsTotal.toFixed(1)} kg)
                        </li>
                    `;
                }
            }
            htmlContent += `</ul>`;
            mortierDetailsDiv.innerHTML = htmlContent;
        }

        // 4. Calcul Distribution (SANS COÛT)
        const tbody = document.getElementById('distribution-body'); 
        tbody.innerHTML = '';
        let totalCountedInView = 0; 
        Object.values(statsReal).forEach(c => totalCountedInView += c);
        
        const sortedEntries = Object.entries(statsReal).sort((a,b) => b[1] - a[1]);
        
        if (sortedEntries.length > 0) {
            for (const [key, count] of sortedEntries) {
                if (count > 0) {
                    const ratio = totalCountedInView > 0 ? (count / totalCountedInView) : 0;
                    const qte = Math.round(totalBriquesTheorique * ratio);
                    const surfSpecifique = (surfaceReferenceM2 * ratio);
                    const percent = (ratio * 100).toFixed(1);
                    
                    const parts = key.split('|');
                    const colorCode = parts[0];
                    const finishCode = parts[1]; // 'roc' ou 'lisse'
                    
                    const colorName = colorCode.charAt(0).toUpperCase() + colorCode.slice(1);
                    const finishName = (finishCode === 'roc') ? 'Roc' : 'Lisse';
                    const displayName = `<span style="font-weight:bold;">${colorName}</span> <small>(${finishName})</small>`;
                    const bgCol = FALLBACK_COLORS[colorCode] || '#cccccc'; 

                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td><span style="display:inline-block;width:10px;height:10px;background-color:${bgCol};margin-right:5px;border-radius:50%;"></span>${displayName}</td><td>${percent}%</td><td style="font-weight:bold; color:#0d6efd;">${surfSpecifique.toFixed(2)}</td><td style="font-weight:bold;">${qte}</td>`;
                    tbody.appendChild(tr);
                }
            }
        } else {
            // Message si esquisse
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align:center; font-style:italic; color:#999;">Sélectionnez une couleur pour voir la répartition.</td>`;
            tbody.appendChild(tr);
        }
    }

    const resizer = document.getElementById('dragMe'); const leftSide = document.querySelector('.config-panel'); let x = 0; let leftWidth = 0;
    const mouseDownHandler = function(e) { x = e.clientX; leftWidth = leftSide.getBoundingClientRect().width; document.addEventListener('mousemove', mouseMoveHandler); document.addEventListener('mouseup', mouseUpHandler); document.body.style.cursor = 'col-resize'; if(resizer) resizer.style.borderLeft = '2px solid #007bff'; };
    const mouseMoveHandler = function(e) { const dx = e.clientX - x; const newWidth = leftWidth + dx; if (newWidth > 300 && newWidth < window.innerWidth * 0.6) { leftSide.style.width = `${newWidth}px`; leftSide.style.flex = `0 0 ${newWidth}px`; } };
    const mouseUpHandler = function() { document.removeEventListener('mousemove', mouseMoveHandler); document.removeEventListener('mouseup', mouseUpHandler); document.body.style.cursor = 'default'; if(resizer) resizer.style.borderLeft = 'none'; triggerAutoUpdate(); };
    if (resizer) resizer.addEventListener('mousedown', mouseDownHandler);

    function dismissWelcomeScreen() {
        if (initialOverlay && !initialOverlay.classList.contains('hidden')) {
            initialOverlay.classList.add('hidden'); const video = initialOverlay.querySelector('video'); if (video) video.pause();
        }
    }
    const configPanel = document.querySelector('.config-panel');
    if (configPanel) { configPanel.addEventListener('mousedown', dismissWelcomeScreen, { once: true }); configPanel.addEventListener('touchstart', dismissWelcomeScreen, { once: true }); configPanel.addEventListener('change', dismissWelcomeScreen, { once: true }); }
    if (resizer) resizer.addEventListener('mousedown', dismissWelcomeScreen, { once: true });

    // =========================================================
    // 10. GESTION RESPONSIVE
    // =========================================================
    function gererPlacementEstimation() {
        const isMobile = window.innerWidth <= 900;
        const techSummary = document.getElementById('tech-summary');
        const configPanel = document.querySelector('.config-panel');
        const previewPanel = document.querySelector('.preview-panel');
        const exportSection = document.querySelector('.export-section');

        if (!techSummary || !configPanel || !previewPanel || !exportSection) return;

        if (isMobile) {
            if (techSummary.parentElement !== configPanel) {
                configPanel.insertBefore(techSummary, exportSection);
            }
        } else {
            if (techSummary.parentElement !== previewPanel) {
                previewPanel.appendChild(techSummary);
            }
        }
    }
    gererPlacementEstimation();
    window.addEventListener('resize', gererPlacementEstimation);

});