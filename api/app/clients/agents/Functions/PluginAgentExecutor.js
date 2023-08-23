const { BaseChain } = require('langchain/chains');

class PluginAgentExecutor extends BaseChain {
  get lc_namespace() {
    return ['langchain', 'agents', 'executor'];
  }

  agent; //: BaseSingleActionAgent | BaseMultiActionAgent;

  tools; //: this['agent']['ToolType'][];

  returnIntermediateSteps = false;

  maxIterations = 15; // ?: number = 15;

  earlyStoppingMethod = 'force'; // : StoppingMethod = 'force';

  get inputKeys() {
    return this.agent.inputKeys;
  }

  get outputKeys() {
    return this.agent.returnValues;
  }

  // input: AgentExecutorInput
  constructor(input) {
    super(input);
    this.agent = input.agent;
    this.tools = input.tools;
    if (this.agent._agentActionType() === 'multi') {
      for (const tool of this.tools) {
        if (tool.returnDirect) {
          throw new Error(
            `Tool with return direct ${tool.name} not supported for multi-action agent.`,
          );
        }
      }
    }
    this.returnIntermediateSteps = input.returnIntermediateSteps ?? this.returnIntermediateSteps;
    this.maxIterations = input.maxIterations ?? this.maxIterations;
    this.earlyStoppingMethod = input.earlyStoppingMethod ?? this.earlyStoppingMethod;
  }

  /** Create from agent and a list of tools. */
  // fields: AgentExecutorInput
  // :AgentExecutor
  static fromAgentAndTools(fields) {
    return new PluginAgentExecutor(fields);
  }

  shouldContinue(iterations) {
    return this.maxIterations === undefined || iterations < this.maxIterations;
  }

  async _call(
    inputs, //: ChainValues,
    runManager, //?: CallbackManagerForChainRun
    // -> Promise<ChainValues>
  ) {
    // const toolsByName = Object.fromEntries(this.tools.map((t) => [t.name.toLowerCase(), t]));
    // AgentStep[]
    const steps = [];
    let iterations = 0;

    // finishStep: AgentFinish
    const getOutput = async (finishStep) => {
      const { returnValues } = finishStep;
      const additional = await this.agent.prepareForOutput(returnValues, steps);

      if (this.returnIntermediateSteps) {
        return { ...returnValues, intermediateSteps: steps, ...additional };
      }
      await runManager?.handleAgentEnd(finishStep);
      return { ...returnValues, ...additional };
    };

    // Really this should just call the `agent` 1x
    while (this.shouldContinue(iterations)) {
      console.log('Steps', steps);
      const output = await this.agent.plan(steps, inputs, runManager?.getChild(), runManager);
      // Check if the agent has finished
      if ('returnValues' in output) {
        return getOutput(output);
      }
      iterations += 1;
    }

    const finish = await this.agent.returnStoppedResponse(this.earlyStoppingMethod, steps, inputs);

    return getOutput(finish);
  }

  _chainType() {
    return 'agent_executor';
  }

  serialize() {
    throw new Error('Cannot serialize an AgentExecutor');
  }
}

module.exports = { PluginAgentExecutor };
