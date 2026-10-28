import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { InspectionFormData } from '../types';

const COLLECTION_NAME = 'inspections';

export async function saveInspectionToFirestore(inspection: InspectionFormData): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return; // If unauthenticated, saved locally

  const path = `${COLLECTION_NAME}/${inspection.id}`;
  try {
    const docData = {
      ...inspection,
      userId: currentUser.uid,
      userEmail: currentUser.email || '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, COLLECTION_NAME, inspection.id), docData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserInspections(
  userId: string,
  onUpdate: (records: InspectionFormData[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: InspectionFormData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as InspectionFormData;
        records.push(data);
      });
      onUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      if (onError) onError(error);
    }
  );
}

export async function deleteInspectionFromFirestore(id: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
