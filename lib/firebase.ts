// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC48RKS9EQAeZFw5gPWrIppzswEjykulQU",
  authDomain: "pdf-iq-bdaf3.firebaseapp.com",
  projectId: "pdf-iq-bdaf3",
  storageBucket: "pdf-iq-bdaf3.firebasestorage.app",
  messagingSenderId: "974226009650",
  appId: "1:974226009650:web:0f5fb94cc93f64cb69d62b",
  measurementId: "G-JJ0W72XSYM"
};

// Initialize Firebase app only if it hasn't been initialized yet
let app;
let auth;
let db;
let storage;

// Only initialize on client side
if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize Firestore with persistence
  try {
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
    
    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('This browser does not support offline persistence');
      }
    });
  } catch (e) {
    console.warn('Firestore initialization error', e);
    db = getFirestore(app);
  }
  
  // Initialize auth with persistence
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
  
  storage = getStorage(app);
}

// Authentication functions
const signInUser = async (email: string, password: string) => {
  try {
    if (!auth) throw new Error('Auth not initialized');
    
    // Set persistence and then sign in
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Ensure user data is available offline
    if (userCredential.user) {
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Error signing in:", error);
    let errorMessage = 'Failed to sign in. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          // Check if we have cached user data
          if (auth.currentUser) {
            return auth.currentUser;
          }
          break;
      }
    }
    
    const errorWithMessage = new Error(errorMessage);
    errorWithMessage.name = error.code || 'auth/unknown';
    throw errorWithMessage;
  }
};

const signUpUser = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Firestore functions
const addUser = async (userId: string, userData: any) => {
  try {
    await setDoc(doc(db, "users", userId), userData);
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

const getUserData = async (userId: string) => {
  if (!db) {
    console.warn('Firestore not initialized');
    return null;
  }

  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No user document found, creating one...");
      // If no document exists but user is authenticated, create one
      if (auth?.currentUser) {
        const userData = {
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        };
        
        try {
          await setDoc(docRef, userData, { merge: true });
          return userData;
        } catch (writeError) {
          console.warn('Error creating user document:', writeError);
          // Return the data anyway, it will be saved when online
          return userData;
        }
      }
      return null;
    }
  } catch (error: any) {
    console.error("Error getting user data:", error);
    
    // If we're offline and have a current user, return basic user data
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Offline mode: Using cached user data');
      if (auth?.currentUser) {
        return {
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
          _cached: true // Indicate this is cached data
        };
      }
    }
    
    // For other errors, rethrow with more context
    const errorWithMessage = new Error('Failed to fetch user data');
    errorWithMessage.name = error.code || 'firestore/unknown';
    throw errorWithMessage;
  }
};

const savePDFInfo = async (userId: string, pdfData: any) => {
  try {
    const docRef = await addDoc(collection(db, "users", userId, "pdfs"), {
      ...pdfData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving PDF info:", error);
    // Check if it's an offline error and handle appropriately
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Client is offline, data will sync when connection is restored');
    }
    throw error;
  }
};

const getUserPDFs = async (userId: string) => {
  try {
    const q = query(
      collection(db, "users", userId, "pdfs"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const pdfs: any[] = [];
    querySnapshot.forEach((doc) => {
      pdfs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return pdfs;
  } catch (error) {
    console.error("Error getting user PDFs:", error);
    // Check if it's an offline error and handle appropriately
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Client is offline, unable to fetch user PDFs');
    }
    throw error;
  }
};

// Storage functions
const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export {
  app,
  auth,
  db,
  storage,
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
  addUser,
  getUserData,
  savePDFInfo,
  getUserPDFs,
  uploadFile,
  deleteFile
};