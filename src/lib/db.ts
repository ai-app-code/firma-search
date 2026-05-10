import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";

// Firm Operations
export const saveFirm = async (firm: any) => {
  const path = "firms";
  try {
    const firmsRef = collection(db, path);
    return await addDoc(firmsRef, {
      ...firm,
      foundAt: serverTimestamp(),
      status: "yeni"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getFirms = async () => {
  const path = "firms";
  try {
    const querySnapshot = await getDocs(collection(db, path));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

// Note Operations
export const addNote = async (firmId: string, content: string) => {
  const path = `firms/${firmId}/notes`;
  try {
    const notesRef = collection(db, "firms", firmId, "notes");
    return await addDoc(notesRef, {
      content,
      date: serverTimestamp(),
      author: "Admin"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Task Operations
export const addTask = async (city: string) => {
  const path = "tasks";
  try {
    return await addDoc(collection(db, path), {
      city,
      status: "bekliyor",
      lastChecked: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
