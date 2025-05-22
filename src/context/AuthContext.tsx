import { createContext, useContext, useEffect, useState } from 'react';
import {
  Auth,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export interface CustomUser extends FirebaseUser {
  isAdmin?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  handleEmailSignIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state listener');
    
    const db = getFirestore();

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Check admin status in Firestore
        const userDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
        const customUser: CustomUser = firebaseUser;
        customUser.isAdmin = userDoc.exists();
        
        console.log('AuthProvider: Auth state changed', {
          user: {
            email: customUser.email,
            uid: customUser.uid,
            isAdmin: customUser.isAdmin
          }
        });
        
        setUser(customUser);
      } else {
        console.log('AuthProvider: User signed out');
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('AuthProvider: Auth state error', error);
      setLoading(false);
    });

    // Check for email sign-in when the component mounts
    if (isSignInWithEmailLink(auth, window.location.href)) {
      console.log('AuthProvider: Detected email sign-in link');
      handleEmailSignIn();
    }

    return () => {
      console.log('AuthProvider: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in process...');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      console.log('Configured Google provider, starting popup...');
      await signInWithPopup(auth, provider);
      console.log('Popup completed successfully');
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('Error signing in with Google:', error?.code, error?.message);
      throw error;
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.error('Error sending sign-in link:', error);
      throw error;
    }
  };

  const handleEmailSignIn = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation') || '';
        }
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        setShowAuthModal(false);
        // Remove the email sign-in URL parameters from the URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Error signing in with email link:', error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    showAuthModal,
    setShowAuthModal,
    signInWithGoogle,
    signInWithEmail,
    handleEmailSignIn,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}