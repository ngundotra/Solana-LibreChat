import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useRecoilValue } from 'recoil';
import SearchBar from './SearchBar';
import Settings from './Settings';
import { Download } from 'lucide-react';
import NavLink from './NavLink';
import ExportModel from './ExportConversation/ExportModel';
import ClearConvos from './ClearConvos';
import Logout from './Logout';
import { useAuthContext } from '~/hooks/AuthContext';
import { cn, shortenName } from '~/utils/';

import store from '~/store';
import { LinkIcon, DotsIcon, GearIcon, TrashIcon } from '~/components';
import { WalletMultiButton } from '@librechat/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
// import { useWallet } from '@solana/wallet-adapter-react';

export default function NavLinks({ clearSearch, isSearchEnabled }) {
  const [showExports, setShowExports] = useState(false);
  const [showClearConvos, setShowClearConvos] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuthContext();
  // const { connected, signMessage } = useWallet();

  const conversation = useRecoilValue(store.conversation) || {};

  const exportable =
    conversation?.conversationId &&
    conversation?.conversationId !== 'new' &&
    conversation?.conversationId !== 'search';

  const clickHandler = () => {
    if (exportable) {
      setShowExports(true);
    }
  };

  // useEffect(() => {
  //   async function signStuff() {
  //     if (connected) {
  //       let createResponse;
  //       try {
  //         createResponse = await fetch('/api/auth/siwsCreate', {
  //           method: 'POST',
  //         });
  //       } catch (e) {
  //         console.error(e);
  //       }
  //       const input = await createResponse.json();
  //       console.log({ input });
  //       let output = await signMessage(input);
  //       console.log({ output });
  //     }
  //   };
  //   signStuff();
  // }, [connected]);

  if (!user) {
    return <WalletMultiButton />;
  }

  return (
    <>
      <Menu as="div" className="group relative">
        {({ open }) => (
          <>
            <Menu.Button
              className={cn(
                'group-ui-open:bg-gray-800 flex w-full items-center gap-2.5 rounded-md px-3 py-3 text-sm transition-colors duration-200 hover:bg-gray-800',
                open ? 'bg-gray-800' : '',
              )}
            >
              <>
                <div className="-ml-0.5 h-5 w-5 flex-shrink-0">
                  <div className="relative flex">
                    <img
                      className="rounded-sm"
                      src={
                        user?.avatar ||
                        `https://api.dicebear.com/6.x/initials/svg?seed=${
                          user?.name || 'User'
                        }&fontFamily=Verdana&fontSize=36`
                      }
                      alt=""
                    />
                  </div>
                </div>
                <div className="grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-white">
                  {shortenName(user?.name)}
                </div>
                <DotsIcon />
              </>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute bottom-full left-0 z-20 mb-2 w-full translate-y-0 overflow-hidden rounded-md bg-[#050509] py-1.5 opacity-100 outline-none">
                {isSearchEnabled && (
                  <Menu.Item>
                    <SearchBar clearSearch={clearSearch} />
                  </Menu.Item>
                )}
                <Menu.Item as="div">
                  <NavLink
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700',
                      exportable ? 'cursor-pointer text-white' : 'cursor-not-allowed text-white/50',
                    )}
                    svg={() => <Download size={16} />}
                    text="Export conversation"
                    clickHandler={clickHandler}
                  />
                </Menu.Item>
                <div className="my-1.5 h-px bg-white/20" role="none" />
                <Menu.Item as="div">
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <TrashIcon />}
                    text="Clear conversations"
                    clickHandler={() => setShowClearConvos(true)}
                  />
                </Menu.Item>
                <Menu.Item as="div">
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <LinkIcon />}
                    text="Help & FAQ"
                    clickHandler={() => window.open('https://docs.librechat.ai/', '_blank')}
                  />
                </Menu.Item>
                <Menu.Item as="div">
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <GearIcon />}
                    text="Settings"
                    clickHandler={() => setShowSettings(true)}
                  />
                </Menu.Item>
                <div className="my-1.5 h-px bg-white/20" role="none" />
                <Menu.Item as="div">
                  <Logout />
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
      {showExports && <ExportModel open={showExports} onOpenChange={setShowExports} />}
      {showClearConvos && <ClearConvos open={showClearConvos} onOpenChange={setShowClearConvos} />}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
    </>
  );
}
