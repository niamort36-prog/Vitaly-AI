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

// ==========================================
// 2. GESTION DE L'AUTHENTIFICATION (MODAL)
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

authBtn.addEventListener('click', () => {
    if (auth.currentUser) signOut(auth); 
    else authModal.classList.add('active'); 
});
closeModal.addEventListener('click', () => authModal.classList.remove('active'));

toggleModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    modalTitle.textContent = isLoginMode ? "Connexion" : "Inscription";
    authSubmitBtn.textContent = isLoginMode ? "Se connecter" : "S'inscrire";
    toggleModeBtn.textContent = isLoginMode ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter";
    authError.textContent = "";
});

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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authBtn.textContent = "Se déconnecter";
        authBtn.classList.replace("btn-outline", "btn-secondary");
        userEmailDisplay.textContent = user.email;
        userEmailDisplay.style.display = "inline";

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
        }
    } else {
        authBtn.textContent = "Se connecter";
        authBtn.classList.replace("btn-secondary", "btn-outline");
        userEmailDisplay.style.display = "none";
        
        famille = []; afficherFamille();
        inventaire = []; afficherFrigo();
        document.getElementById('profilForm').reset();
        document.getElementById('profilDisplay').innerHTML = `<h3>Mes Données Actuelles</h3><p><em>Remplissez le formulaire pour afficher vos données ici.</em></p>`;
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
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

// ==========================================
// 4. LOGIQUE DU PROFIL 
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

        profilDisplay.innerHTML = `
            <h3>Mes Données Actuelles</h3>
            <p><strong>Clé API :</strong> ${apiKey ? '✅ Enregistrée' : '❌ Manquante'}</p>
            <p><strong>Poids :</strong> ${poids ? poids + ' kg' : 'Non renseigné'}</p>
            <p><strong>Objectif :</strong> ${objectif}</p>
            <p><strong>Précision :</strong> ${precision}</p>
            <p><strong>Soucis de santé :</strong> ${sante}</p>
            <p><strong>Matériel :</strong> ${materiel}</p>
        `;

        sauvegarderDonnees("profil", { apiKey, poids, objectif, precision, sante, materiel });
        alert("Profil sauvegardé avec succès !");
    });
}

// ==========================================
// 5. LOGIQUE FAMILLE & INVENTAIRE
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
// 6. INTÉGRATION API GEMINI (LE CERVEAU)
// ==========================================

// Fonction générique pour appeler l'API
async function appelerGemini(promptText, resultContainerId) {
    const apiKey = document.getElementById('inputApiKey').value;
    const container = document.getElementById(resultContainerId);

    if (!apiKey) {
        alert("Veuillez renseigner et enregistrer votre clé API Gemini dans l'onglet Profil !");
        return;
    }

    container.style.display = "block";
    container.innerHTML = "<p><em>L'IA réfléchit à votre demande... ⏳</em></p>";

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
        
        // Formatage basique (transformer le Markdown en HTML pour l'affichage)
        resultatTexte = resultatTexte.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Gras
        resultatTexte = resultatTexte.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italique
        resultatTexte = resultatTexte.replace(/\n/g, '<br>'); // Sauts de ligne

        container.innerHTML = `<div style="line-height: 1.6; padding: 10px;">${resultatTexte}</div>`;

    } catch (error) {
        container.innerHTML = `<p style="color: #E74C3C;"><strong>Erreur :</strong> ${error.message}</p>`;
    }
}

// Bouton Générer Alimentation
const btnGenerateNutrition = document.getElementById('btnGenerateNutrition');
if (btnGenerateNutrition) {
    btnGenerateNutrition.addEventListener('click', () => {
        const objectif = document.getElementById('inputObjectif').value;
        const precision = document.getElementById('inputPrecision').value;
        const requeteIA = document.getElementById('inputRequeteIA').value;
        
        // Construction du contexte pour l'IA
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

        appelerGemini(prompt, 'menuResult');
    });
}
