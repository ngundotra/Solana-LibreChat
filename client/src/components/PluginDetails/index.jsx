import { useMemo } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';

import { Panel } from '~/components';
import { cn } from '~/utils/';
import store from '~/store';
import { usePluginDetailsQuery } from '@librechat/data-provider';
import SolanaPay from '../Messages/SolanaPay';

function capitalizeFirstLetterOfEachWord(str) {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const PLUGIN_EXAMPLES = {
  solana: [
    'Who is the owner of toly.sol?',
    'What is the address for USDC?',
    'How much is my wallet worth?',
  ],
  tiplink: ['Make me a tiplink'],
  hellomoon: [
    'How many wallets used Jupiter in the last day?',
    'How many USDC to Sol on Jupiter this week?',
  ],
};

export default function PluginDetails({ navVisible, setNavVisible }) {
  const setText = useSetRecoilState(store.text);
  const [conversation] = useRecoilState(store.conversation) || {};
  const toggleNavVisible = () => {
    setNavVisible((prev) => !prev);
  };

  let tool = null;
  if (conversation && conversation.tools) {
    tool = conversation.tools[0];
  }

  const moreDescriptionInfo = usePluginDetailsQuery({ pluginKey: tool && tool.pluginKey }).data;

  const examples = useMemo(() => {
    if (tool && tool.pluginKey) {
      return PLUGIN_EXAMPLES[tool && tool.pluginKey];
    }
    return [];
  }, [tool]);

  const clickHandler = (e) => {
    e.preventDefault();
    const { innerText } = e.target;
    const quote = innerText.split('"')[1].trim();
    setText(quote);
  };

  return (
    <>
      <div
        className="nav active bg-sidekickgray-200 dark flex-shrink-0 overflow-x-hidden transition-all duration-200 ease-in-out"
        style={{
          width: navVisible ? '390px' : '0px',
          visibility: navVisible ? 'visible' : 'hidden',
        }}
      >
        <div className="h-full w-[390px]">
          <div className="flex h-full min-h-0 flex-col ">
            <div className="scrollbar-trigger relative flex h-full w-full flex-1 items-start border-white/20">
              <nav className="relative flex h-full flex-1 flex-col space-y-1 p-2">
                <div className="my-1 text-center text-3xl text-gray-300">
                  <span>User Guide</span>
                </div>
                <div className="mb-2 flex h-11 flex-row text-gray-300">
                  <button
                    type="button"
                    className={cn(
                      'nav-close-button inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/20 text-white hover:bg-gray-500/10',
                    )}
                    onClick={toggleNavVisible}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <Panel open={false} />
                  </button>
                  <div className="mx-auto my-2 flex text-center text-xl text-white">
                    {tool ? tool.name : ''}
                  </div>
                  {tool && (
                    <div className="my-auto">
                      <img src={tool ? tool.icon : ''} height={36} width={36} />
                    </div>
                  )}
                </div>
                {moreDescriptionInfo && (
                  <div className="mx-auto pt-5">
                    <span className="text-center text-xl text-white">{'Description'}</span>
                  </div>
                )}
                {moreDescriptionInfo && moreDescriptionInfo.description && (
                  <div className="py-4 text-left text-sm text-gray-300">
                    <span>{moreDescriptionInfo.description}</span>
                  </div>
                )}
                {examples && examples.length > 0 && (
                  <>
                    <div className="mx-auto">
                      <span className="text-center text-xl text-white">{'Examples'}</span>
                    </div>
                    <ol className="list-disc pl-4 text-sm text-gray-300">
                      {examples.map((el, idx) => (
                        <li className="" key={idx}>
                          <button
                            onClick={clickHandler}
                            className="w-full rounded-md p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            &quot;{el}&quot; →
                          </button>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                {moreDescriptionInfo && (
                  <div className="mx-auto pt-4">
                    <span className="text-center text-xl text-white">{'Functionality'}</span>
                  </div>
                )}
                {moreDescriptionInfo &&
                  moreDescriptionInfo.openAIFunctions &&
                  moreDescriptionInfo.openAIFunctions.map((el, idx) => (
                    <div className="py-1 text-left text-gray-300" key={idx}>
                      <div className="text-md text-white">
                        <span>{capitalizeFirstLetterOfEachWord(el.name.replaceAll('_', ' '))}</span>
                      </div>
                      <div className="ml-2 text-sm">
                        <span>{el.description}</span>
                      </div>
                    </div>
                  ))}
                {!moreDescriptionInfo && (
                  <div className="text-left text-gray-300">
                    <div className="text-center text-xl">
                      <span>Welcome to Sidekick!</span>
                    </div>
                    <div className="pt-4 text-left">
                      <div className="text-sm">
                        {/* eslint-disable-next-line max-len */}
                        <span>
                          With Sidekick, you can interpret Solana transactions, explore on-chain
                          activity with HelloMoon, mint cNFTs and more!
                        </span>
                      </div>
                      <div className="text-md pt-4">
                        <span>Getting Started</span>
                      </div>
                      <ol className="list-decimal pl-3 text-sm">
                        <li className="pb-1">
                          {
                            'Sign in with your wallet on the bottom-left by clicking "Select Wallet".'
                          }
                        </li>
                        <li className="pb-1">
                          Once you have signed in, you should see your address in the bottom left.
                        </li>
                        <li className="pb-1">
                          Choose a plugin from the dropdown above the chat to see its functionality.
                        </li>
                        {/* eslint-disable-next-line max-len */}
                        <li className="pb-1">
                          Start a conversation with a plugin enabled by typing in the textbox at the
                          bottom of the screen.
                        </li>
                        {/* eslint-disable-next-line max-len */}
                        <li className="pb-1">
                          If the AI detects it can use your selected plugin in the conversation, it
                          will automatically use the plugin to assist you
                        </li>
                        <li className="pb-1">
                          {/* eslint-disable-next-line max-len */}
                          If the AI creates a transaction for you, a button on the left of the
                          message may be shown. You can click to simulate & then execute the
                          transaction with your wallet.
                          <div className="flex pt-1">
                            Example:
                            <SolanaPay disabled={true} className="px-3" />
                          </div>
                        </li>
                      </ol>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
      {!navVisible && (
        <div className="absolute right-2 top-2 z-10 hidden md:inline-block">
          <button
            type="button"
            className="nav-open-button flex h-11 cursor-pointer items-center gap-3 rounded-md border border-black/10 bg-white p-3 text-sm text-black transition-colors duration-200 hover:bg-gray-50 dark:border-white/20 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            onClick={toggleNavVisible}
          >
            <div className="flex items-center justify-center">
              <span className="sr-only">Open sidebar</span>
              <Panel open={true} />
            </div>
          </button>
        </div>
      )}

      <div className={'nav-mask' + (navVisible ? ' active' : '')} onClick={toggleNavVisible}></div>
    </>
  );
}
