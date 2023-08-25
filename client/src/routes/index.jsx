import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Root from './Root';
import Chat from './Chat';
import Search from './Search';
import { Login, Registration, RequestPasswordReset, ResetPassword } from '../components/Auth';
import { AuthContextProvider } from '../hooks/AuthContext';
import ApiErrorWatcher from '../components/Auth/ApiErrorWatcher';

import { useGetStartupConfig } from '@librechat/data-provider';

import { useMemo, useCallback } from 'react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

import { useAuthContext } from '../hooks/AuthContext.tsx';

// TODO(@ngundotra): Remove the non-SIWS wallets for now
const WalletLayout = () => {
  const { data: config } = useGetStartupConfig();
  const { loginWallet } = useAuthContext();

  const endpoint = useMemo(() => {
    return config?.heliusRpcUrl ?? clusterApiUrl(WalletAdapterNetwork.Mainnet);
  }, [config]);

  const autoSignIn = useCallback(
    async (adapter) => {
      // If the signIn feature is not available, return true
      if (!('signIn' in adapter)) {
        console.log({ adapter });
        // let output = await adapter.signMessage(input);
        // console.log({ output });
        return true;
      }

      // Fetch the signInInput from the backend
      let createResponse;
      try {
        createResponse = await fetch('/api/auth/siwsCreate', {
          method: 'POST',
        });
      } catch (e) {
        console.error(e);
        return false;
      }

      const input = await createResponse.json();

      // Send the signInInput to the wallet and trigger a sign-in request
      const output = await adapter.signIn(input);

      // Verify the sign-in output against the generated input server-side
      let strPayload = {
        input: JSON.stringify(input),
        output: JSON.stringify({
          account: {
            address: output.account.address,
            publicKey: Array.from(output.account.publicKey),
          },
          signature: Array.from(output['signature']),
          signedMessage: Array.from(output['signedMessage']),
        }),
      };

      loginWallet(strPayload);

      return false;
    },
    [loginWallet],
  );

  const onError = (error, adapter) => {
    console.error(error);
    console.error({ adapter });
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={autoSignIn} onError={onError}>
        <WalletModalProvider>
          <Outlet />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const AuthLayout = () => (
  <AuthContextProvider>
    <WalletLayout>
      <Outlet />
    </WalletLayout>
    <ApiErrorWatcher />
  </AuthContextProvider>
);

export const router = createBrowserRouter([
  {
    path: 'register',
    element: <Registration />,
  },
  {
    path: 'forgot-password',
    element: <RequestPasswordReset />,
  },
  {
    path: 'reset-password',
    element: <ResetPassword />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: '/',
        element: <Root />,
        children: [
          {
            index: true,
            element: <Navigate to="/chat/new" replace={true} />,
          },
          {
            path: 'chat/:conversationId?',
            element: <Chat />,
          },
          {
            path: 'search/:query?',
            element: <Search />,
          },
        ],
      },
    ],
  },
]);
