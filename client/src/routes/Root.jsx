/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  logout,
  useGetEndpointsQuery,
  useGetPresetsQuery,
  useGetSearchEnabledQuery,
} from '@librechat/data-provider';

import MessageHandler from '../components/MessageHandler';
import MobileNav from '../components/Nav/MobileNav';
import Nav from '../components/Nav';
import { Outlet } from 'react-router-dom';
import store from '~/store';
import { useAuthContext } from '~/hooks/AuthContext';
import { useSetRecoilState } from 'recoil';
import { useMediaQuery } from 'react-responsive';
import PluginDetails from '~/components/PluginDetails';
import { useWallet } from '@solana/wallet-adapter-react';

function GiphyEmbed() {
  return (
    <div>
      <div style={{ width: '100%', height: '0', paddingBottom: '100%', position: 'relative' }}>
        <iframe
          src="https://giphy.com/embed/93YOJpS4wnMfycnslY"
          width="100%"
          height="100%"
          style={{ position: 'absolute' }}
          frameBorder="0"
          className="giphy-embed"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}

export function MyNav({ setNavVisible }) {
  const className =
    'fixed left-20 right-0 top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden';
  return (
    <div className={className}>
      <button
        type="button"
        className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-0 focus:ring-inset focus:ring-white dark:hover:text-white"
        onClick={() => setNavVisible((prev) => !prev)}
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function Root() {
  const setIsSearchEnabled = useSetRecoilState(store.isSearchEnabled);
  const setEndpointsConfig = useSetRecoilState(store.endpointsConfig);
  const setPresets = useSetRecoilState(store.presets);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const { publicKey } = useWallet();

  const { user, isAuthenticated } = useAuthContext();

  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
    return user && isAuthenticated
      ? savedNavVisible !== null
        ? JSON.parse(savedNavVisible)
        : true
      : true;
  });
  const [pluginDetailsVisible, setPluginDetailsVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('pluginDetailsVisible');
    return user && isAuthenticated
      ? savedNavVisible !== null
        ? JSON.parse(savedNavVisible)
        : true
      : true;
  });

  const searchEnabledQuery = useGetSearchEnabledQuery();
  const endpointsQuery = useGetEndpointsQuery();
  const presetsQuery = useGetPresetsQuery({ enabled: !!user });

  useEffect(() => {
    localStorage.setItem('navVisible', JSON.stringify(navVisible));
  }, [navVisible]);

  useEffect(() => {
    localStorage.setItem('pluginDetailsVisible', JSON.stringify(pluginDetailsVisible));
  }, [pluginDetailsVisible]);

  useEffect(() => {
    if (endpointsQuery.data) {
      setEndpointsConfig(endpointsQuery.data);
    } else if (endpointsQuery.isError) {
      console.error('Failed to get endpoints', endpointsQuery.error);
    }
  }, [endpointsQuery.data, endpointsQuery.isError]);

  useEffect(() => {
    if (presetsQuery.data) {
      setPresets(presetsQuery.data);
    } else if (presetsQuery.isError) {
      console.error('Failed to get presets', presetsQuery.error);
    }
  }, [presetsQuery.data, presetsQuery.isError]);

  useEffect(() => {
    if (searchEnabledQuery.data) {
      setIsSearchEnabled(searchEnabledQuery.data);
    } else if (searchEnabledQuery.isError) {
      console.error('Failed to get search enabled', searchEnabledQuery.error);
    }
  }, [searchEnabledQuery.data, searchEnabledQuery.isError]);

  useEffect(() => {
    if (!publicKey) {
      logout();
    }
  }, [publicKey]);

  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <>
      <div className="dark flex h-screen">
        <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
        <div className="flex h-full w-full flex-1 flex-col bg-gray-50">
          <div className="transition-width relative flex h-full w-full flex-1 flex-col items-stretch overflow-hidden bg-white pt-10 dark:bg-gray-800 md:pt-0">
            {isMobile ? (
              <div className="place-self-center text-white">
                <h2 className="text-5xl">Sidekick</h2>
                <span>
                  <p>Coming soon to mobile</p>
                </span>
                <GiphyEmbed />
              </div>
            ) : (
              <>
                <MobileNav setNavVisible={setNavVisible} />
                <Outlet />
                {/* <MyNav setNavVisible={setPluginDetailsVisible} /> */}
              </>
            )}
          </div>
        </div>
        <PluginDetails navVisible={pluginDetailsVisible} setNavVisible={setPluginDetailsVisible} />
      </div>
      <MessageHandler />
    </>
  );
}
