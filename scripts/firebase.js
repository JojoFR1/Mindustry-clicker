import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBqSpyAzIMq3Fc6J70H18K67t58H9T1Nbc",
    authDomain: "mindustry-clicker.firebaseapp.com",
    projectId: "mindustry-clicker",
    storageBucket: "mindustry-clicker.firebasestorage.app",
    messagingSenderId: "369757871561",
    appId: "1:369757871561:web:bb1b3b40d01e4a9bca5c18",
    measurementId: "G-RKFHWCNEZ7"
};

let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase inicializado correctamente.");
} catch (e) {
    console.error("Firebase no se pudo inicializar (revisa tus credenciales):", e);
}

// Reconocimiento Pasivo (ID Único Falso de Hardware)
function getOrSetUserId() {
    let uid = localStorage.getItem('mindustryClickerCloudID');
    if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('mindustryClickerCloudID', uid);
    }
    return uid;
}

window.saveToCloud = async function (username, saveDataObj, score) {
    if (!db) return false;
    const uid = getOrSetUserId();

    const docRef = doc(db, "jugadores", uid);
    const payload = {
        username: username || "Comandante Anónimo",
        score: score || 0, // En este caso, será el Cobre
        data: saveDataObj,
        lastOnline: new Date().getTime() // última conexión
    };

    try {
        await setDoc(docRef, payload);
        console.log("¡Partida subida a la nube exitosamente!");
        return true;
    } catch (e) {
        console.error("Error al subir a la nube: ", e);
        return false;
    }
};

window.loadFromCloud = async function () {
    if (!db) return null;
    const uid = getOrSetUserId();
    const docRef = doc(db, "jugadores", uid);

    try {
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            console.log("Partida descargada de la nube exitosamente");
            return snapshot.data().data;
        } else {
            console.log("Partida en la nube no encontrada para tu sesion actual.");
            return null;
        }
    } catch (e) {
        console.error("Error bajando datos de la nube: ", e);
        return null;
    }
};

window.getGlobalLeaderboard = async function () {
    if (!db) return [];

    try {
        const ref = collection(db, "jugadores");
        // Filtrar a los mejores 10, de mayor a menor cobre
        const q = query(ref, orderBy("score", "desc"), limit(10));
        const snapshots = await getDocs(q);

        const topPlayers = [];
        snapshots.forEach((doc) => {
            const data = doc.data();
            topPlayers.push({
                username: data.username,
                score: data.score,
                payload: data.data // Exportamos todo el estado de la partida para desglosarlo
            });
        });
        return topPlayers;
    } catch (e) {
        console.error("Error leyendo Leaderboard: ", e);
        return [];
    }
};
