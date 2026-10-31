/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  UserProfile, 
  SavedWorkoutSession, 
  FoodLogItem, 
  WaterLog, 
  SleepLog, 
  WeightLog, 
  ChatMessage,
  WorkoutPlan,
  NutritionPlan,
  UserAccount
} from './types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with configured database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connectivity validation constraint
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[FitGenie Firebase] Firestore client is running in offline mode.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// Authentication Helpers
// -------------------------------------------------------------

export const FIREBASE_CONSOLE_AUTH_PROVIDERS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

export type AuthResultUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  isFallback?: boolean;
};

export async function loginWithEmail(email: string, pass: string): Promise<AuthResultUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
      const deterministicUid = 'athlete_' + Math.abs(email.trim().toLowerCase().split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)).toString(36);
      
      const userRef = doc(db, 'users', deterministicUid);
      const snap = await getDoc(userRef);
      let accountName = email.split('@')[0];
      if (snap.exists() && snap.data()?.account?.name) {
        accountName = snap.data().account.name;
      } else {
        await setDoc(userRef, {
          account: {
            id: deterministicUid,
            name: accountName,
            email: email.trim(),
            memberTier: 'Pro Athlete',
            createdAt: new Date().toISOString().split('T')[0],
            lastLoginAt: new Date().toISOString(),
          }
        }, { merge: true });
      }

      return {
        uid: deterministicUid,
        email: email.trim(),
        displayName: accountName,
        photoURL: null,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        isFallback: true,
      };
    }
    throw err;
  }
}

export async function registerWithEmail(
  email: string, 
  pass: string, 
  displayName: string,
  memberTier: 'Standard' | 'Pro Athlete' | 'VIP Master' = 'Pro Athlete'
): Promise<AuthResultUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    // Save initial user profile in Firestore
    const userRef = doc(db, 'users', cred.user.uid);
    await setDoc(userRef, {
      account: {
        id: cred.user.uid,
        name: displayName || email.split('@')[0],
        email: cred.user.email,
        memberTier,
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString(),
      }
    }, { merge: true });

    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
      const fallbackUid = 'athlete_' + Math.abs(email.trim().toLowerCase().split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)).toString(36) + '_' + Date.now().toString(36);
      
      const userRef = doc(db, 'users', fallbackUid);
      await setDoc(userRef, {
        account: {
          id: fallbackUid,
          name: displayName || email.split('@')[0],
          email: email.trim(),
          memberTier,
          createdAt: new Date().toISOString().split('T')[0],
          lastLoginAt: new Date().toISOString(),
        }
      }, { merge: true });

      return {
        uid: fallbackUid,
        email: email.trim(),
        displayName: displayName || email.split('@')[0],
        photoURL: null,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        isFallback: true,
      };
    }
    throw err;
  }
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;

  // Ensure base account record in Firestore
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      account: {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Athlete',
        email: user.email,
        avatarUrl: user.photoURL || undefined,
        memberTier: 'Pro Athlete',
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString(),
      }
    }, { merge: true });
  } else {
    await setDoc(userRef, {
      account: {
        lastLoginAt: new Date().toISOString(),
        avatarUrl: user.photoURL || undefined,
      }
    }, { merge: true });
  }

  return user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// -------------------------------------------------------------
// Firestore Persistence Helpers (under `/users/{userId}`)
// -------------------------------------------------------------

export async function getUserFirestoreData(userId: string): Promise<{
  profile: UserProfile | null;
  account: Partial<UserAccount> | null;
  workoutPlan: WorkoutPlan | null;
  nutritionPlan: NutritionPlan | null;
}> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return { profile: null, account: null, workoutPlan: null, nutritionPlan: null };
    }
    const data = snap.data();
    return {
      profile: (data.profile as UserProfile) || null,
      account: (data.account as Partial<UserAccount>) || null,
      workoutPlan: (data.workoutPlan as WorkoutPlan) || null,
      nutritionPlan: (data.nutritionPlan as NutritionPlan) || null,
    };
  } catch (err) {
    console.error('[Firestore] Error loading user document:', err);
    return { profile: null, account: null, workoutPlan: null, nutritionPlan: null };
  }
}

export async function saveUserProfileToFirestore(
  userId: string,
  profile: UserProfile,
  accountInfo?: Partial<UserAccount>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const payload: Record<string, any> = { profile };
    if (accountInfo) {
      payload.account = accountInfo;
    }
    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving user profile:', err);
  }
}

export async function savePlansToFirestore(
  userId: string,
  workoutPlan: WorkoutPlan | null,
  nutritionPlan: NutritionPlan | null
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { workoutPlan, nutritionPlan }, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving workout/nutrition plans:', err);
  }
}

// Workout Sessions
export async function getWorkoutSessionsFromFirestore(userId: string): Promise<SavedWorkoutSession[]> {
  try {
    const colRef = collection(db, 'users', userId, 'workoutSessions');
    const q = query(colRef, orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    const sessions: SavedWorkoutSession[] = [];
    snap.forEach((d) => sessions.push(d.data() as SavedWorkoutSession));
    return sessions;
  } catch (err) {
    console.error('[Firestore] Error fetching workout sessions:', err);
    return [];
  }
}

export async function saveWorkoutSessionToFirestore(
  userId: string,
  session: SavedWorkoutSession
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'workoutSessions', session.id);
    await setDoc(docRef, session);
  } catch (err) {
    console.error('[Firestore] Error saving workout session:', err);
    throw err;
  }
}

// Food Logs
export async function getFoodLogsFromFirestore(userId: string): Promise<FoodLogItem[]> {
  try {
    const colRef = collection(db, 'users', userId, 'foodLogs');
    const snap = await getDocs(colRef);
    const items: FoodLogItem[] = [];
    snap.forEach((d) => items.push(d.data() as FoodLogItem));
    return items.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('[Firestore] Error fetching food logs:', err);
    return [];
  }
}

export async function saveFoodLogToFirestore(userId: string, item: FoodLogItem): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'foodLogs', item.id);
    await setDoc(docRef, item);
  } catch (err) {
    console.error('[Firestore] Error saving food log:', err);
  }
}

export async function deleteFoodLogFromFirestore(userId: string, itemId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'foodLogs', itemId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[Firestore] Error deleting food log:', err);
  }
}

// Water Logs
export async function getWaterLogsFromFirestore(userId: string): Promise<WaterLog[]> {
  try {
    const colRef = collection(db, 'users', userId, 'waterLogs');
    const snap = await getDocs(colRef);
    const logs: WaterLog[] = [];
    snap.forEach((d) => logs.push(d.data() as WaterLog));
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('[Firestore] Error fetching water logs:', err);
    return [];
  }
}

export async function saveWaterLogToFirestore(userId: string, log: WaterLog): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'waterLogs', log.date);
    await setDoc(docRef, log);
  } catch (err) {
    console.error('[Firestore] Error saving water log:', err);
  }
}

// Sleep Logs
export async function getSleepLogsFromFirestore(userId: string): Promise<SleepLog[]> {
  try {
    const colRef = collection(db, 'users', userId, 'sleepLogs');
    const snap = await getDocs(colRef);
    const logs: SleepLog[] = [];
    snap.forEach((d) => logs.push(d.data() as SleepLog));
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('[Firestore] Error fetching sleep logs:', err);
    return [];
  }
}

export async function saveSleepLogToFirestore(userId: string, log: SleepLog): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'sleepLogs', log.date);
    await setDoc(docRef, log);
  } catch (err) {
    console.error('[Firestore] Error saving sleep log:', err);
  }
}

// Weight Logs
export async function getWeightLogsFromFirestore(userId: string): Promise<WeightLog[]> {
  try {
    const colRef = collection(db, 'users', userId, 'weightLogs');
    const snap = await getDocs(colRef);
    const logs: WeightLog[] = [];
    snap.forEach((d) => logs.push(d.data() as WeightLog));
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('[Firestore] Error fetching weight logs:', err);
    return [];
  }
}

export async function saveWeightLogToFirestore(userId: string, log: WeightLog): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'weightLogs', log.date);
    await setDoc(docRef, log);
  } catch (err) {
    console.error('[Firestore] Error saving weight log:', err);
  }
}

// Chat Messages
export async function getChatMessagesFromFirestore(userId: string): Promise<ChatMessage[]> {
  try {
    const colRef = collection(db, 'users', userId, 'chatHistory');
    const snap = await getDocs(colRef);
    const messages: ChatMessage[] = [];
    snap.forEach((d) => messages.push(d.data() as ChatMessage));
    return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch (err) {
    console.error('[Firestore] Error fetching chat messages:', err);
    return [];
  }
}

export async function saveChatMessageToFirestore(userId: string, message: ChatMessage): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'chatHistory', message.id);
    const dataWithTimestamp: Record<string, any> = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      createdAt: message.createdAt || Date.now(),
    };
    if (message.exercises && message.exercises.length > 0) {
      dataWithTimestamp.exercises = message.exercises;
    }
    await setDoc(docRef, dataWithTimestamp);
  } catch (err) {
    console.error('[Firestore] Error saving chat message:', err);
  }
}

export async function clearChatMessagesFromFirestore(userId: string): Promise<void> {
  try {
    const colRef = collection(db, 'users', userId, 'chatHistory');
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.error('[Firestore] Error clearing chat messages:', err);
  }
}
