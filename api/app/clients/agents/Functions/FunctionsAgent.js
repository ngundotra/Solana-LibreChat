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
const PREFIX = `You are an AI assistant tasked with helping the user navigate the Solana blockchain and its ecosystem.
  Never ask the user for their seed phrase, private key, or other data that could be used to recreate their private key or 
  other sensitive information. If the user asks for help with a tool that requires a seed phrase, private key, or other sensitive information,
  please refuse.
  `;

function parseOutput(message) {
  if (message.additional_kwargs && message.additional_kwargs.function_call) {
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

async function openaiChatComplete(messages, functions, model) {
  let startTime = Date.now() / 1000;
  let result = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: messages.map((m) => formatMessage(m)),
      functions,
    }),
  });
  let endTime = Date.now() / 1000;
  let json = await result.json();
  if (json['error']) {
    throw new Error(json['error']);
  }
  return {
    choices: json['choices'],
    usage: json['usage'],
    startTime,
    endTime,
  };
}

async function promptLayerTrack(
  choices,
  usage,
  messages,
  functions,
  startTime,
  endTime,
  tags,
  model,
) {
  let payload = JSON.stringify({
    // This tag is EXTREMELY important for tracking
    // otherwise tagging data will be lost
    function_name: 'openai.ChatCompletion.create',
    kwargs: {
      messages: messages.map((m) => formatMessage(m)),
      model,
      functions,
    },
    request_response: {
      choices,
      usage,
    },
    tags,
    request_start_time: startTime,
    request_end_time: endTime,
    api_key: process.env.PROMPTLAYER_API_KEY,
  });
  let result = await fetch('https://api.promptlayer.com/track-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  });

  if (result.status !== 200) {
    throw new Error(
      `Failed to record prompt info with status ${result.status}: ${result.statusText}`,
    );
  }
}

// Manual ser/de for BaseMessage (langchain class)
function formatMessage(message) {
  let type = message._getType();
  let role;
  if (type === 'human') {
    role = 'user';
  } else if (type === 'ai') {
    role = 'assistant';
  } else {
    role = type;
  }
  return {
    content: message.content,
    role,
    name: message.name,
    function_call: message.additional_kwargs?.function_call,
  };
}

class FunctionsAgent extends Agent {
  constructor(input) {
    super({ ...input, outputParser: undefined });
    this.tools = input.tools;
    this.user = input.user;
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
      SystemMessagePromptTemplate.fromTemplate(
        `${prefix}\n\nThe current user's Solana wallet address is: {wallet_address} (case-sensitive, copy exactly as is). \nToday's date is: ${new Date()}`,
      ),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('Query: {input}'),
      new MessagesPlaceholder('agent_scratchpad'),
    ]);
  }

  static fromLLMAndTools(llm, tools, args, user) {
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
      user,
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
  async plan(steps, inputs, callbackManager, parentCallbackManager) {
    // Add scratchpad and stop to inputs
    const thoughts = await this.constructScratchPad(steps);
    const newInputs = Object.assign({}, inputs, { agent_scratchpad: thoughts });
    if (this._stop().length !== 0) {
      newInputs.stop = this._stop();
    }

    // Make this work for multiple tools
    let spec = new OpenAPISpec(this.tools[0].openaiSpec);
    const { openAIFunctions: oaif } = convertOpenAPISpecToOpenAIFunctions(spec);
    const openAIFunctions = oaif.map((f) => {
      return {
        ...f,
        name: this.tools[0].name + '__' + f.name,
      };
    });

    // const llm = new PromptLayerChatOpenAI({
    //   modelName: process.env.SIDEKICK_MODEL,
    //   promptLayerApiKey: process.env.PROMPTLAYER_API_KEY,
    //   temperature: 0.1,
    //   plTags: ['sidekick', 'plugins', this.tools[0].name],
    //   modelKwargs: {
    //     functions: openAIFunctions,
    //   },
    // });
    const valuesForPrompt = Object.assign({}, newInputs);
    valuesForPrompt['wallet_address'] = this.user.name;

    const promptValue = await this.llmChain.prompt.formatPromptValue(valuesForPrompt);
    let formatted = promptValue.toChatMessages();
    console.log({ formatted });

    let isDone = false;
    let message;
    while (!isDone) {
      // message = await llm.predictMessages(
      //   formatted,
      //   { functions: openAIFunctions },
      //   callbackManager,
      // );

      // Use a cheaper model, otherwise function calls with Solana model cost 2.5c each
      const model = 'gpt-3.5-turbo-16k-0613';

      // Manually invoke OpenAI API to get around langchain's stupid SDK which
      // doesn't return the full response
      let { choices, usage, startTime, endTime } = await openaiChatComplete(
        formatted,
        openAIFunctions,
        model,
      );
      // Manually log functions, messages, and metadata to PromptLayer
      await promptLayerTrack(
        choices,
        usage,
        formatted,
        openAIFunctions,
        startTime,
        endTime,
        ['sidekick', this.tools[0].name, this.user.username, this.user.id],
        model,
      );
      message = choices[0]['message'];
      console.log({ gptMessage: message });

      if (message.function_call) {
        const functionCall = message.function_call;
        // eslint-disable-next-line no-unused-vars
        const [_tool, operationId] = functionCall['name'].split('__');
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

        // Creates new action
        await parentCallbackManager.handleAgentAction({
          tool: `${this.tools[0].name}`,
          method: `${operationId}`,
          input: JSON.stringify(data),
        });

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

              // Update existing action
              if (response.status === 200) {
                // Success case
                let observation = await response.text();
                console.log({ observation });
                formatted.push(new FunctionMessage(observation, toolName));
                parentCallbackManager.handleAgentAction({
                  tool: `${this.tools[0].name}`,
                  method: `${operationId}`,
                  input: JSON.stringify(data),
                  output: observation,
                  actionType: 'update',
                });
              } else {
                // Failure case
                let observation = `{"status":"(${response.status}) ${response.statusText}"}`;
                console.log({ observation });
                formatted.push(new FunctionMessage(observation, toolName));
                parentCallbackManager.handleAgentAction({
                  tool: `${this.tools[0].name}`,
                  method: `${operationId}`,
                  input: JSON.stringify(data),
                  output: observation,
                  actionType: 'update',
                });
              }
              break;
            }
          }
        }

        // Really strange failure case, could be model issue
        // Ideally should never happen, but in practice...
        if (!found) {
          let observation = `No method named ${operationId} found`;
          formatted.push(new FunctionMessage(observation, toolName));
          parentCallbackManager.handleAgentAction({
            tool: `${this.tools[0].name}`,
            method: `${operationId}`,
            input: JSON.stringify(data),
            output: observation,
            actionType: 'update',
          });
        }
      } else {
        isDone = true;
      }
    }

    // For parsing
    message.text = message.content;
    return parseOutput(message);
  }
}

module.exports = { FunctionsAgent };
