import { atom, selector } from 'recoil';

const endpointsConfig = atom({
  key: 'endpointsConfig',
  default: {
    azureOpenAI: null,
    openAI: null,
    bingAI: null,
    chatGPTBrowser: null,
    gptPlugins: {},
    google: null,
    anthropic: null,
  },
});

const plugins = selector({
  key: 'plugins',
  get: ({ get }) => {
    const config = get(endpointsConfig) || {};
    return config?.gptPlugins?.plugins || {};
  },
});

const endpointsFilter = selector({
  key: 'endpointsFilter',
  get: ({ get }) => {
    const config = get(endpointsConfig) || {};

    let filter = {};
    for (const key of Object.keys(config)) {
      filter[key] = !!config[key];
    }
    return filter;
  },
});

/**
 * Config available conversation types
 */
const availableEndpoints = selector({
  key: 'availableEndpoints',
  get: ({ get }) => {
    const endpoints = [
      // 'azureOpenAI',
      // 'openAI',
      // 'chatGPTBrowser',
      'gptPlugins',
      // 'bingAI',
      // 'google',
      // 'anthropic',
    ];
    const f = get(endpointsFilter);
    return endpoints.filter((endpoint) => f[endpoint]);
  },
});

export default {
  plugins,
  endpointsConfig,
  endpointsFilter,
  availableEndpoints,
};
