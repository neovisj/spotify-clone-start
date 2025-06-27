// pages/SpotifyCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/pkce';

const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const runCallback = async (code) => {
      try {
        await getToken(code);
        // Redirect user after login
        navigate('/dashboard');
      } catch (error) {
        console.error('Error handling Spotify callback:', error);
        // Redirect to login on error
        navigate('/login');
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (error) {
      console.error('Spotify authorization error:', error);
      navigate('/login');
      return;
    }

    if (!code || !codeVerifier) {
      console.warn('Missing code or code_verifier');
      navigate('/login');
      return;
    }

    runCallback(code);
  }, [navigate]);

  return <p>Logging you in...</p>;
};

export default SpotifyCallback;