document.addEventListener('DOMContentLoaded', () => {

    const APP_VERSION = "v5.0 (Final - Pro 2025)"; 
    const versionDiv = document.getElementById('app-version');
    if(versionDiv) versionDiv.textContent = `Biallais Config - ${APP_VERSION}`;

    // --- NETTOYAGE FORCE DU RECTANGLE FANTOME ---
    const overlayZone = document.getElementById('initial-overlay');
    if (overlayZone) {
        const ghostImages = overlayZone.querySelectorAll('img');
        ghostImages.forEach(img => img.remove());
    }

    let autoUpdateTimer = null; 

    // --- ELEMENTS DOM ---
    const bouton = document.getElementById('genererBouton');
    const canvas = document.getElementById('apercuCanvas');
    const loadingOverlay = document.getElementById('loading-overlay');
    const initialOverlay = document.getElementById('initial-overlay');
    
    const containerProduit = document.getElementById('container-produit');
    const containerFinition = document.getElementById('container-finition');
    const containerCouleur = document.getElementById('select-couleur'); 
    
    // NOUVEAU : Message d'instruction
    const msgInstruction = document.getElementById('msg-instruction-couleur');

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
    const btnExportCCTP = document.getElementById('btnExportCCTP');
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
            if (!btnOpenRouges.contains(e.target) && !subPaletteRouge.contains(e.target)) {
                subPaletteRouge.style.display = 'none';
                btnOpenRouges.style.backgroundColor = "#ffebee";
                btnOpenRouges.style.borderColor = "#e57373";
            }
        }
    });

    const SCENES_CONFIG = {
        'neutre': { img: null, mode: 'canvas' },
        'facade': { img: null, mode: 'pattern', scalePattern: 0.35, css: 'rotateY(0deg)', scaleMobile: 0.25, cssMobile: 'rotateY(0deg)' },
        'jardin': { img: null, mode: 'pattern', scalePattern: 0.3, css: 'perspective(1000px) rotateY(35deg) translate(-50px, 0)', scaleMobile: 0.2, cssMobile: 'perspective(600px) rotateY(20deg) translate(0, 0)' }
    };

    // --- FONCTION POUR GÉRER LE MESSAGE D'INSTRUCTION ---
    function updateInstructionMessage() {
        if (!msgInstruction) return;
        const couleurs = getMultiValues(containerCouleur);
        if (couleurs.length === 0) {
            msgInstruction.classList.remove('hidden');
        } else {
            msgInstruction.classList.add('hidden');
        }
    }

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

    const CONSOMMATION_MORTIER_REF = { 'p1': 40, 'p2': 30, 'p3': 18, 'p4': 110, 'p5': 38, 'p6': 9, 'p7': 65, 'p8': 36, 'p9': 8 };

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
                
                // MISE A JOUR MESSAGE INSTRUCTION
                updateInstructionMessage();
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
            const selected = containerElement.querySelectorAll('.custom-option.selected');
            if (selected.length === 0) option.classList.add('selected');
            
            if(containerElement === containerCouleur || containerElement.id === 'sub-palette-rouge') {
                validateRocConstraints();
            }
            
            checkRocVisibility(); checkColorDistribution(); triggerAutoUpdate();
            // MISE A JOUR MESSAGE INSTRUCTION
            updateInstructionMessage(); 
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
        const values = []; 
        const selected = container.querySelectorAll('.custom-option.selected');
        selected.forEach(opt => values.push(opt.dataset.value));
        
        // MODIFICATION : On empêche la sélection automatique forcée pour les couleurs
        if (values.length === 0 && container.id !== 'select-couleur') { 
            const first = container.querySelector('.custom-option'); 
            if(first) { 
                first.classList.add('selected'); 
                values.push(first.dataset.value); 
            } 
        }
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

    // =========================================================
    // COEUR DU MOTEUR DE GÉNÉRATION (CORRIGÉ & SÉCURISÉ)
    // =========================================================
    function lancerGenerationMoteur() {
        showLoading();
        
        setTimeout(() => {
            // 1. D'ABORD : On récupère les couleurs pour vérifier
            const couleursChoisies = getMultiValues(containerCouleur);

            // 2. VERIFICATION : Si aucune couleur n'est choisie, on ne fait rien (Ecran d'attente)
            if (couleursChoisies.length === 0) {
                // On cache le chargement
                if(loadingOverlay) loadingOverlay.classList.add('hidden');
                if(bouton) { bouton.disabled = false; bouton.textContent = "Mettre à jour le rendu"; bouton.style.opacity = "1"; }
                
                // On s'assure que l'écran d'accueil (vidéo) est bien visible
                const initialOverlay = document.getElementById('initial-overlay');
                if(initialOverlay) {
                    initialOverlay.classList.remove('hidden');
                    const vid = initialOverlay.querySelector('video');
                    if(vid) vid.play().catch(e => {});
                }
                
                // On cache le canvas et le pattern
                if(canvas) canvas.style.display = 'none';
                const layer = document.getElementById('wall-pattern-layer');
                if(layer) layer.style.display = 'none';

                // On vide les stats
                document.getElementById('sum-surface').textContent = '0 m²';
                document.getElementById('sum-briques').textContent = '0';
                
                return; // ON ARRÊTE L'EXÉCUTION ICI
            }

            // 3. SI ON A UNE COULEUR, ON CONTINUE (On ne redéclare PAS couleursChoisies)
            const produitChoisi = getSingleValue(containerProduit);
            const finitionsChoisies = getMultiValues(containerFinition);
            // NOTE : "couleursChoisies" est déjà déclaré plus haut
            
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
                        
                        // IMPORTANT : On force l'affichage du canvas (car le Reset l'avait caché)
                        if(selectScene) { updateSceneView(selectScene.value); }

                    } catch (e) { console.error("Erreur dessin", e); }
                })
                .catch(err => console.error("Erreur chargement", err))
                .finally(() => { hideLoading(); });
        }, 50);
    }

    function dessinerMur(imagesMap, couleurs, finitions, imgGlobalJoint, jointsLibrary, appareillage, configProduit, pourcentageRoc, colorWeights, lignesRocMap, lignesLisseMap, lignesJointMap, largeurJointH, largeurJointV, typeJoint, reliefType, reliefPercent, reliefOutColor, reliefOutFinish, reliefInColor, reliefInFinish) {
        
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

        let patternMortierGlobal = null;
        let colorDefault = "#cccccc";

        if (imgGlobalJoint) {
            patternMortierGlobal = ctx.createPattern(imgGlobalJoint, 'repeat');
            let scale = (TAILLE_REELLE_TEXTURE_JOINT_MM * ECHELLE) / imgGlobalJoint.width;
            patternMortierGlobal.setTransform(new DOMMatrix().scale(scale));
        }

        // --- CORRECTION MOUCHARABIEH 3D ---
        if (appareillage === 'moucharabieh') {
            // ON ÉCLAIRCIT LÉGÈREMENT LE FOND (Gris foncé #2c2c2c)
            // Cela permet à l'extrusion noire (#0a0a0a) de se détacher et devenir visible.
            ctx.fillStyle = "#2c2c2c"; 
        } else {
            ctx.fillStyle = patternMortierGlobal ? patternMortierGlobal : colorDefault;
        }
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
        
        const totalBriquesEstime = (nbCols * nbRows) * 1.5; 
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
                
                // SECURITÉ ROC
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
                    
                    if (appareillage === 'moucharabieh') {
                        const profondeur3D = 25 * ECHELLE; 
                        ctx.fillStyle = "#0a0a0a"; 
                        ctx.fillRect(profondeur3D, profondeur3D, currentBriqueWidth, HAUTEUR_BRIQUE_PX);
                    }

                    if (appareillage !== 'moucharabieh' && LARGEUR_JOINT_V_PX > 0) {
                        ctx.fillStyle = currentPatternV; ctx.fillRect(currentBriqueWidth, 0, LARGEUR_JOINT_V_PX, HAUTEUR_BRIQUE_PX);
                    }

                   if (appareillage === 'moucharabieh') {
                        ctx.fillStyle = patternMortierGlobal ? patternMortierGlobal : colorDefault;
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
    // 9. ESTIMATION TECHNIQUE
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

        // 3. Calcul Mortier
        const refConso = CONSOMMATION_MORTIER_REF[produitCode] || 0;
        const currentJointH = document.getElementById('slider-joint-h') ? parseInt(document.getElementById('slider-joint-h').value) : 10;
        const currentJointV = document.getElementById('slider-joint-v') ? parseInt(document.getElementById('slider-joint-v').value) : 10;
        const facteurJoint = (currentJointH + currentJointV) / 20;

        const selectJointGlobal = document.getElementById('select-joint');
        const globalJointName = selectJointGlobal.options[selectJointGlobal.selectedIndex].text.replace(' (Standard)', '').replace('Joint ', '');
        const moduleH_mm = configProduit.dims.hauteur + currentJointH;
        const nbRowsTotal = Math.ceil(heightMM / moduleH_mm) || 1;

        let lignesSpecifiquesCount = 0; 
        const consoParJoint = {}; 
        consoParJoint[globalJointName] = 0;

        rulesData.forEach(rule => {
            if (rule.joint && rule.joint !== "") {
                let nomJ = rule.joint.replace('joint_', '').replace('.png', '');
                nomJ = nomJ.charAt(0).toUpperCase() + nomJ.slice(1);
                lignesSpecifiquesCount++; 
                if (!consoParJoint[nomJ]) consoParJoint[nomJ] = 0; 
                consoParJoint[nomJ] += 1;
            }
        });

        const lignesStandardCount = Math.max(0, nbRowsTotal - lignesSpecifiquesCount);
        consoParJoint[globalJointName] += lignesStandardCount;
        const totalParts = lignesSpecifiquesCount + lignesStandardCount;
        
        let resumeMortierHTML = "";
        for (const [nom, parts] of Object.entries(consoParJoint)) {
            if (parts > 0) {
                const ratio = parts / totalParts; 
                const surfaceConcernee = surfaceReferenceM2 * ratio;
                const poids = Math.ceil(surfaceConcernee * refConso * facteurJoint);
                if (poids > 0) {
                    resumeMortierHTML += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px dashed #d1d5db; padding-bottom:2px;">
                        <span style="font-weight:500;">${nom}</span><span style="font-weight:bold; color:#495057; background:#fff; padding:0 5px; border-radius:4px;">${poids} kg</span></div>`;
                }
            }
        }
        const divMortierList = document.getElementById('mortier-details-list'); 
        if (divMortierList) divMortierList.innerHTML = resumeMortierHTML;

        // 4. Calcul Distribution (Tableau)
        const tbody = document.getElementById('distribution-body'); 
        tbody.innerHTML = '';
        let totalCountedInView = 0; 
        Object.values(statsReal).forEach(c => totalCountedInView += c);
        
        const sortedEntries = Object.entries(statsReal).sort((a,b) => b[1] - a[1]);
        
        for (const [key, count] of sortedEntries) {
            if (count > 0) {
                const ratio = totalCountedInView > 0 ? (count / totalCountedInView) : 0;
                const qte = Math.round(totalBriquesTheorique * ratio);
                const surfSpecifique = (surfaceReferenceM2 * ratio).toFixed(2);
                const percent = (ratio * 100).toFixed(1);
                
                const parts = key.split('|');
                const colorCode = parts[0];
                const finishCode = parts[1];
                
                const colorName = colorCode.charAt(0).toUpperCase() + colorCode.slice(1);
                const finishName = (finishCode === 'roc') ? 'Roc' : 'Lisse';
                const displayName = `<span style="font-weight:bold;">${colorName}</span> <small>(${finishName})</small>`;
                
                const bgCol = FALLBACK_COLORS[colorCode] || '#cccccc'; 

                const tr = document.createElement('tr');
                tr.innerHTML = `<td><span style="display:inline-block;width:10px;height:10px;background-color:${bgCol};margin-right:5px;border-radius:50%;"></span>${displayName}</td><td>${percent}%</td><td style="font-weight:bold; color:#0d6efd;">${surfSpecifique}</td><td style="font-weight:bold;">${qte}</td>`;
                tbody.appendChild(tr);
            }
        }
    }

    const resizer = document.getElementById('dragMe'); const leftSide = document.querySelector('.config-panel'); let x = 0; let leftWidth = 0;
    const mouseDownHandler = function(e) { x = e.clientX; leftWidth = leftSide.getBoundingClientRect().width; document.addEventListener('mousemove', mouseMoveHandler); document.addEventListener('mouseup', mouseUpHandler); document.body.style.cursor = 'col-resize'; if(resizer) resizer.style.borderLeft = '2px solid #007bff'; };
    const mouseMoveHandler = function(e) { const dx = e.clientX - x; const newWidth = leftWidth + dx; if (newWidth > 300 && newWidth < window.innerWidth * 0.6) { leftSide.style.width = `${newWidth}px`; leftSide.style.flex = `0 0 ${newWidth}px`; } };
    const mouseUpHandler = function() { document.removeEventListener('mousemove', mouseMoveHandler); document.removeEventListener('mouseup', mouseUpHandler); document.body.style.cursor = 'default'; if(resizer) resizer.style.borderLeft = 'none'; triggerAutoUpdate(); };
    if (resizer) resizer.addEventListener('mousedown', mouseDownHandler);

    function dismissWelcomeScreen() {
        // Cette fonction n'est plus utilisée pour cacher l'écran automatiquement au clic global
        // car nous voulons forcer le choix de couleur.
        // On la laisse vide pour ne pas casser d'éventuels appels existants
    }
    
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

    // =========================================================
    // 11. GENERATEUR DE NOM DYNAMIQUE
    // =========================================================
    function genererNomFichier(extension) {
        const produitEl = document.querySelector('#container-produit .custom-option.selected span');
        let nomProduit = produitEl ? produitEl.textContent.trim() : 'Produit';
        const finitionsEls = document.querySelectorAll('#container-finition .custom-option.selected span');
        let nomFinitions = Array.from(finitionsEls).map(el => el.textContent.trim()).join('-');
        if (!nomFinitions) nomFinitions = 'Finition';
        const couleursEls = document.querySelectorAll('#select-couleur .custom-option.selected span');
        let nomCouleurs = Array.from(couleursEls).map(el => el.textContent.trim()).join('-');
        if (!nomCouleurs) nomCouleurs = 'Couleur';
        let dimsZone = "Zone";
        if (typeof lastWidthMM !== 'undefined' && typeof lastHeightMM !== 'undefined' && lastWidthMM > 0) {
            dimsZone = `${Math.round(lastWidthMM)}x${Math.round(lastHeightMM)}mm`;
        }
        const clean = (str) => str.replace(/[^a-zA-Z0-9-_àâéèêëîïôùûçÀÂÉÈÊËÎÏÔÙÛÇ]/g, '_');
        return `Biallais_${clean(nomProduit)}_${clean(nomFinitions)}_${clean(nomCouleurs)}_${dimsZone}.${extension}`;
    }

    // =========================================================
    // 12. EXPORTS IMAGES
    // =========================================================
    if (btnExportJpg) {
        btnExportJpg.addEventListener('click', (e) => {
            e.preventDefault();
            if (!canvas) return;
            try {
                const link = document.createElement('a');
                link.download = genererNomFichier('jpg');
                link.href = canvas.toDataURL("image/jpeg", 0.9);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) { console.error("Erreur JPG:", err); }
        });
    }

    if (btnExportPng) {
        btnExportPng.addEventListener('click', (e) => {
            e.preventDefault();
            if (!canvas) return;
            try {
                const link = document.createElement('a');
                link.download = genererNomFichier('png');
                link.href = canvas.toDataURL("image/png");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) { console.error("Erreur PNG:", err); }
        });
    }

    // =========================================================
    // 13. EXPORT PDF
    // =========================================================
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.jspdf) { alert("Librairie PDF non chargée."); return; }
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'landscape' });
                const nomFichierFull = genererNomFichier('pdf'); 
                const titreInterne = nomFichierFull.replace('.pdf', '').replace(/_/g, ' ');

                doc.setFontSize(14);
                doc.setTextColor(40, 167, 69); 
                doc.text("Configuration Biallais Industries", 10, 15);
                
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(titreInterne, 10, 22);

                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const props = doc.getImageProperties(imgData);
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                const margin = 10;
                const maxW = pageWidth - (margin * 2);
                const maxH = pageHeight - 40; 
                const ratio = props.width / props.height;
                let w = maxW;
                let h = w / ratio;
                if (h > maxH) { h = maxH; w = h * ratio; }
                
                doc.addImage(imgData, 'JPEG', 10, 30, w, h);
                doc.save(nomFichierFull);

            } catch (err) {
                console.error("Erreur PDF:", err);
                alert("Erreur lors de la génération du PDF.");
            }
        });
    }

    // =========================================================
    // 14. EXPORT CCTP - VERSION PRESCRIPTION 2025
    // =========================================================
    if (btnExportCCTP) {
        btnExportCCTP.addEventListener('click', () => {
            
            // --- A. RÉCUPÉRATION DES DONNÉES ---
            const cctpProduitVal = getSingleValue(containerProduit);
            const cctpConfigP = PRODUITS_CONFIG[cctpProduitVal] || PRODUITS_CONFIG['p1'];
            const cctpProduitEl = containerProduit.querySelector('.custom-option.selected');
            const cctpNomProduit = cctpProduitEl ? cctpProduitEl.querySelector('span').textContent.trim() : "Produit Gamme Biallais";
            const cctpDims = cctpConfigP.dims; 
            
            const cctpCouleursEls = containerCouleur.querySelectorAll('.custom-option.selected');
            const cctpListeCouleurs = Array.from(cctpCouleursEls).map(el => el.querySelector('span').textContent).join(', ');

            const cctpFinitionsEls = containerFinition.querySelectorAll('.custom-option.selected');
            const cctpListeFinitions = Array.from(cctpFinitionsEls).map(el => el.querySelector('span').textContent).join(' & ');

            // Joint et Appareillage
            const cctpSelectJoint = document.getElementById('select-joint');
            const cctpNomJoint = cctpSelectJoint.options[cctpSelectJoint.selectedIndex].text.replace(' (Standard)', '').replace('Joint ', '');
            
            const cctpLargeurJointH = sliderJointH ? parseInt(sliderJointH.value) : 10;
            const cctpNomAppareillage = selectAppareillage.options[selectAppareillage.selectedIndex].text;
            const cctpDate = new Date().toLocaleDateString('fr-FR');

            // --- B. GÉNÉRATION DU CONTENU TECHNIQUE ---
            let titreLot = "";
            let articleMateriaux = "";
            let articleMiseEnOeuvre = "";
            
            // 1. CAS PLAQUETTES
            if (cctpProduitVal === 'p6' || cctpProduitVal === 'p9') {
                titreLot = "LOT FAÇADE : PAREMENT DE PLAQUETTES COLLÉES";
                
                articleMateriaux = `
1.1 PLAQUETTES DE PAREMENT
Fourniture de plaquettes de parement en béton architectonique.
- Référence de base : Gamme BIALLAIS ${cctpNomProduit.toUpperCase()} ou équivalent technique et esthétique.
- Caractéristiques : Éléments décoratifs garantis sans efflorescence de chaux.
- Format nominal : ${cctpDims.hauteur} x ${cctpDims.largeur} x 2 cm.
- Aspect de surface : ${cctpListeFinitions}.
- Teinte(s) : ${cctpListeCouleurs} (Validation sur échantillon requise).
- Conformité : Marquage CE obligatoire.

1.2 SYSTÈME DE COLLAGE
- Colle : Mortier-colle haute performance type PAREX LANKO ou équivalent, adapté au support.
- Mortier de jointoiement : Mortier spécifique hydrofugé type BIAJOINT ou équivalent.
- Teinte du joint : ${cctpNomJoint.toUpperCase()} (Référence fabricant ou équivalent).`;

                articleMiseEnOeuvre = `
2.1 CONDITIONS DE POSE
L'exécution devra être conforme au DTU 52.2 "Pose collée des revêtements céramiques et assimilés".
Le support devra être plan, propre, sec et cohésif.

2.2 TRAITEMENT DES JOINTS
- Épaisseur moyenne : ${cctpLargeurJointH} mm environ (Ajustement selon calepinage).
- Finition : ${cctpNomAppareillage}.
- Nettoyage : À l'avancement, par essuyage à l'éponge propre et eau claire. L'usage d'acide chlorhydrique est strictement interdit.`;

            // 2. CAS BLOCS PORTEURS
            } else if (cctpProduitVal === 'p1' || cctpProduitVal === 'p2' || cctpProduitVal === 'p3') {
                const epaisseurBloc = (cctpProduitVal === 'p3') ? '9' : (cctpProduitVal === 'p2' ? '15' : '19');
                titreLot = "LOT GROS ŒUVRE : MURS EN BLOCS DE BÉTON ARCHITECTONIQUE";

                articleMateriaux = `
1.1 ÉLÉMENTS DE MAÇONNERIE
Fourniture de blocs en béton architectonique apparents sur une ou deux faces.
- Référence de base : Gamme BIALLAIS ${cctpNomProduit.toUpperCase()} ou équivalent technique.
- Dimensions : ${cctpDims.hauteur} x ${cctpDims.largeur} x ${epaisseurBloc} cm.
- Aspect et Couleur : ${cctpListeFinitions}, Teinte ${cctpListeCouleurs}.
- Qualité : Blocs garantis sans efflorescence, certifiés NF et CE.

1.2 MORTIER DE MONTAGE
- Produit : Mortier industriel coloré hydrofugé dans la masse, type BIAMORTIER ou équivalent.
- Teinte : ${cctpNomJoint.toUpperCase()} (Assortie ou contrastée selon choix architecte).
- Dosage : Conforme aux exigences structurelles (min 350kg/m3).`;

                articleMiseEnOeuvre = `
2.1 EXÉCUTION DES MAÇONNERIES
Les travaux seront réalisés conformément au DTU 20.1 "Ouvrages de maçonnerie de petits éléments".
- Appareillage : ${cctpNomAppareillage}.
- Joints : Épaisseur nominale de ${cctpLargeurJointH} mm. Continuité de l'étanchéité assurée.
- Protection : Bâchage systématique des têtes de murs en fin de poste (Sujétion d'entreprise).

2.2 TRAITEMENT DES POINTS SINGULIERS
- Chaînages et raidisseurs : Réalisés à l'aide d'éléments spéciaux (blocs d'angle, linteaux en U) de la même gamme ou équivalent.
- Remplissage : Béton C25/30 avec armatures selon étude béton armé.`;

            // 3. CAS ITE (BRIQUE P8)
            } else if (cctpProduitVal === 'p8') {
                titreLot = "LOT FAÇADE : DOUBLE MUR BRIQUE SUR ISOLATION (ITE)";

                articleMateriaux = `
1.1 BRIQUES DE PAREMENT
Fourniture de briques de parement pleines ou perforées.
- Référence de base : Gamme BIALLAIS ${cctpNomProduit.toUpperCase()} ou équivalent technique.
- Format de coordination : 6 x 11 x 44 cm.
- Classement : P250 (Haute résistance).
- Aspect : ${cctpListeFinitions} / Teinte : ${cctpListeCouleurs}.

1.2 SYSTÈME DE FIXATION ET MORTIER
- Mortier : Type BIAMORTIER ou équivalent, hydrofugé. Teinte ${cctpNomJoint.toUpperCase()}.
- Fixations : Agrafes de liaison en acier inoxydable (Type à définir selon étude technique).
- Accessoires : Consoles de supportage en inox (si rupture de charge nécessaire).`;

                articleMiseEnOeuvre = `
2.1 MISE EN ŒUVRE DU COMPLEXE
La pose sera conforme au DTU 20.1 partie "Murs doubles".
- Lame d'air : Ventilée sur toute la hauteur (épaisseur min. 2 cm).
- Ancrage : Pose des agrafes à l'avancement (min. 5 u/m²), liaisonnées à la structure porteuse.
- Calepinage : Appareillage ${cctpNomAppareillage}, joints de ${cctpLargeurJointH} mm.`;

            // 4. CAS GÉNÉRAL (BRIQUES P4, P5, P7)
            } else {
                const epaisseur = (cctpProduitVal === 'p4') ? '22' : ((cctpProduitVal === 'p7') ? '19' : '11');
                titreLot = "LOT MAÇONNERIE : BRIQUES DE PAREMENT COMPOSITES";

                articleMateriaux = `
1.1 BRIQUES ARCHITECTONIQUES
- Référence de base : Gamme BIALLAIS ${cctpNomProduit.toUpperCase()} ou équivalent approuvé.
- Format : ${cctpDims.hauteur} x ${cctpDims.largeur} x ${epaisseur} cm.
- Caractéristiques : Garantie sans efflorescence, calibrage régulier, marquage CE.
- Finition : ${cctpListeFinitions}.
- Coloris : ${cctpListeCouleurs}.

1.2 MORTIER DE POSE
- Type : Mortier prêt à gâcher coloré, type BIAMORTIER ou équivalent.
- Spécificité : Hydrofugé dans la masse, garanti sans efflorescence de chaux.
- Teinte : ${cctpNomJoint.toUpperCase()}.`;

                articleMiseEnOeuvre = `
2.1 PRINCIPE D'EXÉCUTION
Travaux conformes au DTU 20.1.
- Calepinage : ${cctpNomAppareillage}.
- Jointoiement : Exécution "au fer" ou brossé. Épaisseur constante de ${cctpLargeurJointH} mm.

2.2 PRÉCAUTIONS ET NETTOYAGE
- Stockage : Sur palettes houssées, isolées du sol naturel.
- Intempéries : Protection obligatoire des murs en cours de séchage par bâches étanches.`;
            }

            // --- C. ASSEMBLAGE DU TEXTE CONTRACTUEL ---
            const contenuFinal = `
--------------------------------------------------------------------------------
DOCUMENT TECHNIQUE : CAHIER DES CLAUSES TECHNIQUES PARTICULIÈRES (C.C.T.P.)
PROJET : ${cctpNomProduit}
DATE D'ÉDITION : ${cctpDate}
--------------------------------------------------------------------------------

CHAPITRE 1 : ${titreLot}

1. MATÉRIAUX ET PRODUITS
Le présent lot comprend la fourniture et la mise en œuvre des matériaux décrits ci-après. 
Toute mention d'une marque commerciale est donnée à titre de référence de qualité ; l'entreprise peut proposer tout produit "équivalent" respectant les mêmes caractéristiques techniques et esthétiques.

${articleMateriaux}

2. MISE EN ŒUVRE ET PRESCRIPTIONS
L'entreprise du présent lot devra livrer les ouvrages en parfait état d'achèvement.

${articleMiseEnOeuvre}

3. ÉCHANTILLONNAGE ET VALIDATION (CLAUSE TYPE 2025)
Avant tout commencement d'exécution, l'entrepreneur soumettra à l'agrément de la Maîtrise d'Œuvre :
- Un tableau d'échantillons des produits (Teinte ${cctpListeCouleurs}, Finition ${cctpListeFinitions}).
- Un échantillon de joint (Teinte ${cctpNomJoint.toUpperCase()}) réalisé in situ ou sur maquette.
- Les Fiches de Données de Sécurité (FDS) et les Déclarations des Performances (DoP) des produits ou de leur équivalent.

4. LIMITES DE PRESTATIONS
Sont inclus au présent lot :
- La fourniture, le transport et le levage des matériaux.
- L'échafaudage et les protections nécessaires.
- Le nettoyage final du parement.

--------------------------------------------------------------------------------
Document généré via Biallais Configurator v4.6 (Export Standardisé 2025)
`;

            // --- D. CRÉATION DU FICHIER ---
            try {
                const blob = new Blob([contenuFinal], { type: "text/plain;charset=utf-8" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                const cleanName = cctpNomProduit.replace(/[^a-zA-Z0-9àâéèêëîïôùûçÀÂÉÈÊËÎÏÔÙÛÇ]/g, '_');
                link.download = `CCTP_Biallais_${cleanName}_${Date.now()}.txt`;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error("Erreur Export CCTP:", err);
                alert("Une erreur est survenue lors de la génération du document.");
            }
        });
    }

    // =========================================================
    // 15. FONCTION DE RÉINITIALISATION (RESET TOTAL)
    // =========================================================
    const btnReset = document.getElementById('btnReset');
    
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if(!confirm("Voulez-vous vraiment réinitialiser toute la configuration et revenir à zéro ?")) return;

            // 1. Réinitialiser les Sélecteurs
            if(selectAppareillage) selectAppareillage.value = 'demi-brique';
            if(selectJoint) selectJoint.selectedIndex = 0; 
            if(selectTypeJoint) selectTypeJoint.value = 'plat';
            if(selectReliefType) selectReliefType.value = 'none';
            if(selectScene) selectScene.value = 'neutre'; 

            // 2. Réinitialiser les Sliders
            if(sliderJointH) { sliderJointH.value = 10; }
            if(sliderJointV) { sliderJointV.value = 10; }
            if(sliderRoc) { sliderRoc.value = 25; }
            if(sliderReliefPercent) { sliderReliefPercent.value = 10; }
            if(zoomSlider) { zoomSlider.value = 1; zoomSlider.dispatchEvent(new Event('input')); }
            updateUIValues(); 

            // 3. Réinitialiser Produit (P1 par défaut)
            const allProducts = containerProduit.querySelectorAll('.custom-option');
            allProducts.forEach(el => el.classList.remove('selected'));
            const p1 = containerProduit.querySelector('[data-value="p1"]');
            if(p1) p1.classList.add('selected');
            updateEpaisseurText('p1');

            // 4. RÉINITIALISER COULEURS -> AUCUNE SÉLECTION
            const allColors = containerCouleur.querySelectorAll('.custom-option');
            allColors.forEach(el => el.classList.remove('selected'));
            
            if(subPaletteRouge) {
                subPaletteRouge.style.display = 'none';
                if(btnOpenRouges) {
                    btnOpenRouges.style.backgroundColor = "#ffebee";
                    btnOpenRouges.style.borderColor = "#e57373";
                }
            }

            // 5. Réinitialiser Finitions (Lisse par défaut)
            const allFinishes = containerFinition.querySelectorAll('.custom-option');
            allFinishes.forEach(el => el.classList.remove('selected', 'disabled'));
            const lisse = containerFinition.querySelector('[data-value="lisse"]');
            if(lisse) lisse.classList.add('selected');

            // 6. Nettoyer les Règles
            rulesData = [];
            renderRules(); 
            if(document.getElementById('new-line-number')) document.getElementById('new-line-number').value = '';

            // 7. Cacher les sections dynamiques
            if(containerColorDist) containerColorDist.style.display = 'none';
            if(rocDistributionWrapper) rocDistributionWrapper.style.display = 'none';
            if(containerReliefSection) containerReliefSection.style.display = 'none';
            if(containerRocOptions) containerRocOptions.style.display = 'none';
            if(msgAstuceRoc) msgAstuceRoc.style.display = 'none';

            // 8. Réinitialiser l'affichage -> RETOUR VIDÉO
            const canvasObj = document.getElementById('apercuCanvas');
            const overlayObj = document.getElementById('initial-overlay');
            const patternObj = document.getElementById('wall-pattern-layer');
            const loadingObj = document.getElementById('loading-overlay');

            if(canvasObj) canvasObj.style.display = 'none';
            if(patternObj) patternObj.style.display = 'none';
            if(loadingObj) loadingObj.classList.add('hidden');
            
            if(overlayObj) {
                overlayObj.classList.remove('hidden');
                const vid = overlayObj.querySelector('video');
                if(vid) { vid.currentTime = 0; vid.play().catch(e => console.log(e)); }
            }

            // 9. Reset Estimation
            if(userSurfaceInput) userSurfaceInput.value = '';
            document.getElementById('sum-surface').textContent = '0 m²';
            document.getElementById('sum-briques').textContent = '0';
            document.getElementById('distribution-body').innerHTML = '';
            document.getElementById('mortier-details-list').innerHTML = '';
            if(dimensionsInfoSpan) dimensionsInfoSpan.textContent = '';

            if(bouton) {
                bouton.textContent = "Mettre à jour le rendu";
                bouton.style.opacity = "1";
            }
            
            // 10. REAFFICHER LE MESSAGE D'INSTRUCTION
            updateInstructionMessage();

            validateRocConstraints();
            checkVerticalJointLimit('p1');
            updateMaxRows();
            
            if(window.innerWidth <= 900) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Appel initial au chargement pour afficher le message si besoin
    updateInstructionMessage();

});