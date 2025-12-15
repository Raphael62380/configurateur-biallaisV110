document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. VERSION
    // ==========================================
    const APP_VERSION = "v1.8.0 (Fix Texture Relief)"; 
    
    const versionDiv = document.getElementById('app-version');
    if(versionDiv) {
        versionDiv.textContent = `Biallais Config - ${APP_VERSION}`;
    }

    // ==========================================
    // 1. UI ELEMENTS & VARIABLES
    // ==========================================
    let autoUpdateTimer = null; 

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

    // --- RELIEF 3D ---
    const selectReliefType = document.getElementById('select-relief-type');
    const sliderReliefPercent = document.getElementById('slider-relief-percent');
    const sliderReliefVal = document.getElementById('slider-relief-valeur');
    const containerReliefPercent = document.getElementById('container-relief-percent');
    // Options Relief
    const selectReliefColor = document.getElementById('select-relief-color');
    const selectReliefFinish = document.getElementById('select-relief-finish'); 
    const containerReliefColor = document.getElementById('container-relief-color');

    // --- RÈGLES LIGNES FORCÉES ---
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

    // --- ESTIMATION TECHNIQUE ---
    const userSurfaceInput = document.getElementById('user-global-surface');
    let lastStatsReal = {};
    let lastConfigProduit = null;
    let lastWidthMM = 0;
    let lastHeightMM = 0;

    // CONFIGURATION DES SCÈNES
    const SCENES_CONFIG = {
        'neutre': { img: null, mode: 'canvas' },
        'facade': {
            img: null, mode: 'pattern',
            scalePattern: 0.35, css: 'rotateY(0deg)',
            scaleMobile: 0.25, cssMobile: 'rotateY(0deg)'
        },
        'jardin': {
            img: null, mode: 'pattern',
            scalePattern: 0.3, css: 'perspective(1000px) rotateY(35deg) translate(-50px, 0)',
            scaleMobile: 0.2, cssMobile: 'perspective(600px) rotateY(20deg) translate(0, 0)'
        }
    };

    // ==========================================
    // 2. AUTO-UPDATE & LOGIC
    // ==========================================

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
        selectReliefColor, selectReliefFinish 
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

    // Gestion Affichage Options Relief
    if (selectReliefType) {
        selectReliefType.addEventListener('change', () => {
            const val = selectReliefType.value;
            // 1. Afficher Slider %
            if (containerReliefPercent) {
                containerReliefPercent.style.display = (val === 'none') ? 'none' : 'flex';
            }
            // 2. Afficher Choix Couleur/Finition
            if (containerReliefColor) {
                containerReliefColor.style.display = (val === 'random-out' || val === 'random-mix') ? 'block' : 'none';
            }
            triggerAutoUpdate();
        });
    }

    // --- LOGIQUE ZOOM & PAN ---
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

    // --- FONCTION SCÈNE ---
    function updateSceneView(sceneKey) {
        const config = SCENES_CONFIG[sceneKey];
        if (!config) return;

        const layer = document.getElementById('wall-pattern-layer');
        const cvs = document.getElementById('apercuCanvas');

        if (config.img) {
            canvasWrapper.style.backgroundImage = `url('${config.img}')`;
        } else {
            canvasWrapper.style.backgroundImage = 'none';
            canvasWrapper.style.backgroundColor = '#f4f6f8'; 
        }

        if (config.mode === 'canvas') {
            cvs.style.display = 'block';
            if(layer) layer.style.display = 'none';
            if(zoomControls) zoomControls.style.display = 'flex';
            if(zoomSlider) { zoomSlider.value = 1; zoomSlider.dispatchEvent(new Event('input')); }
            cvs.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        } 
        else {
            cvs.style.display = 'none';
            if (layer) {
                layer.style.display = 'block';
                const maxTextureSize = 1024;
                let textureUrl;
                if (cvs.width > maxTextureSize) {
                    const tempCanvas = document.createElement('canvas');
                    const ratio = maxTextureSize / cvs.width;
                    tempCanvas.width = maxTextureSize;
                    tempCanvas.height = cvs.height * ratio;
                    const tCtx = tempCanvas.getContext('2d');
                    tCtx.drawImage(cvs, 0, 0, tempCanvas.width, tempCanvas.height);
                    textureUrl = tempCanvas.toDataURL();
                } else {
                    textureUrl = cvs.toDataURL();
                }
                layer.style.backgroundImage = `url(${textureUrl})`;
                const dpr = window.devicePixelRatio || 1;
                const isMobile = window.innerWidth <= 900; 
                const currentScale = (isMobile && config.scaleMobile) ? config.scaleMobile : config.scalePattern;
                const currentCss = (isMobile && config.cssMobile) ? config.cssMobile : config.css;
                const finalSize = (cvs.width / dpr) * currentScale;
                layer.style.backgroundSize = `${finalSize}px auto`;
                layer.style.transform = `translate(-50%, -50%) ${currentCss}`;
            }
            if(zoomControls) zoomControls.style.display = 'none';
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

    const CONSOMMATION_MORTIER_REF = {
        'p1': 40, 'p2': 30, 'p3': 18, 'p4': 110, 'p5': 38, 
        'p6': 9, 'p7': 65, 'p8': 36, 'p9': 8
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
    // 4. HELPERS
    // ==========================================
    
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

    function checkRocAvailability(productId) {
        const rocOption = containerFinition.querySelector('.custom-option[data-value="roc"]');
        const lisseOption = containerFinition.querySelector('.custom-option[data-value="lisse"]');
        const selectFinishRule = document.getElementById('new-line-finish');

        if (NO_ROC_PRODUCTS.includes(productId)) {
            rocOption.classList.add('disabled');
            rocOption.classList.remove('selected');
            lisseOption.classList.add('selected');
            if (selectFinishRule) { selectFinishRule.innerHTML = '<option value="lisse">Lisse</option>'; selectFinishRule.value = 'lisse'; }
        } else {
            rocOption.classList.remove('disabled');
            if (selectFinishRule) {
                if (selectFinishRule.options.length < 2) {
                    selectFinishRule.innerHTML = `<option value="roc">Roc</option><option value="lisse">Lisse</option>`;
                    selectFinishRule.value = 'roc';
                }
            }
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
        const colorLabels = { 'blanc': 'Blanc', 'tonpierre': 'Ton Pierre', 'jaune': 'Jaune', 'saumon': 'Saumon', 'rouge': 'Rouge', 'chocolat': 'Chocolat', 'brun': 'Brun', 'grisclair': 'Gris Clair', 'grisfonce': 'Gris Foncé', 'anthracite': 'Anthracite', 'superblanc': 'Super Blanc', 'bleu': 'Bleu', 'vert': 'Vert' };
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
                updateEpaisseurText(val); checkRocAvailability(val); checkVerticalJointLimit(val); updateMaxRows(); 
            }
        }
        container.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (!option) return;
            container.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            if (containerId === 'container-produit') {
                const val = option.dataset.value;
                updateEpaisseurText(val); checkRocAvailability(val); checkVerticalJointLimit(val); updateMaxRows(); 
            }
            triggerAutoUpdate(); 
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
    }
    function getSingleValue(container) {
        const selected = container.querySelector('.custom-option.selected'); return selected ? selected.dataset.value : 'p1';
    }
    function getMultiValues(container) {
        const values = []; const selected = container.querySelectorAll('.custom-option.selected');
        selected.forEach(opt => values.push(opt.dataset.value));
        if (values.length === 0) { const first = container.querySelector('.custom-option'); if(first) { first.classList.add('selected'); values.push(first.dataset.value); } }
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

    // ==========================================
    // 6. MOTEUR GÉNÉRATION 
    // ==========================================

    bouton.addEventListener('click', () => { lancerGenerationMoteur(); });

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
            
            // --- Paramètres Relief ---
            const reliefType = selectReliefType ? selectReliefType.value : 'none';
            const reliefPercent = sliderReliefPercent ? parseInt(sliderReliefPercent.value) : 0;
            const reliefColor = selectReliefColor ? selectReliefColor.value : 'auto';
            const reliefFinish = selectReliefFinish ? selectReliefFinish.value : 'auto';
            
            const lignesRocMap = {}; const lignesLisseMap = {}; const lignesJointMap = {}; 
            const colorWeights = {}; let totalWeight = 0;
            
            const sliders = document.querySelectorAll('#dynamic-sliders-container input');
            if (sliders.length > 0) {
                sliders.forEach(input => { const weight = parseInt(input.value); colorWeights[input.dataset.color] = weight; totalWeight += weight; });
            } else { couleursChoisies.forEach(c => { colorWeights[c] = 100; totalWeight+=100; }); }
            if (totalWeight === 0) { couleursChoisies.forEach(c => { colorWeights[c] = 100; totalWeight+=100; }); }

            rulesData.forEach(r => {
                const colorToUse = (r.color && r.color !== "") ? r.color : null;
                if (r.finish === 'roc') lignesRocMap[r.row] = colorToUse; else lignesLisseMap[r.row] = colorToUse;
                if (r.joint) lignesJointMap[r.row] = r.joint;
            });

            let configProduit = PRODUITS_CONFIG[produitChoisi]; if (!configProduit) configProduit = PRODUITS_CONFIG['p1'];

            const listeACharger = [nomFichierJointGlobal];
            Object.values(lignesJointMap).forEach(j => { if (j && !listeACharger.includes(j)) listeACharger.push(j); });

            // 1. Charger images principales
            couleursChoisies.forEach(couleur => {
                finitionsChoisies.forEach(finition => {
                    for (let i = 1; i <= NOMBRE_VARIATIONS; i++) listeACharger.push(`${couleur}_${finition}_${i}.png`);
                });
            });

            // 2. Charger images des lignes forcées
            Object.values(lignesRocMap).forEach(c => { if(c) for(let i=1; i<=NOMBRE_VARIATIONS; i++) listeACharger.push(`${c}_roc_${i}.png`); });
            Object.values(lignesLisseMap).forEach(c => { if(c) for(let i=1; i<=NOMBRE_VARIATIONS; i++) listeACharger.push(`${c}_lisse_${i}.png`); });

            // 3. Charger images de la saillie (CORRECTIF TEXTURE MANQUANTE)
            if (reliefType !== 'none' && reliefPercent > 0) {
                // Quelles couleurs ?
                let colsToLoad = [];
                if (reliefColor !== 'auto') colsToLoad = [reliefColor];
                else colsToLoad = couleursChoisies; // Si auto, on prend les couleurs du mur

                // Quelles finitions ?
                let finsToLoad = [];
                if (reliefFinish !== 'auto') finsToLoad = [reliefFinish];
                else finsToLoad = ['lisse', 'roc']; // Si auto, on charge tout pour être sûr

                colsToLoad.forEach(c => {
                    finsToLoad.forEach(f => {
                         for(let i=1; i<=NOMBRE_VARIATIONS; i++) {
                             const name = `${c}_${f}_${i}.png`;
                             if (!listeACharger.includes(name)) listeACharger.push(name);
                         }
                    });
                });
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
                            reliefType, reliefPercent, reliefColor, reliefFinish // Nouveaux args
                        );
                        
                        if(selectScene && selectScene.value !== 'neutre') { updateSceneView(selectScene.value); }

                    } catch (e) { console.error("Erreur dessin", e); }
                })
                .catch(err => console.error("Erreur chargement", err))
                .finally(() => { hideLoading(); });
        }, 50);
    }

    // ==========================================
    // 7. DESSIN PRINCIPAL (AVEC RELIEF 3D)
    // ==========================================
    
    function dessinerMur(imagesMap, couleurs, finitions, imgGlobalJoint, jointsLibrary, appareillage, configProduit, pourcentageRoc, colorWeights, lignesRocMap, lignesLisseMap, lignesJointMap, largeurJointH, largeurJointV, typeJoint, reliefType, reliefPercent, reliefColor, reliefFinish) {
        
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

        const OMBRE_FONCEE = 'rgba(0, 0, 0, 0.45)'; 
        const OMBRE_CLAIRE = 'rgba(255, 255, 255, 0.3)'; 
        const OMBRE_TAILLE = Math.round(Math.max(1, LARGEUR_JOINT_H_PX * 0.2)); 
        const JOINT_CONCAVE_OMBRE = 'rgba(0, 0, 0, 0.2)'; 
        const JOINT_CONCAVE_CLAIRE = 'rgba(255, 255, 255, 0.1)';
        const JOINT_CONCAVE_LIGNE_PX = Math.round(Math.max(1, LARGEUR_JOINT_H_PX * 0.4)); 

        let patternMortierGlobal = null;
        let colorDefault = "#cccccc";

        if (imgGlobalJoint) {
            patternMortierGlobal = ctx.createPattern(imgGlobalJoint, 'repeat');
            let scale = (TAILLE_REELLE_TEXTURE_JOINT_MM * ECHELLE) / imgGlobalJoint.width;
            patternMortierGlobal.setTransform(new DOMMatrix().scale(scale));
        }

        ctx.fillStyle = (appareillage === 'moucharabieh') ? "#FFFFFF" : (patternMortierGlobal || colorDefault);
        ctx.fillRect(0, 0, width, height);

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
            for(let i=0; i<count; i++) colorDeck.push(c);
        });

        for (let i = colorDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colorDeck[i], colorDeck[j]] = [colorDeck[j], colorDeck[i]];
        }

        let deckIndex = 0;

        for (let y = LARGEUR_JOINT_H_PX; y < height; y += STEP_Y) {
            
            let rowEdgeColor = null;
            if (deckIndex < colorDeck.length) { rowEdgeColor = colorDeck[deckIndex]; deckIndex++; } else { rowEdgeColor = couleurs[Math.floor(Math.random() * couleurs.length)]; }

            let rowEdgeFinition = 'lisse';
            if (finitions.includes('lisse') && finitions.includes('roc')) {
                 rowEdgeFinition = (Math.random() * 100 < pourcentageRoc) ? 'roc' : 'lisse';
            } else if (finitions.includes('roc')) { rowEdgeFinition = 'roc'; }

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
                
                let couleurName, finitionName = 'lisse'; 
                
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
                        if (deckIndex < colorDeck.length) { couleurName = colorDeck[deckIndex]; deckIndex++; } 
                        else { couleurName = couleurs[0]; }
                        
                        if (finitions.includes('lisse') && finitions.includes('roc')) {
                            finitionName = (Math.random() * 100 < pourcentageRoc) ? 'roc' : 'lisse';
                        } else if (finitions.includes('roc')) { finitionName = 'roc'; }
                    }
                }

                // --- DÉCISION DU RELIEF 3D ---
                let mode3D = 'normal'; // normal, out, in
                if (reliefType !== 'none' && x > 0 && x < width - LARGEUR_BRIQUE_PX) {
                    if (Math.random() * 100 < reliefPercent) {
                        if (reliefType === 'random-out') mode3D = 'out';
                        else if (reliefType === 'random-in') mode3D = 'in';
                        else if (reliefType === 'random-mix') mode3D = (Math.random() > 0.5) ? 'out' : 'in';
                    }
                }

                // --- OVERRIDE COULEUR ET FINITION SI SAILLIE (OUT) ---
                if (mode3D === 'out') {
                    if (reliefColor && reliefColor !== 'auto') couleurName = reliefColor;
                    if (reliefFinish && reliefFinish !== 'auto') finitionName = reliefFinish;
                }

                // ENREGISTREMENT STATS
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
                    let drawX = x; let drawY = y;
                    
                    if (mode3D === 'out') {
                        const shift = ECHELLE * 4; drawX -= shift; drawY -= shift;
                        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x + shift, y + shift, LARGEUR_BRIQUE_PX, HAUTEUR_BRIQUE_PX);
                    }
                    
                    ctx.translate(drawX, drawY);

                    if (appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                        ctx.fillStyle = currentPatternV; ctx.fillRect(drawWidth, 0, LARGEUR_JOINT_V_PX, HAUTEUR_BRIQUE_PX);
                    }

                   if (appareillage === 'moucharabieh') {
                        ctx.fillStyle = patternMortierGlobal ? patternMortierGlobal : colorDefault;
                        const mortierH = LARGEUR_JOINT_H_PX; const tiers = drawWidth / 3; 
                        ctx.fillRect(0, HAUTEUR_BRIQUE_PX, tiers, mortierH); ctx.fillRect(2 * tiers, HAUTEUR_BRIQUE_PX, tiers, mortierH);
                        ctx.fillRect(0, -mortierH, tiers, mortierH); ctx.fillRect(2 * tiers, -mortierH, tiers, mortierH);
                        ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(0, HAUTEUR_BRIQUE_PX, tiers, 2); ctx.fillRect(2 * tiers, HAUTEUR_BRIQUE_PX, tiers, 2);
                    }
                    
                    ctx.fillStyle = OMBRE_FONCEE;
                    ctx.fillRect(0, HAUTEUR_BRIQUE_PX - OMBRE_TAILLE, drawWidth, OMBRE_TAILLE); 
                    if (LARGEUR_JOINT_V_PX > 0) ctx.fillRect(drawWidth - OMBRE_TAILLE, 0, OMBRE_TAILLE, HAUTEUR_BRIQUE_PX); 

                    const baseColor = FALLBACK_COLORS[couleurName] || '#cccccc';
                    ctx.fillStyle = baseColor;
                    if (LARGEUR_JOINT_V_PX === 0 && appareillage !== 'moucharabieh') { ctx.fillRect(0, OMBRE_TAILLE, drawWidth, HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); } 
                    else { ctx.fillRect(OMBRE_TAILLE, OMBRE_TAILLE, drawWidth - (2 * OMBRE_TAILLE), HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); }

                    ctx.fillStyle = OMBRE_CLAIRE;
                    ctx.fillRect(0, 0, drawWidth - (LARGEUR_JOINT_V_PX > 0 ? OMBRE_TAILLE : 0), OMBRE_TAILLE); 
                    if (LARGEUR_JOINT_V_PX > 0) ctx.fillRect(0, 0, OMBRE_TAILLE, HAUTEUR_BRIQUE_PX - OMBRE_TAILLE); 

                    ctx.fillStyle = p;
                    if (LARGEUR_JOINT_V_PX === 0 && appareillage !== 'moucharabieh') { ctx.fillRect(0, OMBRE_TAILLE, drawWidth, HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); } 
                    else { ctx.fillRect(OMBRE_TAILLE, OMBRE_TAILLE, drawWidth - (2 * OMBRE_TAILLE), HAUTEUR_BRIQUE_PX - (2 * OMBRE_TAILLE)); }
                    
                    if (mode3D === 'in') {
                        const innerShadowSize = ECHELLE * 6; 
                        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, drawWidth, innerShadowSize); ctx.fillRect(0, 0, innerShadowSize, HAUTEUR_BRIQUE_PX); 
                        ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(0, 0, drawWidth, HAUTEUR_BRIQUE_PX);
                    }
                    else if (mode3D === 'out') {
                        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(0, 0, drawWidth, ECHELLE * 2); ctx.fillRect(0, 0, ECHELLE * 2, HAUTEUR_BRIQUE_PX);
                    }

                    if (typeJoint === 'demi-rond' && appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                        const ligneV_PX = Math.max(1, LARGEUR_JOINT_V_PX * 0.4);
                        ctx.fillStyle = JOINT_CONCAVE_OMBRE; ctx.fillRect(drawWidth + (LARGEUR_JOINT_V_PX / 2) - (ligneV_PX / 2), 0, ligneV_PX, HAUTEUR_BRIQUE_PX);
                    }
                    ctx.restore();
                } else {
                    const fallbackColor = FALLBACK_COLORS[couleurName] || '#999';
                    ctx.fillStyle = fallbackColor; ctx.fillRect(x, y, drawWidth, HAUTEUR_BRIQUE_PX);
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
        const now = new Date(); const dateStr = now.toLocaleDateString('fr-FR').replace(/\//g, '-'); 
        const selectedProdOption = containerProduit.querySelector('.custom-option.selected');
        let prodName = "Produit"; if (selectedProdOption) { prodName = selectedProdOption.querySelector('span').textContent.trim(); }
        const selectedColors = Array.from(containerCouleur.querySelectorAll('.custom-option.selected'));
        const selectedFinishes = Array.from(containerFinition.querySelectorAll('.custom-option.selected'));
        let combinaisonName = "";
        if (selectedColors.length > 0 && selectedFinishes.length > 0) {
            const listeCombinaisons = [];
            selectedColors.forEach(colorOpt => {
                const nomCouleur = colorOpt.querySelector('span').textContent.trim();
                selectedFinishes.forEach(finishOpt => {
                    let nomFinition = finishOpt.querySelector('span').textContent.trim(); nomFinition = nomFinition.replace('Aspect ', ''); 
                    listeCombinaisons.push(`${nomCouleur} ${nomFinition}`);
                });
            });
            combinaisonName = listeCombinaisons.join('_');
        } else { combinaisonName = "Selection_Incomplete"; }
        let jointName = "Joint-Standard";
        if (selectJoint && selectJoint.options.length > 0) {
            const jointText = selectJoint.options[selectJoint.selectedIndex].text; jointName = jointText.replace(' (Standard)', '').trim();
        }
        const clean = (str) => { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_\-]/g, ''); };
        return `Configuration_Biallais_${clean(prodName)}_${clean(combinaisonName)}_Joint-${clean(jointName)}_${dateStr}.${extension}`;
    }

    const dl = (uri, filename) => { const link = document.createElement('a'); link.download = filename; link.href = uri; link.click(); };

    if(btnExportJpg) btnExportJpg.onclick = () => dl(canvas.toDataURL('image/jpeg', 0.9), getFileName('jpg'));
    if(btnExportPng) btnExportPng.onclick = () => dl(canvas.toDataURL('image/png'), getFileName('png'));
    if(btnExportPdf) {
        btnExportPdf.onclick = () => {
            if(!window.jspdf) return;
            const doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
            const pageWidth = 297; const pageHeight = 210; const margin = 10; const textAreaHeight = 15;
            const img = canvas.toDataURL("image/jpeg", 0.8);
            const props = doc.getImageProperties(img);
            const maxWidth = pageWidth - (margin * 2); const maxHeight = pageHeight - (margin * 2) - textAreaHeight;
            const ratio = Math.min(maxWidth / props.width, maxHeight / props.height); 
            const finalW = props.width * ratio; const finalH = props.height * ratio;
            const x = (pageWidth - finalW) / 2; const y = margin; 
            doc.addImage(img, 'JPEG', x, y, finalW, finalH);
            const nomFichier = getFileName('pdf');
            doc.setFontSize(10); doc.setTextColor(100); doc.text(nomFichier.replace('.pdf', '').replace(/_/g, ' '), pageWidth / 2, pageHeight - 10, { align: 'center' }); 
            doc.save(nomFichier);
        };
    }

    // ==========================================
    // 9. ESTIMATION TECHNIQUE & MORTIER
    // ==========================================
    
    function updateTechSummary(widthMM, heightMM, configProduit, statsReal) {
        const summaryDiv = document.getElementById('tech-summary');
        if(!summaryDiv) return;
        summaryDiv.style.display = 'block';

        lastStatsReal = statsReal; lastConfigProduit = configProduit; lastWidthMM = widthMM; lastHeightMM = heightMM;

        const userSurfInput = document.getElementById('user-global-surface');
        const userSurfVal = userSurfInput && userSurfInput.value ? parseFloat(userSurfInput.value) : 0;
        const produitCode = getSingleValue(document.getElementById('container-produit'));

        let surfaceReferenceM2 = 0;
        if (userSurfVal > 0) {
            surfaceReferenceM2 = userSurfVal; document.getElementById('sum-surface').textContent = userSurfVal.toFixed(2) + " m² (Projet)";
        } else {
            surfaceReferenceM2 = (widthMM * heightMM) / 1000000; document.getElementById('sum-surface').textContent = surfaceReferenceM2.toFixed(2) + " m² (Visuel)";
        }

        const moduleSurfM2 = ((configProduit.dims.largeur + 10) * (configProduit.dims.hauteur + 10)) / 1000000; 
        const totalBriquesTheorique = Math.ceil(surfaceReferenceM2 / moduleSurfM2);
        document.getElementById('sum-briques').textContent = totalBriquesTheorique;

        // --- CALCUL MORTIER ---
        const refConso = CONSOMMATION_MORTIER_REF[produitCode] || 0;
        const currentJointH = document.getElementById('slider-joint-h') ? parseInt(document.getElementById('slider-joint-h').value) : 10;
        const currentJointV = document.getElementById('slider-joint-v') ? parseInt(document.getElementById('slider-joint-v').value) : 10;
        const facteurJoint = (currentJointH + currentJointV) / 20;

        const selectJointGlobal = document.getElementById('select-joint');
        const globalJointName = selectJointGlobal.options[selectJointGlobal.selectedIndex].text.replace(' (Standard)', '').replace('Joint ', '');
        const moduleH_mm = configProduit.dims.hauteur + currentJointH;
        const nbRowsTotal = Math.ceil(heightMM / moduleH_mm) || 1;

        let lignesSpecifiquesCount = 0; const consoParJoint = {}; consoParJoint[globalJointName] = 0;

        rulesData.forEach(rule => {
            if (rule.joint && rule.joint !== "") {
                let nomJ = rule.joint.replace('joint_', '').replace('.png', '');
                nomJ = nomJ.charAt(0).toUpperCase() + nomJ.slice(1);
                lignesSpecifiquesCount++; if (!consoParJoint[nomJ]) consoParJoint[nomJ] = 0; consoParJoint[nomJ] += 1;
            }
        });

        const lignesStandardCount = Math.max(0, nbRowsTotal - lignesSpecifiquesCount);
        consoParJoint[globalJointName] += lignesStandardCount;
        const totalParts = lignesSpecifiquesCount + lignesStandardCount;
        
        let resumeMortierHTML = "";
        for (const [nom, parts] of Object.entries(consoParJoint)) {
            if (parts > 0) {
                const ratio = parts / totalParts; const surfaceConcernee = surfaceReferenceM2 * ratio;
                const poids = Math.ceil(surfaceConcernee * refConso * facteurJoint);
                if (poids > 0) {
                    resumeMortierHTML += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px dashed #d1d5db; padding-bottom:2px;">
                        <span style="font-weight:500;">${nom}</span><span style="font-weight:bold; color:#495057; background:#fff; padding:0 5px; border-radius:4px;">${poids} kg</span></div>`;
                }
            }
        }

        const divMortierList = document.getElementById('mortier-details-list'); if (divMortierList) divMortierList.innerHTML = resumeMortierHTML;

        // --- TABLEAU PRODUITS ---
        const tbody = document.getElementById('distribution-body'); tbody.innerHTML = '';
        let totalCountedInView = 0; Object.values(statsReal).forEach(c => totalCountedInView += c);
        const sortedEntries = Object.entries(statsReal).sort((a,b) => b[1] - a[1]);
        
        for (const [key, count] of sortedEntries) {
            if (count > 0) {
                const ratio = totalCountedInView > 0 ? (count / totalCountedInView) : 0;
                const qte = Math.round(totalBriquesTheorique * ratio);
                const surfSpecifique = (surfaceReferenceM2 * ratio).toFixed(2);
                const percent = (ratio * 100).toFixed(1);
                
                const [colorCode, finishCode] = key.split('|');
                const colorName = colorCode.charAt(0).toUpperCase() + colorCode.slice(1);
                const finishName = (finishCode === 'roc') ? 'Roc' : 'Lisse';
                const displayName = `<span style="font-weight:bold;">${colorName}</span> <small>(${finishName})</small>`;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><span style="display:inline-block;width:10px;height:10px;background-color:${FALLBACK_COLORS[colorCode]};margin-right:5px;border-radius:50%;"></span>${displayName}</td><td>${percent}%</td><td style="font-weight:bold; color:#0d6efd;">${surfSpecifique}</td><td style="font-weight:bold;">${qte}</td>`;
                tbody.appendChild(tr);
            }
        }
    }

    // ==========================================
    // 10. RESIZER & ACCUEIL
    // ==========================================
    
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

    setTimeout(triggerAutoUpdate, 500);

}); // FIN DOMContentLoaded