const { promises: fs } = require('fs');
const path = require('path');
const { addOpenAPISpecs } = require('../../app/clients/tools/util/addOpenAPISpecs');

const { loadSpecs } = require('../../app/clients/tools/util/loadSpecs');
const {
  convertOpenAPISpecToOpenAIFunctions,
} = require('../../app/clients/tools/dynamic/OpenAPIClone');
const { OpenAPISpec } = require('../../app/clients/tools/dynamic/OpenAPISpecClone');

const filterUniquePlugins = (plugins) => {
  const seen = new Set();
  return plugins.filter((plugin) => {
    const duplicate = seen.has(plugin.pluginKey);
    seen.add(plugin.pluginKey);
    return !duplicate;
  });
};

const isPluginAuthenticated = (plugin) => {
  if (!plugin.authConfig || plugin.authConfig.length === 0) {
    return false;
  }

  return plugin.authConfig.every((authFieldObj) => {
    const envValue = process.env[authFieldObj.authField];
    if (envValue === 'user_provided') {
      return false;
    }
    return envValue && envValue.trim() !== '';
  });
};

const getAvailablePluginsController = async (req, res) => {
  try {
    const manifestFile = await fs.readFile(
      path.join(__dirname, '..', '..', 'app', 'clients', 'tools', 'manifest.json'),
      'utf8',
    );

    const jsonData = JSON.parse(manifestFile);
    const uniquePlugins = filterUniquePlugins(jsonData);
    const authenticatedPlugins = uniquePlugins.map((plugin) => {
      if (isPluginAuthenticated(plugin)) {
        return { ...plugin, authenticated: true };
      } else {
        return plugin;
      }
    });
    const plugins = await addOpenAPISpecs(authenticatedPlugins);
    res.status(200).json(plugins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPluginFunctionsController = async (req, res) => {
  // When you pass an LLM, it returns more fleshed out information
  const aiPluginTools = await loadSpecs({ llm: 'gpt-3.5-turbo-16k' });
  const pluginKey = req.query.pluginKey;
  const tools = aiPluginTools.filter((tool) => tool.name === pluginKey);
  if (tools.length === 0) {
    res.status(404).json({ message: 'Plugin not found' });
    return;
  }
  const plugin = tools[0];
  let spec = new OpenAPISpec(plugin.openaiSpec);
  const { openAIFunctions } = convertOpenAPISpecToOpenAIFunctions(spec);
  res.status(200).json({ openAIFunctions, description: plugin.description });
};

module.exports = {
  getAvailablePluginsController,
  getPluginFunctionsController,
};
