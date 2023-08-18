// const { AgentExecutor } = require('langchain/agents');
const { BufferMemory, ChatMessageHistory } = require('langchain/memory');
const { PluginAgentExecutor } = require('./PluginAgentExecutor');
const { FunctionsAgent } = require('./FunctionsAgent');

const initializeFunctionsAgent = async ({
  tools,
  model,
  pastMessages,
  // currentDateString,
  ...rest
}) => {
  const memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(pastMessages),
    memoryKey: 'chat_history',
    humanPrefix: 'User',
    aiPrefix: 'Assistant',
    inputKey: 'input',
    outputKey: 'output',
    returnMessages: true,
  });

  return makeFunctionsAgent(tools, model, {
    agentType: 'openai-functions',
    memory,
    maxIterations: 4,
    ...rest,
  });

  // return await initializeAgentExecutorWithOptions(tools, model, {
  //   agentType: 'openai-functions',
  //   memory,
  //   maxIterations: 4,
  //   ...rest,
  // });
};

function makeFunctionsAgent(tools, model, options) {
  const { agentArgs, memory, tags, ...rest } = options;
  const executor = PluginAgentExecutor.fromAgentAndTools({
    tags: [...(tags ?? []), 'openai-functions'],
    agent: FunctionsAgent.fromLLMAndTools(model, tools, agentArgs),
    tools,
    memory:
      memory ??
      new BufferMemory({
        returnMessages: true,
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'output',
      }),
    ...rest,
  });
  return executor;
}

module.exports = initializeFunctionsAgent;
