import React, { useState, useCallback, memo, ReactNode } from 'react';
import { Spinner } from '~/components';
import { useRecoilValue } from 'recoil';
import CodeBlock from './Content/CodeBlock.jsx';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, LucideProps } from 'lucide-react';
import { cn } from '~/utils/';
import store from '~/store';

interface Input {
  inputStr: string;
}

interface PluginProps {
  plugin: {
    plugin: string;
    input: string;
    loading?: boolean;
    method?: string;
    output?: string;
    // Old fields
    // thought: string;
    // latest?: string;
    // inputs?: Input[];
  };
}

type PluginsMap = {
  [pluginKey: string]: string;
};

type PluginIconProps = LucideProps & {
  className?: string;
};

const Plugin: React.FC<PluginProps> = ({ plugin }) => {
  const [loading, setLoading] = useState(plugin.output ? false : true);
  const finished = plugin.output ? true : false;
  const plugins: PluginsMap = useRecoilValue(store.plugins);

  const getPluginName = useCallback(
    (pluginKey: string) => {
      if (!pluginKey) {
        return null;
      }

      if (pluginKey === 'n/a' || pluginKey === 'self-reflection') {
        return pluginKey;
      }
      return plugins[pluginKey] ?? 'self-reflection';
    },
    [plugins],
  );

  if (!plugin) {
    return null;
  }

  const latestPlugin = getPluginName(plugin.plugin);

  if (!latestPlugin || (latestPlugin && latestPlugin === 'n/a')) {
    return null;
  }

  if (finished && loading) {
    setLoading(false);
  }

  const generateStatus = (): ReactNode => {
    if (latestPlugin === 'self-reflection') {
      return 'I\'m  thinking...';
    } else {
      return (
        <>
          {loading ? 'Using' : 'Used'} <b>{latestPlugin}</b>
          {loading ? '...' : ''}
        </>
      );
    }
  };

  return (
    <div className="flex flex-col items-start">
      <Disclosure>
        {({ open }) => {
          const iconProps: PluginIconProps = {
            className: cn(open ? 'rotate-180 transform' : '', 'h-4 w-4'),
          };
          return (
            <>
              <div
                className={cn(
                  loading ? 'bg-green-100' : 'bg-[#ECECF1]',
                  'flex items-center rounded p-3 text-sm text-gray-900',
                )}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div>{generateStatus()}</div>
                  </div>
                </div>
                {loading && <Spinner className="ml-1" />}
                <Disclosure.Button className="ml-12 flex items-center gap-2">
                  <ChevronDownIcon {...iconProps} />
                </Disclosure.Button>
              </div>

              <Disclosure.Panel className="my-3 flex max-w-full flex-col gap-3">
                <CodeBlock
                  lang={latestPlugin?.toUpperCase() || 'INPUT'}
                  codeChildren={plugin.input ?? (plugin as any).inputStr}
                  plugin={true}
                  classProp="max-h-[450px]"
                />
                {finished && (
                  <CodeBlock
                    lang="OUTPUT"
                    codeChildren={plugin.output ?? ''}
                    plugin={true}
                    classProp="max-h-[450px]"
                  />
                )}
              </Disclosure.Panel>
            </>
          );
        }}
      </Disclosure>
    </div>
  );
};

export default memo(Plugin);
