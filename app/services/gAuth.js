import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [token, setToken] = useState(null);

  const useProxy = Platform.OS !== 'web';

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '581076316369-60fna26mnmsmipt2m9bqjc00h9qgpau0.apps.googleusercontent.com',
    webClientId: '581076316369-nigghvi2i316q2mrr8kgf58nfbco2q0i.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'etrackerdrive',
      useProxy,
    }),
  });

  console.log('Redirect URI:', AuthSession.makeRedirectUri({ scheme: 'etrackerdrive', useProxy }));

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
