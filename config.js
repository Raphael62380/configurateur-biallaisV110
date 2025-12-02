document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. VERSION
    // ==========================================
    const APP_VERSION = "v1.1.0 Auto-Update"; 
    
    const versionDiv = document.getElementById('app-version');
    if(versionDiv) {
        versionDiv.textContent = `Biallais Config - ${APP_VERSION}`;
    }

    // ==========================================
    // 1. UI ELEMENTS & VARIABLES
    // ==========================================
    let autoUpdateTimer = null; // Variable pour le timer anti-lag

    const bouton = document.getElementById('genererBouton');
    const canvas = document.getElementById('apercuCanvas');
    const loadingOverlay = document.getElementById('loading-overlay');
    const initialOverlay = document.getElementById('initial-overlay');
    
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
    const sliderColorDist = document.getElementById('slider-color-dist');
    const valColorDist = document.getElementById('val-color-dist'); // Si présent

    const btnAddRule = document.getElementById('btn-add-rule');
    const inputRow = document.getElementById('new-line-number');
    const inputFinish = document.getElementById('new-line-finish');
    const inputColor = document.getElementById('new-line-color');
    const inputJoint = document.getElementById('new-line-joint'); 
    const rulesContainer = document.getElementById('active-rules-container');
    let rulesData = []; 

    const btnExportJpg = document.getElementById('btnExportJpg');
    const btnExportPng = document.getElementById('btnExportPng');
    const btnExportPdf = document.getElementById('btnExportPdf');
    const msgAstuceRoc = document.getElementById('msg-astuce-roc');
    
    // Scènes
    const selectScene = document.getElementById('select-scene');
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomControls = document.getElementById('zoom-controls');
    const canvasWrapper = document.querySelector('.canvas-container-wrapper');
    const patternLayer = document.getElementById('wall-pattern-layer');

    const SCENES_CONFIG = {
        'neutre': { img: null, mode: 'canvas' },
        'facade': {
            img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1000&q=80', 
            mode: 'pattern',
            scalePattern: 0.25, 
            css: 'translate(-40px, 80px) rotateY(0deg)' 
        },
        'jardin': {
            img: 'https://images.unsplash.com/photo-1558293842-c0fd3db8415e?auto=format&fit=crop&w=1000&q=80',
            mode: 'pattern',
            scalePattern: 0.2,
            css: 'translate(-100px, 80px) rotateY(45deg) rotateX(0deg)'
        }
    };

    // ==========================================
    // 2. AUTO-UPDATE LOGIC (NOUVEAU)
    // ==========================================

    // Fonction qui lance le compte à rebours
    function triggerAutoUpdate() {
        if (autoUpdateTimer) clearTimeout(autoUpdateTimer);
        
        // Petit feedback visuel sur le bouton
        if(bouton) {
            bouton.textContent = "Actualisation...";
            bouton.style.opacity = "0.7";
        }

        // On lance la génération après 500ms d'inactivité
        autoUpdateTimer = setTimeout(() => {
            lancerGenerationMoteur();
        }, 500);
    }

    // Mise à jour immédiate des textes (mm, %) avant le rendu
    function updateUIValues() {
        if(sliderRoc && sliderRocValeur) sliderRocValeur.textContent = sliderRoc.value + '%';
        if(sliderJointH && sliderJointHVal) sliderJointHVal.textContent = sliderJointH.value + ' mm';
        if(sliderJointV && sliderJointVVal) sliderJointVVal.textContent = sliderJointV.value + ' mm';
    }

    // On attache les écouteurs sur les inputs
    const inputsToWatch = [
        selectAppareillage, selectJoint, selectTypeJoint, 
        sliderJointH, sliderJointV, sliderRoc, selectScene
    ];
    
    inputsToWatch.forEach(el => {
        if(el) {
            el.addEventListener('input', () => {
                updateUIValues();
                triggerAutoUpdate();
            });
            // Pour les <select>, 'change' est parfois mieux géré que input
            el.addEventListener('change', () => {
                updateUIValues();
                triggerAutoUpdate();
            });
        }
    });

    // Zoom (Pas besoin de re-générer, juste CSS)
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            canvas.style.transform = `scale(${e.target.value})`;
        });
    }

    // Scènes
    if (selectScene && patternLayer) {
        selectScene.addEventListener('change', (e) => {
            updateSceneView(e.target.value);
            // Pas de triggerAutoUpdate ici car updateSceneView gère l'affichage, 
            // mais si on veut régénérer la texture pour une nouvelle perspective, on peut décommenter :
            // triggerAutoUpdate(); 
        });
    }

    function updateSceneView(sceneKey) {
        const config = SCENES_CONFIG[sceneKey];
        if (!config) return;

        if (config.img) canvasWrapper.style.backgroundImage = `url('${config.img}')`;
        else canvasWrapper.style.backgroundImage = 'none';

        if (config.mode === 'canvas') {
            canvas.style.display = 'block';
            patternLayer.style.display = 'none';
            if(zoomControls) zoomControls.style.display = 'flex';
            if(zoomSlider) zoomSlider.value = 1;
            canvas.style.transform = 'scale(1)';
            canvas.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        } else {
            canvas.style.display = 'none';
            patternLayer.style.display = 'block';
            if(zoomControls) zoomControls.style.display = 'none';

            const textureUrl = canvas.toDataURL();
            patternLayer.style.backgroundImage = `url(${textureUrl})`;
            
            // --- CORRECTION HD / RETINA ---
            // 1. On récupère le ratio de l'écran (ex: 3 sur iPhone, 1 sur PC vieux)
            const dpr = window.devicePixelRatio || 1;
            
            // 2. On détecte si c'est un mobile (petit écran)
            const isMobile = window.innerWidth <= 900;

            // 3. Calcul savant :
            // - On prend la largeur réelle du canvas
            // - On divise par le DPR pour remettre à l'échelle humaine (taille logique)
            // - On applique le scale de la config (0.25)
            // - Si mobile, on réduit ENCORE un peu (x0.6) pour voir plus de surface
            
            const baseScale = config.scalePattern || 0.3;
            const mobileFactor = isMobile ? 0.6 : 1; // Ajustez 0.6 si vous voulez plus petit/grand
            
            // La formule magique qui règle le zoom :
            const finalSize = (canvas.width / dpr) * baseScale * mobileFactor;
            
            patternLayer.style.backgroundSize = `${finalSize}px auto`;
            patternLayer.style.transform = `translate(-50%, -50%) ${config.css}`;
        }
    }


    // ==========================================
    // 3. DATA CONSTANTS
    // ==========================================
    const LARGEUR_CIBLE_MM = 2000; 
    const HAUTEUR_CIBLE_MM = 1600; 
    const NO_ROC_PRODUCTS = ['p4', 'p6', 'p9'];
    const PRODUCTS_MIN_JOINT_8MM = ['p1', 'p2', 'p4', 'p7'];
    
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

    const INFOS_EPAISSEUR = {
        'p1': 'Disponible en Lisse et/ou Roc', 'p2': 'Disponible en Lisse et/ou Roc', 
        'p3': 'Disponible en Lisse et/ou Roc', 'p4': 'Disponible en Lisse uniquement',
        'p5': 'Disponible en Lisse et/ou Roc', 'p6': 'Disponible en Lisse uniquement', 
        'p7': 'Disponible en Lisse et/ou Roc', 'p8': 'Disponible en Lisse et/ou Roc', 
        'p9': 'Disponible en Lisse uniquement'
    };
    
    const TAILLE_REELLE_TEXTURE_JOINT_MM = 600;
    const NOMBRE_VARIATIONS = 3; 

    const FALLBACK_COLORS = {
        'blanc': '#ecf0f1', 'tonpierre': '#e6d8ad', 'jaune': '#f1c40f', 'saumon': '#ffab91', 'rouge': '#c0392b',
        'chocolat': '#5d4037', 'brun': '#795548', 'grisclair': '#bdc3c7', 'grisfonce': '#7f8c8d', 'anthracite': '#2c3e50',
        'superblanc': '#ffffff', 'bleu': '#3498db', 'vert': '#2ecc71'
    };

    // ==========================================
    // 4. UI LOGIC (SELECTIONS)
    // ==========================================

    function checkRocAvailability(productId) {
        const rocOption = containerFinition.querySelector('.custom-option[data-value="roc"]');
        const lisseOption = containerFinition.querySelector('.custom-option[data-value="lisse"]');

        if (NO_ROC_PRODUCTS.includes(productId)) {
            rocOption.classList.add('disabled');
            rocOption.classList.remove('selected');
            lisseOption.classList.add('selected');
        } else {
            rocOption.classList.remove('disabled');
        }
        checkRocVisibility();
    }

    function checkVerticalJointLimit(productId) {
        if (!sliderJointV) return;
        if (PRODUCTS_MIN_JOINT_8MM.includes(productId)) {
            sliderJointV.min = 8;
            if (parseInt(sliderJointV.value) < 8) {
                sliderJointV.value = 8;
                sliderJointVVal.textContent = '8 mm';
            }
        } else {
            sliderJointV.min = 1;
        }
    }

    if (btnAddRule) {
        btnAddRule.addEventListener('click', (e) => {
            e.preventDefault();
            const row = parseInt(inputRow.value);
            if (!row || row < 1) { alert("Ligne invalide"); return; }
            const finish = inputFinish.value; 
            const color = inputColor.value;   
            const joint = inputJoint ? inputJoint.value : ""; 
            rulesData = rulesData.filter(r => r.row !== row);
            rulesData.push({ row, finish, color, joint });
            rulesData.sort((a, b) => a.row - b.row);
            renderRules();
            inputRow.value = ''; inputRow.focus();
            triggerAutoUpdate(); // Mise à jour auto après ajout de règle
        });
    }

    function renderRules() {
        if (!rulesContainer) return;
        rulesContainer.innerHTML = '';
        if (rulesData.length === 0) {
            rulesContainer.innerHTML = '<small style="color:#999; font-style:italic;">Aucune.</small>';
            return;
        }
        const colorLabels = {
            'blanc': 'Blanc', 'tonpierre': 'Ton Pierre', 'jaune': 'Jaune',
            'saumon': 'Saumon', 'rouge': 'Rouge', 'chocolat': 'Chocolat',
            'brun': 'Brun', 'grisclair': 'Gris Clair', 'grisfonce': 'Gris Foncé',
            'anthracite': 'Anthracite', 'superblanc': 'Super Blanc',
            'bleu': 'Bleu', 'vert': 'Vert'
        };
        rulesData.forEach((rule, index) => {
            const tag = document.createElement('div');
            tag.className = 'rule-tag';
            const finishLabel = rule.finish.charAt(0).toUpperCase() + rule.finish.slice(1);
            let text = `L${rule.row} : ${finishLabel}`;
            if (rule.color) {
                const cLabel = colorLabels[rule.color] || rule.color;
                text += ` (${cLabel})`;
            }
            tag.innerHTML = `<span>${text}</span> <span class="remove-tag" data-index="${index}" title="Supprimer" style="cursor:pointer;color:red;font-weight:bold;">&times;</span>`;
            rulesContainer.appendChild(tag);
        });
        rulesContainer.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                rulesData.splice(parseInt(e.target.dataset.index), 1);
                renderRules();
                triggerAutoUpdate(); // Mise à jour auto après suppression
            });
        });
    }

    function updateEpaisseurText(valeurProduit) {
        if (infoEpaisseurDiv && INFOS_EPAISSEUR[valeurProduit]) {
            const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.28H3.73L12 5.45zM11 10v6h2v-6h-2zm0 8v2h2v-2h-2z"/></svg>`;
            infoEpaisseurDiv.innerHTML = iconHtml + "<span>" + INFOS_EPAISSEUR[valeurProduit] + "</span>";
            infoEpaisseurDiv.style.display = 'flex';
        } else if (infoEpaisseurDiv) {
            infoEpaisseurDiv.innerHTML = "";
            infoEpaisseurDiv.style.display = 'none';
        }
    }

    function setupSingleChoice(containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        // Init au chargement
        if (containerId === 'container-produit') {
            const selected = container.querySelector('.custom-option.selected');
            if (selected) {
                const val = selected.dataset.value;
                updateEpaisseurText(val);
                checkRocAvailability(val);
                checkVerticalJointLimit(val);
            }
        }

        container.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (!option) return;
            container.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            if (containerId === 'container-produit') {
                const val = option.dataset.value;
                updateEpaisseurText(val);
                checkRocAvailability(val);
                checkVerticalJointLimit(val);
            }
            triggerAutoUpdate(); // Auto-update sur sélection
        });
    }

    function setupMultiChoice(containerElement) {
        if(!containerElement) return;
        containerElement.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (!option) return;
            if(option.classList.contains('disabled')) return;

            option.classList.toggle('selected');
            const selected = containerElement.querySelectorAll('.custom-option.selected');
            if (selected.length === 0) option.classList.add('selected');
            checkRocVisibility();
            checkColorDistribution();
            triggerAutoUpdate(); // Auto-update sur sélection
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
             if (rocDistributionWrapper) rocDistributionWrapper.style.display = (isRoc && isLisse) ? 'block' : 'none';
        }
        
        if (msgAstuceRoc) {
            msgAstuceRoc.style.display = (isLisse && !isRoc) ? 'flex' : 'none';
        }
        if (containerRocOptions) containerRocOptions.style.display = 'block';
    }
    
    function checkColorDistribution() {
        if (!containerColorDist) return;
        const selectedColors = containerCouleur.querySelectorAll('.custom-option.selected');
        const containerSliders = document.getElementById('dynamic-sliders-container');
        
        if (selectedColors.length >= 2) {
            containerColorDist.style.display = 'block';
            
            const existingValues = {};
            let hasExisting = false;
            containerSliders.querySelectorAll('input').forEach(input => {
                existingValues[input.dataset.color] = parseInt(input.value);
                hasExisting = true;
            });

            containerSliders.innerHTML = ''; 

            const totalDisplayDiv = document.createElement('div');
            totalDisplayDiv.style.marginBottom = '15px';
            totalDisplayDiv.style.fontWeight = 'bold';
            totalDisplayDiv.style.textAlign = 'center';
            totalDisplayDiv.style.color = '#333';
            totalDisplayDiv.innerHTML = 'Total : <span id="total-pourcentage">100</span>% / 100%';
            containerSliders.appendChild(totalDisplayDiv);

            const count = selectedColors.length;
            const defaultShare = Math.floor(100 / count);
            let remainder = 100 - (defaultShare * count);
            
            const initialValuesMap = {};
            selectedColors.forEach((opt, index) => {
                const colorCode = opt.dataset.value;
                if (hasExisting && existingValues[colorCode] !== undefined) {
                     initialValuesMap[colorCode] = existingValues[colorCode];
                } else {
                     initialValuesMap[colorCode] = defaultShare + (index < remainder ? 1 : 0);
                }
            });

            let currentTotalInit = 0;
            Object.values(initialValuesMap).forEach(v => currentTotalInit += v);
            if (currentTotalInit > 100) {
                 selectedColors.forEach((opt, index) => {
                    initialValuesMap[opt.dataset.value] = defaultShare + (index < remainder ? 1 : 0);
                 });
            }

            selectedColors.forEach(opt => {
                const colorCode = opt.dataset.value;
                const colorName = opt.querySelector('span').textContent;
                
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.marginBottom = '5px';
                row.style.gap = '10px';

                const label = document.createElement('span');
                label.textContent = colorName;
                label.style.fontSize = '0.85rem';
                label.style.width = '80px';
                label.style.fontWeight = 'bold';

                const input = document.createElement('input');
                input.type = 'range';
                input.min = '0';
                input.max = '100'; 
                input.step = '1'; 
                input.value = initialValuesMap[colorCode];
                input.style.flex = '1';
                input.dataset.color = colorCode; 
                
                const valSpan = document.createElement('span');
                valSpan.textContent = input.value + '%';
                valSpan.style.width = '35px';
                valSpan.style.fontSize = '0.8rem';
                valSpan.style.textAlign = 'right';

                // Input sur slider de couleur déclenche aussi l'auto-update
                input.addEventListener('input', () => {
                    let currentVal = parseInt(input.value);
                    const allInputs = Array.from(containerSliders.querySelectorAll('input[type="range"]'));
                    let sumOthers = 0;
                    allInputs.forEach(inp => { if (inp !== input) sumOthers += parseInt(inp.value); });
                    const maxAvailable = 100 - sumOthers;
                    if (currentVal > maxAvailable) {
                        currentVal = maxAvailable;
                        input.value = currentVal;
                    }
                    valSpan.textContent = currentVal + '%';
                    const newTotal = sumOthers + currentVal;
                    const totalSpan = document.getElementById('total-pourcentage');
                    if(totalSpan) {
                        totalSpan.textContent = newTotal;
                        totalSpan.style.color = (newTotal === 100) ? 'green' : 'orange';
                    }
                    triggerAutoUpdate(); // <--- ICI
                });

                row.appendChild(label);
                row.appendChild(input);
                row.appendChild(valSpan);
                containerSliders.appendChild(row);
            });
            
            const totalSpan = document.getElementById('total-pourcentage');
            if(totalSpan) {
                let initSum = 0;
                Object.values(initialValuesMap).forEach(v => initSum += v);
                totalSpan.textContent = initSum;
                totalSpan.style.color = (initSum === 100) ? 'green' : 'orange';
            }
        } else {
            containerColorDist.style.display = 'none';
        }
    }

    // ==========================================
    // 5. HELPERS
    // ==========================================
    
    function showLoading() {
        if(loadingOverlay) loadingOverlay.classList.remove('hidden');
        if(bouton) { bouton.disabled = true; bouton.textContent = "Chargement..."; }
    }
    function hideLoading() {
        if(loadingOverlay) loadingOverlay.classList.add('hidden');
        if(bouton) { 
            bouton.disabled = false; 
            bouton.textContent = "Mélanger / Régénérer"; // Changement de texte
            bouton.style.opacity = "1";
        }
        if(initialOverlay) initialOverlay.classList.add('hidden');
    }
    function getSingleValue(container) {
        const selected = container.querySelector('.custom-option.selected');
        return selected ? selected.dataset.value : 'p1';
    }
    function getMultiValues(container) {
        const values = [];
        const selected = container.querySelectorAll('.custom-option.selected');
        selected.forEach(opt => values.push(opt.dataset.value));
        if (values.length === 0) {
            const first = container.querySelector('.custom-option');
            if(first) { first.classList.add('selected'); values.push(first.dataset.value); }
        }
        return values;
    }
    function chargerImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ src: src, img: img, status: 'ok' });
            img.onerror = () => resolve({ src: src, img: null, status: 'error' }); 
            img.src = src;
        });
    }
    
    function setupCanvas(widthMM, heightMM) {
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        const dpr = window.devicePixelRatio || 1;
        const scaleRatio = 0.6;
        const widthPx = Math.round(widthMM * scaleRatio);
        const heightPx = Math.round(heightMM * scaleRatio);
        canvas.width = widthPx * dpr;
        canvas.height = heightPx * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, width: widthPx, height: heightPx, scaleFactor: scaleRatio };
    }

    // ==========================================
    // 6. MOTEUR GÉNÉRATION (FONCTION EXTRAITE)
    // ==========================================

    // Le clic sur le bouton force la régénération (mode manuel / mélanger)
    bouton.addEventListener('click', () => {
        lancerGenerationMoteur();
    });

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
            
            const lignesRocMap = {};
            const lignesLisseMap = {};
            const lignesJointMap = {}; 
            
            // --- Calcul des proportions (Poids) ---
            const colorWeights = {};
            let totalWeight = 0;
            
            const sliders = document.querySelectorAll('#dynamic-sliders-container input');
            if (sliders.length > 0) {
                sliders.forEach(input => {
                    const weight = parseInt(input.value);
                    colorWeights[input.dataset.color] = weight;
                    totalWeight += weight;
                });
            } else {
                couleursChoisies.forEach(c => { colorWeights[c] = 100; totalWeight+=100; });
            }
            
            if (totalWeight === 0) {
                couleursChoisies.forEach(c => { colorWeights[c] = 100; totalWeight+=100; });
            }

            rulesData.forEach(r => {
                const colorToUse = (r.color && r.color !== "") ? r.color : null;
                if (r.finish === 'roc') lignesRocMap[r.row] = colorToUse;
                else lignesLisseMap[r.row] = colorToUse;
                if (r.joint) lignesJointMap[r.row] = r.joint;
            });

            let configProduit = PRODUITS_CONFIG[produitChoisi];
            if (!configProduit) configProduit = PRODUITS_CONFIG['p1'];

            const listeACharger = [nomFichierJointGlobal];
            Object.values(lignesJointMap).forEach(j => { if (j && !listeACharger.includes(j)) listeACharger.push(j); });

            couleursChoisies.forEach(couleur => {
                finitionsChoisies.forEach(finition => {
                    for (let i = 1; i <= NOMBRE_VARIATIONS; i++) {
                        listeACharger.push(`${couleur}_${finition}_${i}.png`);
                    }
                });
            });
            Object.values(lignesRocMap).forEach(c => { if(c) for(let i=1; i<=NOMBRE_VARIATIONS; i++) listeACharger.push(`${c}_roc_${i}.png`); });
            Object.values(lignesLisseMap).forEach(c => { if(c) for(let i=1; i<=NOMBRE_VARIATIONS; i++) listeACharger.push(`${c}_lisse_${i}.png`); });

            Promise.all(listeACharger.map(src => chargerImage(src)))
                .then(resultats => {
                    const jointsLibrary = {}; 
                    const imagesMap = {};
                    
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
                            largeurJointH, largeurJointV, typeJoint 
                        );
                        
                        // Si une scène est active, on met à jour la texture du mur 3D
                        if(selectScene && selectScene.value !== 'neutre') {
                             updateSceneView(selectScene.value);
                        }

                    } catch (e) {
                        console.error("Erreur dessin", e);
                    }
                })
                .catch(err => console.error("Erreur chargement", err))
                .finally(() => {
                    hideLoading();
                });
        }, 50);
    }

    // ==========================================
    // 7. DESSIN PRINCIPAL (STRICTEMENT IDENTIQUE A L'ORIGINE)
    // ==========================================
    
    function dessinerMur(imagesMap, couleurs, finitions, imgGlobalJoint, jointsLibrary, appareillage, configProduit, pourcentageRoc, colorWeights, lignesRocMap, lignesLisseMap, lignesJointMap, largeurJointH, largeurJointV, typeJoint) {
        
        let statsReal = {};

        let moduleW;
        if (appareillage === 'moucharabieh') moduleW = configProduit.dims.largeur * (4/3);
        else moduleW = configProduit.dims.largeur + largeurJointV;

        const moduleH = configProduit.dims.hauteur + largeurJointH;
        const nbCols = Math.round(LARGEUR_CIBLE_MM / moduleW);
        let nbRows = Math.round(HAUTEUR_CIBLE_MM / moduleH);
        
        if (appareillage === 'demi-brique' || appareillage === 'moucharabieh') { if (nbRows % 2 !== 0) nbRows++; }
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

        let patternMortierGlobal = null;
        let colorDefault = "#cccccc";

        if (imgGlobalJoint) {
            patternMortierGlobal = ctx.createPattern(imgGlobalJoint, 'repeat');
            let scale = (TAILLE_REELLE_TEXTURE_JOINT_MM * ECHELLE) / imgGlobalJoint.width;
            patternMortierGlobal.setTransform(new DOMMatrix().scale(scale));
        }

        ctx.fillStyle = (appareillage === 'moucharabieh') ? "#FFFFFF" : (patternMortierGlobal || colorDefault);
        ctx.fillRect(0, 0, width, height);

        const OMBRE_FONCEE = 'rgba(0, 0, 0, 0.45)'; 
        const OMBRE_CLAIRE = 'rgba(255, 255, 255, 0.3)'; 
        const OMBRE_TAILLE = Math.max(1, LARGEUR_JOINT_H_PX * 0.2); 
        const JOINT_CONCAVE_OMBRE = 'rgba(0, 0, 0, 0.2)'; 
        const JOINT_CONCAVE_CLAIRE = 'rgba(255, 255, 255, 0.1)';
        const JOINT_CONCAVE_LIGNE_PX = Math.max(1, LARGEUR_JOINT_H_PX * 0.4); 
        
        if (typeJoint === 'demi-rond' && appareillage !== 'moucharabieh') {
            for (let y = 0; y < height + LARGEUR_JOINT_H_PX; y += (HAUTEUR_BRIQUE_PX + LARGEUR_JOINT_H_PX)) {
                ctx.fillStyle = JOINT_CONCAVE_OMBRE;
                ctx.fillRect(0, y + (LARGEUR_JOINT_H_PX / 2) - (JOINT_CONCAVE_LIGNE_PX / 2), width, JOINT_CONCAVE_LIGNE_PX);
                ctx.fillStyle = JOINT_CONCAVE_CLAIRE;
                ctx.fillRect(0, y, width, 1); 
            }
        }
        
        let numeroRang = 0; 
        const STEP_Y = HAUTEUR_BRIQUE_PX + LARGEUR_JOINT_H_PX;
        const MOUCHARABIEH_STEP = LARGEUR_BRIQUE_PX * (4/3);
        const MOUCHARABIEH_OFFSET = LARGEUR_BRIQUE_PX * (2/3);

        const totalBriquesEstime = (nbCols * nbRows) * 1.2;
        let colorDeck = [];

        let totalWeight = 0;
        couleurs.forEach(c => totalWeight += (colorWeights[c] || 0));
        if (totalWeight === 0) totalWeight = 100;

        couleurs.forEach(c => {
            const weight = colorWeights[c] || 0;
            const count = Math.round((weight / totalWeight) * totalBriquesEstime);
            for(let i=0; i<count; i++) {
                colorDeck.push(c);
            }
        });

        for (let i = colorDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colorDeck[i], colorDeck[j]] = [colorDeck[j], colorDeck[i]];
        }

        let deckIndex = 0;

        for (let y = LARGEUR_JOINT_H_PX; y < height; y += STEP_Y) {
            
            let rowEdgeColor = null;
            if (deckIndex < colorDeck.length) {
                rowEdgeColor = colorDeck[deckIndex];
                deckIndex++; 
            } else {
                rowEdgeColor = couleurs[Math.floor(Math.random() * couleurs.length)];
            }

            let rowEdgeFinition = 'lisse';
            if (finitions.includes('lisse') && finitions.includes('roc')) {
                 rowEdgeFinition = (Math.random() * 100 < pourcentageRoc) ? 'roc' : 'lisse';
            } else if (finitions.includes('roc')) {
                 rowEdgeFinition = 'roc';
            }

            let currentPatternV = patternMortierGlobal ? patternMortierGlobal : colorDefault;
            const forcedJointName = lignesJointMap[numeroRang + 1];
            if (forcedJointName && jointsLibrary[forcedJointName]) {
                const imgSpecific = jointsLibrary[forcedJointName];
                const pSpecific = ctx.createPattern(imgSpecific, 'repeat');
                let scale = (TAILLE_REELLE_TEXTURE_JOINT_MM * ECHELLE) / imgSpecific.width;
                pSpecific.setTransform(new DOMMatrix().scale(scale));
                currentPatternV = pSpecific;
            }

            const infoLigneRoc = lignesRocMap[numeroRang + 1]; 
            const infoLigneLisse = lignesLisseMap[numeroRang + 1];

            let currentStepX = LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX; 
            let decalageX = 0;

            if (appareillage === 'moucharabieh') {
                currentStepX = MOUCHARABIEH_STEP;
                if (numeroRang % 2 !== 0) decalageX = -(MOUCHARABIEH_OFFSET);
            } 
            else if (appareillage === 'demi-brique' && numeroRang % 2 !== 0) decalageX = -(LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX) / 2;
            else if (appareillage === 'tiers') {
                if (numeroRang % 3 === 1) decalageX = -(LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX) / 3;
                if (numeroRang % 3 === 2) decalageX = -(LARGEUR_BRIQUE_PX + LARGEUR_JOINT_V_PX) * 2/3;
            }

            for (let x = decalageX - LARGEUR_BRIQUE_PX; x < width; x += currentStepX) {
                
                let couleurName;
                let finitionName = 'lisse'; 
                
                if (infoLigneRoc !== undefined) {
                    finitionName = 'roc';
                    couleurName = (infoLigneRoc !== null) ? infoLigneRoc : couleurs[Math.floor(Math.random() * couleurs.length)];
                } else if (infoLigneLisse !== undefined) {
                    finitionName = 'lisse';
                    couleurName = (infoLigneLisse !== null) ? infoLigneLisse : couleurs[Math.floor(Math.random() * couleurs.length)];
                } else {
                    const isCutBlock = (x < -1) || (x + LARGEUR_BRIQUE_PX > width + 1);

                    if (isCutBlock) {
                        couleurName = rowEdgeColor;
                        finitionName = rowEdgeFinition;
                    } else {
                        if (deckIndex < colorDeck.length) {
                            couleurName = colorDeck[deckIndex];
                            deckIndex++;
                        } else {
                            couleurName = couleurs[0];
                        }
                        
                        if (finitions.includes('lisse') && finitions.includes('roc')) {
                            finitionName = (Math.random() * 100 < pourcentageRoc) ? 'roc' : 'lisse';
                        } else if (finitions.includes('roc')) {
                            finitionName = 'roc';
                        } else {
                            finitionName = 'lisse';
                        }
                    }
                }

                if (couleurName && finitionName) {
                    const statKey = `${couleurName}|${finitionName}`;
                    statsReal[statKey] = (statsReal[statKey] || 0) + 1;
                }
                
                const key = couleurName + '_' + finitionName;
                const imgList = imagesMap[key];
                let drawWidth = LARGEUR_BRIQUE_PX; 
                
                if (imgList && imgList.length > 0) {
                    const img = imgList[Math.floor(Math.random() * imgList.length)];
                    const p = ctx.createPattern(img, 'repeat');
                    let scale = (tailleTextureBriqueMM * ECHELLE) / img.width;
                    p.setTransform(new DOMMatrix().scale(scale));
                    
                    ctx.save();
                    ctx.translate(x, y); 

                    if (appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                        ctx.fillStyle = currentPatternV; 
                        ctx.fillRect(drawWidth, 0, LARGEUR_JOINT_V_PX, HAUTEUR_BRIQUE_PX);
                    }

                   if (appareillage === 'moucharabieh') {
                        ctx.fillStyle = patternMortierGlobal ? patternMortierGlobal : colorDefault;
                        const mortierH = LARGEUR_JOINT_H_PX;
                        const tiers = drawWidth / 3; 
                        
                        ctx.fillRect(0, HAUTEUR_BRIQUE_PX, tiers, mortierH);
                        ctx.fillRect(2 * tiers, HAUTEUR_BRIQUE_PX, tiers, mortierH);

                        ctx.fillRect(0, -mortierH, tiers, mortierH);
                        ctx.fillRect(2 * tiers, -mortierH, tiers, mortierH);

                        ctx.fillStyle = "rgba(0,0,0,0.15)";
                        ctx.fillRect(0, HAUTEUR_BRIQUE_PX, tiers, 2);
                        ctx.fillRect(2 * tiers, HAUTEUR_BRIQUE_PX, tiers, 2);
                    }
                    
                    ctx.fillStyle = OMBRE_FONCEE;
                    ctx.fillRect(0, HAUTEUR_BRIQUE_PX - OMBRE_TAILLE, drawWidth, OMBRE_TAILLE); 
                    if (LARGEUR_JOINT_V_PX > 0) ctx.fillRect(drawWidth - OMBRE_TAILLE, 0, OMBRE_TAILLE, HAUTEUR_BRIQUE_PX); 

                    ctx.fillStyle = OMBRE_CLAIRE;
                    ctx.fillRect(0, 0, drawWidth - (LARGEUR_JOINT_V_PX > 0 ? OMBRE_TAILLE : 0), OMBRE_TAILLE); 
                    if (LARGEUR_JOINT_V_PX > 0) ctx.fillRect(0, 0, OMBRE_TAILLE, HAUTEUR_BRIQUE_PX - OMBRE_TAILLE); 

                    ctx.fillStyle = p;
                    if (LARGEUR_JOINT_V_PX === 0 && appareillage !== 'moucharabieh') {
                        ctx.fillRect(0, OMBRE_TAILLE, drawWidth, HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE));
                    } else {
                        ctx.fillRect(OMBRE_TAILLE, OMBRE_TAILLE, drawWidth - (2 * OMBRE_TAILLE), HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); 
                    }
                    
                    if (typeJoint === 'demi-rond' && appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                        const ligneV_PX = Math.max(1, LARGEUR_JOINT_V_PX * 0.4);
                        ctx.fillStyle = JOINT_CONCAVE_OMBRE;
                        ctx.fillRect(drawWidth + (LARGEUR_JOINT_V_PX / 2) - (ligneV_PX / 2), 0, ligneV_PX, HAUTEUR_BRIQUE_PX);
                    }
                    
                    ctx.restore();
                } else {
                    const fallbackColor = FALLBACK_COLORS[couleurName] || '#999';
                    ctx.fillStyle = fallbackColor;
                    ctx.fillRect(x, y, drawWidth, HAUTEUR_BRIQUE_PX);
                }
            }
            numeroRang++; 
        }
        updateTechSummary(exactWidthMM, exactHeightMM, configProduit, statsReal);
    }

    // ==========================================
    // 8. EXPORT
    // ==========================================

    function getFileName(extension) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR').replace(/\//g, '-'); 
        const selectedProdOption = containerProduit.querySelector('.custom-option.selected');
        let prodName = "Produit";
        if (selectedProdOption) {
            prodName = selectedProdOption.querySelector('span').textContent.trim();
        }
        const selectedColors = Array.from(containerCouleur.querySelectorAll('.custom-option.selected'));
        const selectedFinishes = Array.from(containerFinition.querySelectorAll('.custom-option.selected'));
        let combinaisonName = "";
        if (selectedColors.length > 0 && selectedFinishes.length > 0) {
            const listeCombinaisons = [];
            selectedColors.forEach(colorOpt => {
                const nomCouleur = colorOpt.querySelector('span').textContent.trim();
                selectedFinishes.forEach(finishOpt => {
                    let nomFinition = finishOpt.querySelector('span').textContent.trim();
                    nomFinition = nomFinition.replace('Aspect ', ''); 
                    listeCombinaisons.push(`${nomCouleur} ${nomFinition}`);
                });
            });
            combinaisonName = listeCombinaisons.join('_');
        } else {
            combinaisonName = "Selection_Incomplete";
        }
        let jointName = "Joint-Standard";
        if (selectJoint && selectJoint.options.length > 0) {
            const jointText = selectJoint.options[selectJoint.selectedIndex].text;
            jointName = jointText.replace(' (Standard)', '').trim();
        }
        const clean = (str) => {
            return str
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, '-') 
                .replace(/[^a-zA-Z0-9_\-]/g, '');
        };
        return `Configuration_Biallais_${clean(prodName)}_${clean(combinaisonName)}_Joint-${clean(jointName)}_${dateStr}.${extension}`;
    }

    const dl = (uri, filename) => { 
        const link = document.createElement('a'); 
        link.download = filename; 
        link.href = uri; 
        link.click(); 
    };

    if(btnExportJpg) btnExportJpg.onclick = () => dl(canvas.toDataURL('image/jpeg', 0.9), getFileName('jpg'));
    if(btnExportPng) btnExportPng.onclick = () => dl(canvas.toDataURL('image/png'), getFileName('png'));
    if(btnExportPdf) {
        btnExportPdf.onclick = () => {
            if(!window.jspdf) return;
            const doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
            const pageWidth = 297; const pageHeight = 210; const margin = 10; const textAreaHeight = 15;
            const img = canvas.toDataURL("image/jpeg", 0.8);
            const props = doc.getImageProperties(img);
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2) - textAreaHeight;
            const ratio = Math.min(maxWidth / props.width, maxHeight / props.height); 
            const finalW = props.width * ratio;
            const finalH = props.height * ratio;
            const x = (pageWidth - finalW) / 2;
            const y = margin; 
            doc.addImage(img, 'JPEG', x, y, finalW, finalH);
            const nomFichier = getFileName('pdf');
            doc.setFontSize(10); doc.setTextColor(100); 
            doc.text(nomFichier.replace('.pdf', '').replace(/_/g, ' '), pageWidth / 2, pageHeight - 10, { align: 'center' }); 
            doc.save(nomFichier);
        };
    }

    function updateTechSummary(widthMM, heightMM, configProduit, statsReal) {
        const summaryDiv = document.getElementById('tech-summary');
        if(!summaryDiv) return;
        summaryDiv.style.display = 'block';
        const surfaceM2 = (widthMM * heightMM) / 1000000;
        document.getElementById('sum-surface').textContent = surfaceM2.toFixed(2) + " m²";
        const moduleSurf = ((configProduit.dims.largeur + 10) * (configProduit.dims.hauteur + 10)); 
        const totalBriquesTheorique = Math.ceil((widthMM * heightMM) / moduleSurf);
        document.getElementById('sum-briques').textContent = totalBriquesTheorique;
        const tbody = document.getElementById('distribution-body');
        tbody.innerHTML = '';
        let totalCounted = 0;
        Object.values(statsReal).forEach(c => totalCounted += c);
        const sortedEntries = Object.entries(statsReal).sort((a,b) => b[1] - a[1]);
        for (const [key, count] of sortedEntries) {
            if (count > 0) {
                const ratio = totalCounted > 0 ? (count / totalCounted) : 0;
                const qte = Math.round(totalBriquesTheorique * ratio);
                const percent = (ratio * 100).toFixed(1);
                const [colorCode, finishCode] = key.split('|');
                const colorName = colorCode.charAt(0).toUpperCase() + colorCode.slice(1);
                const finishName = (finishCode === 'roc') ? 'Roc' : 'Lisse';
                const displayName = `${colorName} <small style="color:#666; font-style:italic;">(${finishName})</small>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><span style="display:inline-block;width:10px;height:10px;background-color:${FALLBACK_COLORS[colorCode]};margin-right:5px;border-radius:50%;"></span>${displayName}</td><td><strong>${percent}%</strong></td><td>${qte}</td>`;
                tbody.appendChild(tr);
            }
        }
    }

    // Premier lancement automatique pour ne pas avoir un écran vide
    setTimeout(triggerAutoUpdate, 500);
});