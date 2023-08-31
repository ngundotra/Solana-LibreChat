/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
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

export default function Root() {
  const setIsSearchEnabled = useSetRecoilState(store.isSearchEnabled);
  const setEndpointsConfig = useSetRecoilState(store.endpointsConfig);
  const setPresets = useSetRecoilState(store.presets);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const { user, isAuthenticated } = useAuthContext();

  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
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
              </>
            )}
          </div>
        </div>
      </div>
      <MessageHandler />
    </>
  );
}
