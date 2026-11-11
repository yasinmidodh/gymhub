import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { User, WorkoutVideo, StageRequest, MembershipStage, DailyNutritionLog } from '../types/workout';
import { 
  DEFAULT_USERS, 
  DEFAULT_VIDEOS, 
  DEFAULT_STAGE_REQUESTS,
  getStoredUsers,
  getStoredVideos,
  getStoredStageRequests,
  saveUsers,
  saveVideos,
  saveStageRequests,
  STORAGE_KEYS
} from './storage';

export interface CloudSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  cloudUsersCount: number;
  cloudVideosCount: number;
}

let syncListenersInitialized = false;

/**
 * Initializes Cloud Firestore real-time sync across devices.
 * Seeds default data to Cloud if empty, then attaches onSnapshot listeners.
 */
export async function initializeCloudSync(callbacks: {
  onUsersUpdated: (users: User[]) => void;
  onVideosUpdated: (videos: WorkoutVideo[]) => void;
  onStageRequestsUpdated: (requests: StageRequest[]) => void;
  onSyncStatusChange?: (status: { isOnline: boolean; lastSyncedAt: string }) => void;
}): Promise<boolean> {
  const isOnline = await testFirestoreConnection();
  if (!isOnline) {
    if (callbacks.onSyncStatusChange) {
      callbacks.onSyncStatusChange({ isOnline: false, lastSyncedAt: '' });
    }
    return false;
  }

  try {
    // 1. Check if Firestore already has videos and users seeded
    const usersCollection = collection(db, 'users');
    const videosCollection = collection(db, 'workoutVideos');
    const requestsCollection = collection(db, 'stageRequests');

    const [userSnap, videoSnap, reqSnap] = await Promise.all([
      getDocs(usersCollection),
      getDocs(videosCollection),
      getDocs(requestsCollection),
    ]);

    // If Firestore is empty, seed from current local storage or defaults
    if (userSnap.empty) {
      const initialUsers = getStoredUsers();
      for (const u of initialUsers) {
        await setDoc(doc(db, 'users', u.id), u);
      }
    }

    if (videoSnap.empty) {
      const initialVideos = getStoredVideos();
      for (const v of initialVideos) {
        // Strip undefined values for Firestore
        const clean: any = { ...v };
        Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
        await setDoc(doc(db, 'workoutVideos', v.id), clean);
      }
    }

    if (reqSnap.empty) {
      const initialRequests = getStoredStageRequests();
      for (const r of initialRequests) {
        const clean: any = { ...r };
        Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
        await setDoc(doc(db, 'stageRequests', r.id), clean);
      }
    }

    if (callbacks.onSyncStatusChange) {
      callbacks.onSyncStatusChange({ isOnline: true, lastSyncedAt: new Date().toLocaleTimeString() });
    }

    if (!syncListenersInitialized) {
      syncListenersInitialized = true;

      // Real-time listener for Users
      onSnapshot(usersCollection, (snapshot) => {
        if (!snapshot.empty) {
          const cloudUsers: User[] = [];
          snapshot.forEach(docSnap => cloudUsers.push(docSnap.data() as User));
          saveUsers(cloudUsers);
          callbacks.onUsersUpdated(cloudUsers);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });

      // Real-time listener for Workout Videos
      onSnapshot(videosCollection, (snapshot) => {
        if (!snapshot.empty) {
          const cloudVideos: WorkoutVideo[] = [];
          snapshot.forEach(docSnap => {
            const data: any = docSnap.data();
            delete data.youtubeUrl;
            delete data.youtubeId;
            delete data.sourceType;
            cloudVideos.push(data as WorkoutVideo);
          });
          saveVideos(cloudVideos);
          callbacks.onVideosUpdated(cloudVideos);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'workoutVideos');
      });

      // Real-time listener for Stage Requests
      onSnapshot(requestsCollection, (snapshot) => {
        const cloudRequests: StageRequest[] = [];
        snapshot.forEach(docSnap => cloudRequests.push(docSnap.data() as StageRequest));
        saveStageRequests(cloudRequests);
        callbacks.onStageRequestsUpdated(cloudRequests);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'stageRequests');
      });
    }

    return true;
  } catch (error) {
    console.warn('Cloud sync initialization notice:', error);
    return false;
  }
}

/**
 * Cloud Operations: Writes mutations directly to Firestore so other devices get instant updates.
 */

export async function cloudAddUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function cloudDeleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `users/${userId}`);
  }
}

export async function cloudUpdateUserStage(userId: string, stage: MembershipStage): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { stage }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function cloudUpdateUserPassword(userId: string, newPassword: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { password: newPassword }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function cloudAddOrUpdateVideo(video: WorkoutVideo): Promise<void> {
  try {
    const clean: any = { ...video };
    delete clean.youtubeUrl;
    delete clean.youtubeId;
    delete clean.sourceType;
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    await setDoc(doc(db, 'workoutVideos', video.id), clean);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `workoutVideos/${video.id}`);
  }
}

export async function cloudDeleteVideo(videoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'workoutVideos', videoId));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `workoutVideos/${videoId}`);
  }
}

export async function cloudSubmitStageRequest(req: StageRequest): Promise<void> {
  try {
    const clean: any = { ...req };
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    await setDoc(doc(db, 'stageRequests', req.id), clean);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `stageRequests/${req.id}`);
  }
}

export async function cloudResolveStageRequest(requestId: string, status: 'accepted' | 'rejected', adminName: string): Promise<void> {
  try {
    const reqRef = doc(db, 'stageRequests', requestId);
    await setDoc(reqRef, {
      status,
      resolvedAt: new Date().toISOString(),
      resolvedBy: adminName,
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `stageRequests/${requestId}`);
  }
}

export async function cloudSaveUserProgress(userId: string, data: {
  completedVideoIds: string[];
  recentlyWatchedIds: string[];
}): Promise<void> {
  try {
    await setDoc(doc(db, 'userProgress', userId), {
      userId,
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `userProgress/${userId}`);
  }
}

export async function cloudSaveUserWorkoutNote(userId: string, videoId: string, note: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      workoutNotes: {
        [videoId]: note,
      },
    }, { merge: true });

    // Also mirror to userProgress for resilience
    await setDoc(doc(db, 'userProgress', userId), {
      userId,
      workoutNotes: {
        [videoId]: note,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/workoutNotes`);
  }
}

export async function cloudSaveNutritionLog(log: DailyNutritionLog): Promise<void> {
  try {
    const clean: any = { ...log };
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    await setDoc(doc(db, 'nutritionLogs', log.id), clean, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `nutritionLogs/${log.id}`);
  }
}


