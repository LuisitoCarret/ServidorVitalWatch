import admin from "firebase-admin";

const firebaseConfig = process.env.FIREBASE_CONFIG;

// ✅ Agrega este log para ver si llegó correctamente
console.log("📦 FIREBASE_CONFIG:", firebaseConfig);

const serviceAccount = JSON.parse(firebaseConfig);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
export { db };
