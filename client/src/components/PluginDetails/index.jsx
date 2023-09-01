import { useRecoilState } from 'recoil';

import { Panel } from '~/components';
import { cn } from '~/utils/';
import store from '~/store';
import { usePluginDetailsQuery } from '@librechat/data-provider';

export default function PluginDetails({ navVisible, setNavVisible }) {
  const [conversation] = useRecoilState(store.conversation) || {};
  const toggleNavVisible = () => {
    setNavVisible((prev) => !prev);
  };

  let tool = null;
  if (conversation && conversation.tools) {
    tool = conversation.tools[0];
  }

  const moreDescriptionInfo = usePluginDetailsQuery({ pluginKey: tool && tool.pluginKey }).data;

  return (
    <>
      <div
        className="nav active bg-sidekickgray-200 dark flex-shrink-0 overflow-x-hidden transition-all duration-200 ease-in-out"
        style={{
          width: navVisible ? '260px' : '0px',
          visibility: navVisible ? 'visible' : 'hidden',
        }}
      >
        <div className="h-full w-[260px]">
          <div className="flex h-full min-h-0 flex-col ">
            <div className="scrollbar-trigger relative flex h-full w-full flex-1 items-start border-white/20">
              <nav className="relative flex h-full flex-1 flex-col space-y-1 p-2">
                <div className="my-1 text-center text-3xl text-gray-300">
                  <span>Plugin Details</span>
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
                  <div className="mx-5 my-2 flex text-center">
                    {tool ? tool.name : 'Select a plugin to begin'}
                  </div>
                  {tool && (
                    <div className="my-auto">
                      <img src={tool ? tool.icon : ''} height={36} width={36} />
                    </div>
                  )}
                </div>
                {moreDescriptionInfo && moreDescriptionInfo.description && (
                  <div className="py-4 text-left text-sm text-gray-300">
                    <span>{moreDescriptionInfo.description}</span>
                  </div>
                )}
                {moreDescriptionInfo &&
                  moreDescriptionInfo.openAIFunctions &&
                  moreDescriptionInfo.openAIFunctions.map((el, idx) => (
                    <div className="py-1 text-left text-gray-300" key={idx}>
                      <div className="text-md text-white">
                        <span>{el.name}</span>
                      </div>
                      <div className="ml-2 text-xs">
                        <span>{el.description}</span>
                      </div>
                    </div>
                  ))}
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
