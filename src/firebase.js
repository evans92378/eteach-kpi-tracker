import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiR0sSphG1LXSDECb9QNleqNXQ8vk6Ynk",
  authDomain: "eteach-kpi-tracker.firebaseapp.com",
  databaseURL: "https://eteach-kpi-tracker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "eteach-kpi-tracker",
  storageBucket: "eteach-kpi-tracker.firebasestorage.app",
  messagingSenderId: "219418674162",
  appId: "1:219418674162:web:77c38e3f2dfdab36fa616b",
  measurementId: "G-YP72MVDLL6",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp);

export function trackerDoc(userId) {
  return doc(db, "users", userId, "trackers", "default");
}
