import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

const BACKEND_AUTH_URL = 'https://nonimitational-unsympathisingly-sharleen.ngrok-free.dev/auth/google';
const REDIRECT_SCHEME = 'etrackerdrive://auth';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const promptAsync = async () => {
    setLoading(true);
    try {
      // Listen for redirect back to your app
      const result = await WebBrowser.openAuthSessionAsync(BACKEND_AUTH_URL, REDIRECT_SCHEME);

      if (result.type === 'success' && result.url) {
        // Extract token from the redirect URL: e.g. etrackerdrive://auth?token=XYZ
        const { queryParams } = Linking.parse(result.url);
        const accessToken = queryParams.token;
        if (accessToken) {
          await SecureStore.setItemAsync('etracker_access_token', accessToken);
          setToken(accessToken);
        }
      }
    } catch (err) {
      console.error('OAuth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { token, loading, promptAsync };
};
