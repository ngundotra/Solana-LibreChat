const { Agent } = require('langchain/agents');
const { LLMChain } = require('langchain/chains');
const { FunctionMessage, AIMessage } = require('langchain/schema');
const {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require('langchain/prompts');
const { convertOpenAPISpecToOpenAIFunctions } = require('../../tools/dynamic/OpenAPIClone');
const { OpenAPISpec } = require('../../tools/dynamic/OpenAPISpecClone');
const { getBufferString } = require('langchain/memory');
const { PromptLayerChatOpenAI } = require('langchain/chat_models/openai');
const PREFIX = 'You are a helpful AI assistant.';

function parseOutput(message) {
  if (message.additional_kwargs.function_call) {
    const function_call = message.additional_kwargs.function_call;
    return {
      tool: function_call.name,
      toolInput: function_call.arguments ? JSON.parse(function_call.arguments) : {},
      log: message.text,
    };
  } else {
    return { returnValues: { output: message.text }, log: message.text };
  }
}

class FunctionsAgent extends Agent {
  constructor(input) {
    super({ ...input, outputParser: undefined });
    this.tools = input.tools;
  }

  lc_namespace = ['langchain', 'agents', 'openai'];

  _agentType() {
    return 'openai-functions';
  }

  observationPrefix() {
    return 'Observation: ';
  }

  llmPrefix() {
    return 'Thought:';
  }

  _stop() {
    return ['Observation:'];
  }

  static createPrompt(_tools, fields) {
    const { prefix = PREFIX } = fields || {};

    return ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(`${prefix}`),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('Query: {input}'),
      new MessagesPlaceholder('agent_scratchpad'),
    ]);
  }

  static fromLLMAndTools(llm, tools, args) {
    FunctionsAgent.validateTools(tools);
    const prompt = FunctionsAgent.createPrompt(tools, args);
    const chain = new LLMChain({
      prompt,
      llm,
      callbacks: args?.callbacks,
    });
    return new FunctionsAgent({
      llmChain: chain,
      allowedTools: tools.map((t) => t.name),
      tools,
    });
  }

  async constructScratchPad(steps) {
    return steps.flatMap(({ action, observation }) => [
      new AIMessage('', {
        function_call: {
          name: action.tool,
          arguments: JSON.stringify(action.toolInput),
        },
      }),
      new FunctionMessage(observation, action.tool),
    ]);
  }

  /**
   * Basically redo this whole thing to only use OpenAI, and call a plugin function
   * with whole chat history.
   * TOOD(ngundotra): add UI for handling token context OOM
   * @param {*} steps
   * @param {*} inputs
   * @param {*} callbackManager
   * @returns
   */
  async plan(steps, inputs, callbackManager) {
    // Add scratchpad and stop to inputs
    const thoughts = await this.constructScratchPad(steps);
    const newInputs = Object.assign({}, inputs, { agent_scratchpad: thoughts });
    if (this._stop().length !== 0) {
      newInputs.stop = this._stop();
    }

    const llm = new PromptLayerChatOpenAI({
      modelName: process.env.SIDEKICK_MODEL,
      promptLayerApiKey: process.env.PROMPTLAYER_API_KEY,
    });
    const valuesForPrompt = Object.assign({}, newInputs);

    const promptValue = await this.llmChain.prompt.formatPromptValue(valuesForPrompt);
    let formatted = promptValue.toChatMessages();

    // Make this work for multiple tools
    let spec = new OpenAPISpec(this.tools[0].openaiSpec);
    const { openAIFunctions } = convertOpenAPISpecToOpenAIFunctions(spec);

    let isDone = false;
    let message;
    while (!isDone) {
      let bufferStr = getBufferString(formatted);
      console.log({ formatted, bufferStr });

      message = await llm.predictMessages(
        formatted,
        { functions: openAIFunctions },
        callbackManager,
      );
      console.log({ gptMessage: message });

      if (message.additional_kwargs.function_call) {
        const functionCall = message.additional_kwargs.function_call;
        const operationId = functionCall['name'];
        const args = JSON.parse(functionCall['arguments']);

        // Optionally unwrap from `data` packaging {data: trueArgs}
        const data = args['data'] ?? args;
        // It's crucial this is the same across AI & FunctionMessage
        const toolName = `${this.tools[0].name}__${operationId}`;

        formatted.push(
          new AIMessage('', {
            function_call: {
              name: toolName,
              arguments: JSON.stringify(data),
            },
          }),
        );

        let paths = spec.getPathsStrict();

        let found = false;
        for (const pathKey of Object.keys(paths)) {
          const path = paths[pathKey];
          for (const method of Object.keys(path)) {
            if (path[method].operationId === operationId) {
              found = true;
              const fullUrl = spec.baseUrl + pathKey;

              let response = await fetch(fullUrl, {
                method: method.toLowerCase() === 'post' ? 'POST' : 'GET',
                body: JSON.stringify(data) ?? {},
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              if (response.status === 200) {
                let observation = await response.text();
                formatted.push(new FunctionMessage(observation, toolName));
              } else {
                formatted.push(
                  new FunctionMessage(
                    `{"status":"(${response.status}) ${response.statusText}"}`,
                    toolName,
                  ),
                );
              }
              break;
            }
          }
        }

        if (!found) {
          formatted.push(new FunctionMessage(`No method named ${operationId} found`, toolName));
        }
      } else {
        isDone = true;
      }
    }
    return parseOutput(message);
  }
}

module.exports = { FunctionsAgent };
