import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [token, setToken] = useState(null);
  
  const redirectUri = 'https://auth.expo.io/@sudharsun/etracker-drive';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '902213081693-1verjjh0t88jic13mmpnfsbpgt2dakt6.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    redirectUri,
  });

  useEffect(() => {
    if (request) {
      console.log('Request URL:', request.url);
      console.log('Request redirectUri:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === 'success') {
      setToken(response.authentication?.accessToken);
      console.log('Auth successful!');
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      console.error('Error params:', response.params);
    }
  }, [response]);

  return { token, request, promptAsync };
};