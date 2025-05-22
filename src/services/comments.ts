import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  getDoc,
  DocumentData
} from 'firebase/firestore';
import { getAuth, User } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

interface UserData {
  displayName: string;
  [key: string]: any;
}

export interface Comment {
  id: string;
  factId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    displayName: string;
  };
}

export async function getComments(factId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('factId', '==', factId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const comments: Comment[] = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      // Récupérer les informations de l'utilisateur
      const userRef = doc(db, 'users', data.userId);
      const userSnapshot = await getDoc(userRef);
      const userData = userSnapshot.data() as UserData | undefined;

      comments.push({
        id: docSnapshot.id,
        factId: data.factId,
        userId: data.userId,
        content: data.content,
        createdAt: data.createdAt.toDate().toISOString(),
        user: {
          displayName: userData?.displayName || 'Utilisateur inconnu'
        }
      });
    }

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function createComment(factId: string, content: string): Promise<Comment | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const commentData = {
      factId,
      userId: user.uid,
      content,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    const newDocSnapshot = await getDoc(docRef);
    const data = newDocSnapshot.data()!;

    // Récupérer les informations de l'utilisateur
    const userRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);
    const userData = userSnapshot.data() as UserData | undefined;

    return {
      id: docRef.id,
      factId: data.factId,
      userId: data.userId,
      content: data.content,
      createdAt: data.createdAt.toDate().toISOString(),
      user: {
        displayName: userData?.displayName || 'Utilisateur inconnu'
      }
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
}

export async function updateComment(id: string, content: string): Promise<Comment | null> {
  try {
    const commentRef = doc(db, 'comments', id);
    await updateDoc(commentRef, { 
      content,
      updatedAt: Timestamp.now()
    });

    const updatedDocSnapshot = await getDoc(commentRef);
    const data = updatedDocSnapshot.data()!;

    // Récupérer les informations de l'utilisateur
    const userRef = doc(db, 'users', data.userId);
    const userSnapshot = await getDoc(userRef);
    const userData = userSnapshot.data() as UserData | undefined;

    return {
      id: updatedDocSnapshot.id,
      factId: data.factId,
      userId: data.userId,
      content: data.content,
      createdAt: data.createdAt.toDate().toISOString(),
      user: {
        displayName: userData?.displayName || 'Utilisateur inconnu'
      }
    };
  } catch (error) {
    console.error('Error updating comment:', error);
    return null;
  }
}

export async function deleteComment(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'comments', id));
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}