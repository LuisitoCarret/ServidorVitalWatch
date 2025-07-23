import admin from "firebase-admin";
import serviceAccount from "./firebase/serviceAccountKey.json";

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
export { db };
