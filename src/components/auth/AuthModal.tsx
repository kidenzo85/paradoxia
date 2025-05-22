import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      console.log('Attempting Google sign in...');
      await signInWithGoogle();
      console.log('Google sign in successful');
      onClose();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error?.code === 'auth/popup-blocked') {
        setMessage('Le popup a été bloqué. Veuillez autoriser les popups pour vous connecter.');
      } else {
        setMessage('Une erreur est survenue lors de la connexion avec Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Veuillez entrer votre email');
      return;
    }
    try {
      setIsLoading(true);
      setMessage('');
      await signInWithEmail(email);
      setMessage('Un lien de connexion a été envoyé à votre email');
      setTimeout(onClose, 3000);
    } catch (error) {
      setMessage("Une erreur est survenue lors de l'envoi du lien");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">Se connecter</h2>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Continuer avec Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Chargement...' : 'Recevoir un lien magique'}
            </button>
          </form>

          {message && (
            <p className={`text-sm text-center ${
              message.includes('erreur') ? 'text-red-600' : 'text-green-600'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}