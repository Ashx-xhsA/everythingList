import { collection, doc, setDoc, onSnapshot, getDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { Task, Settings } from './types';

export const signInAnon = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const credential = await signInAnonymously(auth);
          resolve(credential.user);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
};

export const registerWithEmail = async (email: string, pass: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  return credential.user;
};

export const loginWithEmail = async (email: string, pass: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
};

export const logout = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const collectionRef = collection(db, `users/${userId}/tasks`);
  return onSnapshot(collectionRef, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    callback(tasks);
  });
};

export const syncTaskToFirestore = async (userId: string, task: Task) => {
  const docRef = doc(db, `users/${userId}/tasks/${task.id}`);
  await setDoc(docRef, { ...task, updatedAt: Date.now() }, { merge: true });
};

export const syncTasksToFirestore = async (userId: string, tasks: Task[]) => {
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const docRef = doc(db, `users/${userId}/tasks/${task.id}`);
    batch.set(docRef, { ...task, updatedAt: Date.now() }, { merge: true });
  });
  await batch.commit();
};

export const deleteTaskFromFirestore = async (userId: string, taskId: string) => {
  const docRef = doc(db, `users/${userId}/tasks/${taskId}`);
  await deleteDoc(docRef);
};

export const subscribeToSettings = (userId: string, callback: (settings: Settings | null) => void) => {
  const docRef = doc(db, `users/${userId}/settings/main`);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Settings);
    } else {
      callback(null);
    }
  });
};

export const syncSettingsToFirestore = async (userId: string, settings: Settings) => {
  const docRef = doc(db, `users/${userId}/settings/main`);
  await setDoc(docRef, { ...settings, updatedAt: Date.now() }, { merge: true });
};
