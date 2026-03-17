// ==========================================
// 1. CONFIGURATION FIREBASE & FIRESTORE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnbjzBx8wWH3kp6V8Tw6n7uMhgTrxEal8",
  authDomain: "vitality-ai-dfec5.firebaseapp.com",
  projectId: "vitality-ai-dfec5",
  storageBucket: "vitality-ai-dfec5.firebasestorage.app",
  messagingSenderId: "253299743623",
  appId: "1:253299743623:web:f4864baf6a7cce92131122"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function sauvegarderDonnees(champ, donnees) {
    if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, { [champ]: donnees }, { merge: true });
    }
}

const h4Placeholder = document.querySelector('#programContainer h4');
if (h4Placeholder && h4Placeholder.textContent.includes('Lundi')) {
    const optionsDate = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('fr-FR', optionsDate);
    h4Placeholder.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// ==========================================
// 2. GESTION DE L'AUTHENTIFICATION
// ==========================================
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const authForm = document.getElementById('authForm');
const toggleModeBtn = document.getElementById('toggleAuthMode');
const modalTitle = document.getElementById('modalTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authError = document.getElementById('authError');
const userEmailDisplay = document.getElementById('userEmailDisplay');

let isLoginMode = true;

if (authBtn) {
    authBtn.addEventListener('click', () => {
        if (auth.currentUser) signOut(auth); 
        else authModal.classList.add('active'); 
    });
}
if (closeModal) closeModal.addEventListener('click', () => authModal.classList.remove('active'));

if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        modalTitle.textContent = isLoginMode ? "Connexion" : "Inscription";
        authSubmitBtn.textContent = isLoginMode ? "Se connecter" : "S'inscrire";
        toggleModeBtn.textContent = isLoginMode ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter";
        authError.textContent = "";
    });
}

if (authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        authError.textContent = "";

        if (isLoginMode) {
            signInWithEmailAndPassword(auth, email, password)
                .then(() => { authModal.classList.remove('active'); authForm.reset(); })
                .catch(error => authError.textContent = "Erreur : Email ou mot de passe incorrect.");
        } else {
            createUserWithEmailAndPassword(auth, email, password)
                .then(() => { authModal.classList.remove('active'); authForm.reset(); })
                .catch(error => authError.textContent = "Erreur : " + error.message);
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (authBtn) {
            authBtn.textContent = "Se déconnecter";
            authBtn.classList.replace("btn-outline", "btn-secondary");
        }
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email;
            userEmailDisplay.style.display = "inline";
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            if(data.profil) {
                document.getElementById('inputApiKey').value = data.profil.apiKey || '';
                document.getElementById('inputPoids').value = data.profil.poids || '';
                document.getElementById('inputObjectif').value = data.profil.objectif || 'Perte de poids';
                document.getElementById('inputPrecision').value = data.profil.precision || '';
                document.getElementById('inputSante').value = data.profil.sante || '';
                document.getElementById('inputMateriel').value = data.profil.materiel || '';
                
                document.getElementById('profilDisplay').innerHTML = `
                    <h3>Mes Données Actuelles</h3>
                    <p><strong>Poids :</strong> ${data.profil.poids ? data.profil.poids + ' kg' : 'Non renseigné'}</p>
                    <p><strong>Objectif :</strong> ${data.profil.objectif}</p>
                    <p><strong>Précision :</strong> ${data.profil.precision || 'Aucune précision'}</p>
                    <p><strong>Soucis de santé :</strong> ${data.profil.sante || 'Aucun signalement'}</p>
                    <p><strong>Matériel :</strong> ${data.profil.materiel || 'Aucun matériel'}</p>
                `;
            }

            if(data.famille) { famille = data.famille; afficherFamille(); }
            if(data.inventaire) { inventaire = data.inventaire; afficherFrigo(); }
            if(data.historique) { historique = data.historique; afficherHistorique(); }
            
            if(data.workoutProgram) {
                const pc = document.getElementById('programContainer');
                if(pc) pc.innerHTML = data.workoutProgram;
            }
            if(data.nutritionMenu) {
                const mr = document.getElementById('menuResult');
                if(mr) mr.innerHTML = data.nutritionMenu;
            }
        }
    } else {
        if (authBtn) {
            authBtn.textContent = "Se connecter";
            authBtn.classList.replace("btn-secondary", "btn-outline");
        }
        if (userEmailDisplay) userEmailDisplay.style.display = "none";
        
        famille = []; afficherFamille();
        inventaire = []; afficherFrigo();
        historique = {}; afficherHistorique();
        const profilFormEl = document.getElementById('profilForm');
        if (profilFormEl) profilFormEl.reset();
        const profilDisplayEl = document.getElementById('profilDisplay');
        if (profilDisplayEl) profilDisplayEl.innerHTML = `<h3>Mes Données Actuelles</h3><p><em>Remplissez le formulaire pour afficher vos données ici.</em></p>`;
        
        const pc = document.getElementById('programContainer');
        if (pc) {
            pc.innerHTML = `
                <div class="week-section">
                    <h3>Semaine 1 - Actuelle</h3>
                    <div class="card">
                        <h4>Lundi</h4>
                        <ul class="checklist">
                            <li>
                                <input type="checkbox" id="s1j1_ex1"> <label for="s1j1_ex1">Échauffement articulaire (5 min)</label>
                                <details class="ex-details">
                                    <summary>Voir les détails</summary>
                                    <p><strong>Description :</strong> Rotations douces de la tête, des épaules, des poignets, du bassin et des chevilles.</p>
                                    <p><a href="https://www.youtube.com/results?search_query=echauffement+articulaire+complet" target="_blank">📺 Vidéo YouTube</a></p>
                                </details>
                            </li>
                        </ul>
                    </div>
                </div>`;
            const h4 = pc.querySelector('h4');
            if (h4 && h4.textContent.includes('Lundi')) {
                const optionsDate = { weekday: 'long', day: 'numeric', month: 'long' };
                const dateStr = new Date().toLocaleDateString('fr-FR', optionsDate);
                h4.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            }
        }
        const mr = document.getElementById('menuResult');
        if (mr) mr.innerHTML = `<p><em>Vos menus de la semaine et votre liste de courses s'afficheront ici...</em></p>`;
    }
});

// ==========================================
// 3. LOGIQUE DE NAVIGATION
// ==========================================
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.getAttribute('data-target'));
        if (target) target.classList.add('active');
        
        if(btn.getAttribute('data-target') === 'history') {
            afficherHistorique();
        }
    });
});

// ==========================================
// 4. LOGIQUE DE L'HISTORIQUE (Navigation & Filtres)
// ==========================================
let historique = {}; 
let weightChartInstance = null; 

// Variables pour la navigation dans le temps
let currentViewMode = 'month'; // 'week', 'month', 'year', 'all'
let currentDateRef = new Date(); // Date de référence pour l'affichage

// Outil pour convertir proprement en string locale YYYY-MM-DD
function toLocalISOString(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date - offset)).toISOString().split('T')[0];
}

// Calcule la date de début et de fin selon le mode choisi
function getPeriodRange(mode, refDate) {
    const start = new Date(refDate);
    const end = new Date(refDate);
    if (mode === 'week') {
        const day = start.getDay() || 7; 
        start.setDate(start.getDate() - day + 1); 
        start.setHours(0,0,0,0);
        end.setDate(start.getDate() + 6); 
        end.setHours(23,59,59,999);
    } else if (mode === 'month') {
        start.setDate(1);
        start.setHours(0,0,0,0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23,59,59,999);
    } else if (mode === 'year') {
        start.setMonth(0, 1);
        start.setHours(0,0,0,0);
        end.setMonth(11, 31);
        end.setHours(23,59,59,999);
    }
    return { start, end };
}

// Met à jour le texte qui indique la période (ex: "Mars 2026")
function updatePeriodLabel() {
    const labelEl = document.getElementById('historyPeriodLabel');
    if (!labelEl) return;
    if (currentViewMode === 'all') {
        labelEl.textContent = "Historique Complet";
        return;
    }
    const { start, end } = getPeriodRange(currentViewMode, currentDateRef);
    if (currentViewMode === 'week') {
        labelEl.textContent = `Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    } else if (currentViewMode === 'month') {
        let text = start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        labelEl.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    } else if (currentViewMode === 'year') {
        labelEl.textContent = start.getFullYear();
    }
}

// Fonction principale pour dessiner l'historique filtré
function afficherHistorique() {
    const allDates = Object.keys(historique).sort(); 
    let filteredDates = allDates;

    // Filtrer les dates en fonction du mode (sauf si "all")
    if (currentViewMode !== 'all') {
        const { start, end } = getPeriodRange(currentViewMode, currentDateRef);
        const startStr = toLocalISOString(start);
        const endStr = toLocalISOString(end);
        filteredDates = allDates.filter(d => d >= startStr && d <= endStr);
    }

    updatePeriodLabel();
    
    // Graphique
    const ctx = document.getElementById('weightChart');
    if (ctx) {
        const labels = [];
        const dataPoids = [];
        
        filteredDates.forEach(date => {
            if (historique[date].poids) {
                // Pour faire plus joli, on affiche "JJ/MM" au lieu de "YYYY-MM-DD"
                const parts = date.split('-');
                labels.push(`${parts[2]}/${parts[1]}`);
                dataPoids.push(historique[date].poids);
            }
        });

        if (weightChartInstance) {
            weightChartInstance.destroy();
        }

        weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Évolution du Poids (kg)',
                    data: dataPoids,
                    borderColor: '#2ECC71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3 
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: false } 
                }
            }
        });
    }

    // Liste des exercices
    const listContainer = document.getElementById('exerciseHistoryList');
    if (listContainer) {
        if (filteredDates.length === 0) {
            listContainer.innerHTML = '<p><em>Aucun historique pour cette période.</em></p>';
            return;
        }

        let html = '';
        [...filteredDates].reverse().forEach(date => {
            const exos = historique[date].exercices || [];
            if (exos.length > 0) {
                // Convertit YYYY-MM-DD en vraie date FR
                const dateObj = new Date(date);
                let dateFr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                dateFr = dateFr.charAt(0).toUpperCase() + dateFr.slice(1);

                html += `<h4 style="color: var(--primary-color); border-bottom: 1px solid #eee; padding-bottom: 5px;">📅 ${dateFr}</h4><ul class="checklist">`;
                exos.forEach(ex => html += `<li>✅ ${ex}</li>`);
                html += `</ul>`;
            }
        });
        
        listContainer.innerHTML = html || '<p><em>Aucun exercice validé pour cette période.</em></p>';
    }
}

// Événements pour les boutons Précédent/Suivant et le Menu déroulant
const btnPrevPeriod = document.getElementById('btnPrevPeriod');
const btnNextPeriod = document.getElementById('btnNextPeriod');
const historyViewMode = document.getElementById('historyViewMode');

if (historyViewMode) {
    historyViewMode.addEventListener('change', (e) => {
        currentViewMode = e.target.value;
        currentDateRef = new Date(); // Remet à aujourd'hui quand on change de vue
        afficherHistorique();
    });
}

if (btnPrevPeriod) {
    btnPrevPeriod.addEventListener('click', () => {
        if (currentViewMode === 'week') currentDateRef.setDate(currentDateRef.getDate() - 7);
        else if (currentViewMode === 'month') currentDateRef.setMonth(currentDateRef.getMonth() - 1);
        else if (currentViewMode === 'year') currentDateRef.setFullYear(currentDateRef.getFullYear() - 1);
        afficherHistorique();
    });
}

if (btnNextPeriod) {
    btnNextPeriod.addEventListener('click', () => {
        if (currentViewMode === 'week') currentDateRef.setDate(currentDateRef.getDate() + 7);
        else if (currentViewMode === 'month') currentDateRef.setMonth(currentDateRef.getMonth() + 1);
        else if (currentViewMode === 'year') currentDateRef.setFullYear(currentDateRef.getFullYear() + 1);
        afficherHistorique();
    });
}

const programContainer = document.getElementById('programContainer');
if (programContainer) {
    programContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const today = toLocalISOString(new Date()); 
            const nomExercice = e.target.nextElementSibling.textContent; 

            if (!historique[today]) historique[today] = { exercices: [] };
            if (!historique[today].exercices) historique[today].exercices = [];

            if (e.target.checked) {
                e.target.setAttribute('checked', 'checked'); 
                if (!historique[today].exercices.includes(nomExercice)) {
                    historique[today].exercices.push(nomExercice);
                }
            } else {
                e.target.removeAttribute('checked'); 
                historique[today].exercices = historique[today].exercices.filter(ex => ex !== nomExercice);
            }

            sauvegarderDonnees("historique", historique);
            sauvegarderDonnees("workoutProgram", programContainer.innerHTML);
            afficherHistorique();
        }
    });
}

// ==========================================
// 5. LOGIQUE DU PROFIL 
// ==========================================
const profilForm = document.getElementById('profilForm');
const profilDisplay = document.getElementById('profilDisplay');

if (profilForm) {
    profilForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const apiKey = document.getElementById('inputApiKey').value;
        const poids = document.getElementById('inputPoids').value;
        const objectif = document.getElementById('inputObjectif').value;
        const precision = document.getElementById('inputPrecision').value || 'Aucune précision';
        const sante = document.getElementById('inputSante').value || 'Aucun signalement';
        const materiel = document.getElementById('inputMateriel').value || 'Aucun matériel';

        if (profilDisplay) {
            profilDisplay.innerHTML = `
                <h3>Mes Données Actuelles</h3>
                <p><strong>Clé API :</strong> ${apiKey ? '✅ Enregistrée' : '❌ Manquante'}</p>
                <p><strong>Poids :</strong> ${poids ? poids + ' kg' : 'Non renseigné'}</p>
                <p><strong>Objectif :</strong> ${objectif}</p>
                <p><strong>Précision :</strong> ${precision}</p>
                <p><strong>Soucis de santé :</strong> ${sante}</p>
                <p><strong>Matériel :</strong> ${materiel}</p>
            `;
        }

        sauvegarderDonnees("profil", { apiKey, poids, objectif, precision, sante, materiel });
        
        if (poids) {
            const today = toLocalISOString(new Date());
            if (!historique[today]) historique[today] = { exercices: [] };
            historique[today].poids = parseFloat(poids);
            sauvegarderDonnees("historique", historique);
            afficherHistorique();
        }

        alert("Profil sauvegardé avec succès !");
    });
}

// ==========================================
// 6. LOGIQUE FAMILLE & INVENTAIRE
// ==========================================
const familleForm = document.getElementById('familleForm');
const familleList = document.getElementById('familleList');
let famille = []; 

if (familleForm) {
    familleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const membre = document.getElementById('inputMembre').value;
        const besoins = document.getElementById('inputBesoins').value || 'Aucun';
        famille.push({ membre, besoins });
        document.getElementById('inputMembre').value = '';
        document.getElementById('inputBesoins').value = '';
        document.getElementById('inputMembre').focus();
        afficherFamille();
        sauvegarderDonnees("famille", famille);
    });
}

function afficherFamille() {
    if (!familleList) return;
    if (famille.length === 0) {
        familleList.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;"><em>Aucun membre ajouté.</em></td></tr>';
        return;
    }
    familleList.innerHTML = ''; 
    famille.forEach((item, index) => {
        familleList.innerHTML += `<tr><td>${item.membre}</td><td>${item.besoins}</td><td style="text-align: center;"><button class="btn-icon" onclick="window.modifierFamille(${index})">✏️</button><button class="btn-icon" onclick="window.supprimerFamille(${index})">❌</button></td></tr>`;
    });
}

window.supprimerFamille = function(index) { famille.splice(index, 1); afficherFamille(); sauvegarderDonnees("famille", famille); };
window.modifierFamille = function(index) {
    const nouveauxBesoins = prompt(`Nouveaux besoins pour ${famille[index].membre} :`, famille[index].besoins);
    if (nouveauxBesoins !== null && nouveauxBesoins.trim() !== '') {
        famille[index].besoins = nouveauxBesoins; afficherFamille(); sauvegarderDonnees("famille", famille);
    }
};

const frigoForm = document.getElementById('frigoForm');
const frigoList = document.getElementById('frigoList');
let inventaire = []; 

if (frigoForm) {
    frigoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const aliment = document.getElementById('inputAliment').value;
        const quantite = document.getElementById('inputQuantite').value;
        inventaire.push({ aliment, quantite });
        document.getElementById('inputAliment').value = '';
        document.getElementById('inputQuantite').value = '';
        document.getElementById('inputAliment').focus();
        afficherFrigo();
        sauvegarderDonnees("inventaire", inventaire);
    });
}

function afficherFrigo() {
    if (!frigoList) return;
    if (inventaire.length === 0) {
        frigoList.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;"><em>Votre frigo est vide.</em></td></tr>';
        return;
    }
    frigoList.innerHTML = ''; 
    inventaire.forEach((item, index) => {
        frigoList.innerHTML += `<tr><td>${item.aliment}</td><td>${item.quantite}</td><td style="text-align: center;"><button class="btn-icon" onclick="window.modifierAliment(${index})">✏️</button><button class="btn-icon" onclick="window.supprimerAliment(${index})">❌</button></td></tr>`;
    });
}

window.supprimerAliment = function(index) { inventaire.splice(index, 1); afficherFrigo(); sauvegarderDonnees("inventaire", inventaire); };
window.modifierAliment = function(index) {
    const nouvelleQuantite = prompt(`Nouvelle quantité pour ${inventaire[index].aliment} :`, inventaire[index].quantite);
    if (nouvelleQuantite !== null && nouvelleQuantite.trim() !== '') {
        inventaire[index].quantite = nouvelleQuantite; afficherFrigo(); sauvegarderDonnees("inventaire", inventaire);
    }
};

// ==========================================
// 7. INTÉGRATION API GEMINI (LE CERVEAU)
// ==========================================

async function appelerGemini(promptText, resultContainerId, isHTML = false, storageKey = null) {
    const apiKeyInput = document.getElementById('inputApiKey');
    if (!apiKeyInput) return;
    const apiKey = apiKeyInput.value;
    const container = document.getElementById(resultContainerId);
    if (!container) return;

    if (!apiKey) {
        alert("Veuillez renseigner et enregistrer votre clé API Gemini dans l'onglet Profil !");
        return;
    }

    container.style.display = "block";
    container.innerHTML = "<p><em>L'IA conçoit votre demande sur mesure... ⏳</em></p>";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) throw new Error("Erreur de communication avec l'IA. Vérifiez votre clé API.");

        const data = await response.json();
        let resultatTexte = data.candidates[0].content.parts[0].text;
        
        if (isHTML) {
            const htmlMatch = resultatTexte.match(/```html\s*([\s\S]*?)\s*```/);
            if (htmlMatch) {
                resultatTexte = htmlMatch[1]; 
            } else {
                const fallbackMatch = resultatTexte.match(/```\s*([\s\S]*?)\s*```/);
                if (fallbackMatch) {
                    resultatTexte = fallbackMatch[1];
                }
            }
            container.innerHTML = resultatTexte;
        } else {
            resultatTexte = resultatTexte.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
            resultatTexte = resultatTexte.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
            resultatTexte = resultatTexte.replace(/\n/g, '<br>'); 
            
            resultatTexte = `<div style="line-height: 1.6; padding: 10px;">${resultatTexte}</div>`;
            container.innerHTML = resultatTexte;
        }

        if (storageKey) {
            sauvegarderDonnees(storageKey, resultatTexte);
        }

    } catch (error) {
        container.innerHTML = `<p style="color: #E74C3C;"><strong>Erreur :</strong> ${error.message}</p>`;
    }
}

const btnGenerateWorkout = document.getElementById('btnGenerateWorkout');
if (btnGenerateWorkout) {
    btnGenerateWorkout.addEventListener('click', (e) => {
        e.preventDefault(); 
        const poids = document.getElementById('inputPoids').value;
        const objectif = document.getElementById('inputObjectif').value;
        const precision = document.getElementById('inputPrecision').value;
        const sante = document.getElementById('inputSante').value;
        const materiel = document.getElementById('inputMateriel').value;
        const requeteWorkout = document.getElementById('inputRequeteWorkout').value;

        const optionsDate = { weekday: 'long', day: 'numeric', month: 'long' };
        const dateAujourdHui = new Date().toLocaleDateString('fr-FR', optionsDate);
        const dateAujourdHuiMaj = dateAujourdHui.charAt(0).toUpperCase() + dateAujourdHui.slice(1);

        let prompt = `Tu es un coach sportif expert.\nAujourd'hui nous sommes le ${dateAujourdHuiMaj}.\nVoici mon profil actuel :\n- Poids : ${poids ? poids + ' kg' : 'Non renseigné'}\n- Objectif principal : ${objectif}\n`;
        if (precision) prompt += `- Précision sur l'objectif : ${precision}\n`;
        if (sante) prompt += `- Soucis de santé / Douleurs à prendre en compte : ${sante}\n`;
        if (materiel) prompt += `- Matériel à disposition : ${materiel}\n`;

        prompt += `\nMa demande d'entraînement ou d'ajustement est la suivante : ${requeteWorkout || 'Génère-moi un programme sportif adapté.'}\n`;
        
        prompt += `\nIMPORTANT ET OBLIGATOIRE : Tu dois répondre EXCLUSIVEMENT avec du code HTML formaté exactement comme ceci. NE METS AUCUN TEXTE d'introduction ou de conclusion, JUSTE LE CODE HTML. Commence le programme à partir d'aujourd'hui et affiche le jour ET la date exacte dans la balise <h4> (par exemple <h4>${dateAujourdHuiMaj}</h4>) pour chaque jour généré :
<div class="week-section">
    <h3>Semaine 1 - Actuelle</h3>
    <div class="card">
        <h4>${dateAujourdHuiMaj}</h4>
        <ul class="checklist">
            <li>
                <input type="checkbox" id="gen_s1_j1_ex1"> 
                <label for="gen_s1_j1_ex1">Nom de l'exercice (Séries x Répétitions)</label>
                <details class="ex-details">
                    <summary>Voir les détails</summary>
                    <p><strong>Description :</strong> Courte description de l'exécution.</p>
                    <p><a href="https://www.youtube.com/results?search_query=nom+exercice" target="_blank">📺 Voir une vidéo d'exemple sur YouTube</a></p>
                </details>
            </li>
        </ul>
    </div>
</div>
Veille à générer des IDs uniques pour chaque checkbox (ex: gen_s1_j2_ex2).`;

        appelerGemini(prompt, 'programContainer', true, 'workoutProgram');
    });
}

const btnGenerateNutrition = document.getElementById('btnGenerateNutrition');
if (btnGenerateNutrition) {
    btnGenerateNutrition.addEventListener('click', (e) => {
        e.preventDefault();
        const objectif = document.getElementById('inputObjectif').value;
        const precision = document.getElementById('inputPrecision').value;
        const requeteIA = document.getElementById('inputRequeteIA').value;
        
        let prompt = `Tu es un diététicien expert. Mon objectif principal est : ${objectif} (${precision}).\n`;
        
        if (famille.length > 0) {
            prompt += `Voici la composition de ma famille et leurs besoins spécifiques : \n`;
            famille.forEach(f => prompt += `- ${f.membre} (Besoins : ${f.besoins})\n`);
        }

        if (inventaire.length > 0) {
            prompt += `\nVoici ce que j'ai actuellement dans mon frigo/placard :\n`;
            inventaire.forEach(i => prompt += `- ${i.aliment} (${i.quantite})\n`);
        }

        prompt += `\nMa demande spécifique est : ${requeteIA || 'Propose-moi un menu équilibré pour la semaine.'}\n`;
        prompt += `\nÀ partir de ces informations, génère : \n1. Un menu pour chaque jour de la semaine (matin, midi, soir).\n2. Une liste de courses stricte pour compléter ce qui me manque dans mon inventaire afin de réaliser ces repas. Formate ta réponse de manière claire.`;

        appelerGemini(prompt, 'menuResult', false, 'nutritionMenu');
    });
}
