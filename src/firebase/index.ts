import * as Firestore from "firebase/firestore";
import { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyAm2MESceeurvTdHV5_Jcfc7H-0qUTiC70",
  authDomain: "otacc-bim-app.firebaseapp.com",
  projectId: "otacc-bim-app",
  storageBucket: "otacc-bim-app.firebasestorage.app",
  messagingSenderId: "611616624625",
  appId: "1:611616624625:web:efbbc8f21ad1f186d23e50"
};

const app = initializeApp(firebaseConfig);
export const firestoreDB = Firestore.getFirestore(app);

export function getCollection<T>(path: string) {
  return Firestore.collection(firestoreDB, path) as Firestore.CollectionReference<T>
}

export async function deleteDocument(path: string, id: string) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.updateDoc(doc, data)
}
