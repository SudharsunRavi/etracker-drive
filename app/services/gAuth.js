import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [token, setToken] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '426757242953-b20uakod4tsckudlh35o7qg27tj0ks2m.apps.googleusercontent.com',
    iosClientId: 'dummy-ios.apps.googleusercontent.com',
    androidClientId: 'dummy-android.apps.googleusercontent.com',
    webClientId: '426757242953-b20uakod4tsckudlh35o7qg27tj0ks2m.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setToken(response.authentication.accessToken);
    }
  }, [response]);

  return { token, request, promptAsync };
};
