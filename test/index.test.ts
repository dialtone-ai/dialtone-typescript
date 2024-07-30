import { describe, expect, it } from 'vitest'
import type { ChatCompletion, ChatCompletionChunk, ChatMessage, ClientOptions, ProviderConfig, RouterModelConfig, Tool } from '../src/index'
import { Dialtone, LLM, Provider } from '../src/index'
import { readEnv } from '../src/utils'

describe('chat.completions.create', () => {
  it('should call the server successfully', async () => {
    const clientOptions: ClientOptions = {
      base_url: 'http://localhost:8000',
      api_key: readEnv('DIALTONE_API_KEY') as string,
      dials: {
        quality: 0.5,
        cost: 0.5,
      },
      provider_config: {
        openai: {
          api_key: readEnv('OPENAI_API_KEY') as string,
        },
        anthropic: {
          api_key: readEnv('ANTHROPIC_API_KEY') as string,
        },
        google: {
          api_key: readEnv('GOOGLE_API_KEY') as string,
        },
        cohere: {
          api_key: readEnv('COHERE_API_KEY') as string,
        },
        groq: {
          api_key: readEnv('GROQ_API_KEY') as string,
        },
        fireworks: {
          api_key: readEnv('FIREWORKS_API_KEY') as string,
        },
      },
      router_model_config: {
        include_models: [
          LLM.command_r,
          LLM.command_r_plus,
          LLM.gpt_4o_mini,
          LLM.llama_3_1_8b,
          LLM.claude_3_5_sonnet,
        ],
      },
    }
    const client = new Dialtone(clientOptions)
    const chatCompletionResponse = await client.chat.completions.create(
      {
        messages: [
          { role: 'user', content: 'Hey, what\'s up?' },
        ],
      },
    ) as ChatCompletion

    const chatCompletionChoice = chatCompletionResponse.choices[0]
    const chatCompletionUsage = chatCompletionResponse.usage

    expect(chatCompletionResponse.model).toBeTypeOf('string')
    expect(chatCompletionResponse.provider).toBeTypeOf('string')
    expect(chatCompletionChoice.message.content).toBeTypeOf('string')
    expect(chatCompletionChoice.message.role).toBeTypeOf('string')
    expect(chatCompletionUsage.completion_tokens).toBeTypeOf('number')
    expect(chatCompletionUsage.prompt_tokens).toBeTypeOf('number')
    expect(chatCompletionUsage.total_tokens).toBeTypeOf('number')
  })
})

describe('chat.completions.create with tools', () => {
  it('should call the server successfully', async () => {
    const clientOptions: ClientOptions = {
      api_key: readEnv('DIALTONE_API_KEY') as string,
      dials: {
        quality: 0.5,
        cost: 0.5,
      },
      provider_config: {
        openai: {
          api_key: readEnv('OPENAI_API_KEY') as string,
        },
        anthropic: {
          api_key: readEnv('ANTHROPIC_API_KEY') as string,
        },
        google: {
          api_key: readEnv('GOOGLE_API_KEY') as string,
        },
        cohere: {
          api_key: readEnv('COHERE_API_KEY') as string,
        },
        groq: {
          api_key: readEnv('GROQ_API_KEY') as string,
        },
        fireworks: {
          api_key: readEnv('FIREWORKS_API_KEY') as string,
        },
      },
    }
    const client = new Dialtone(clientOptions)
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What\'s the weather like in San Francisco, Tokyo, and Paris?' },
    ]
    const tools: Tool[] = [
      {
        type: 'function',
        function: {
          name: 'get_current_weather',
          description: 'Get the current weather in a given location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
              },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
          },
        },
      },
    ]
    const chatCompletionResponse = await client.chat.completions.create(
      {
        messages,
        tools,
      },
    ) as ChatCompletion

    const chatCompletionChoice = chatCompletionResponse.choices[0]
    const chatCompletionUsage = chatCompletionResponse.usage

    expect(chatCompletionResponse.model).toBeTypeOf('string')
    expect(chatCompletionResponse.provider).toBeTypeOf('string')
    expect(chatCompletionChoice.message.content).toBeTypeOf('string')
    expect(chatCompletionChoice.message.role).toBeTypeOf('string')
    expect(chatCompletionUsage.completion_tokens).toBeTypeOf('number')
    expect(chatCompletionUsage.prompt_tokens).toBeTypeOf('number')
    expect(chatCompletionUsage.total_tokens).toBeTypeOf('number')

    const responseMessage = chatCompletionResponse.choices[0].message

    // Step 2: check if the model wanted to call a function
    const toolCalls = responseMessage.tool_calls
    expect(toolCalls).toBeDefined()
    if (responseMessage.tool_calls) {
      // Step 3: call the function
      // Note: the JSON response may not always be valid; be sure to handle errors
      const availableFunctions = {
        get_current_weather: getCurrentWeather,
      } // only one function in this example, but you can have multiple
      messages.push(responseMessage) // extend conversation with assistant's reply
      if (toolCalls === undefined)
        throw new Error('toolCalls is undefined')

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name as keyof typeof availableFunctions
        const functionToCall = availableFunctions[functionName]
        const functionArgs = JSON.parse(toolCall.function.arguments)
        const functionResponse = functionToCall(
          functionArgs.location,
          functionArgs.unit,
        )
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResponse,
        }) // extend conversation with function response
      }

      const followupResponse = await client.chat.completions.create({
        messages,
        tools,
      }) as ChatCompletion
      const followupChatCompletionChoice = followupResponse.choices[0]
      const followupChatCompletionUsage = followupResponse.usage

      expect(followupResponse.model).toBeTypeOf('string')
      expect(followupResponse.provider).toBeTypeOf('string')
      expect(followupChatCompletionChoice.message.content).toBeTypeOf('string')
      expect(followupChatCompletionChoice.message.role).toBeTypeOf('string')
      expect(followupChatCompletionUsage.completion_tokens).toBeTypeOf('number')
      expect(followupChatCompletionUsage.prompt_tokens).toBeTypeOf('number')
      expect(followupChatCompletionUsage.total_tokens).toBeTypeOf('number')
    }
    else {
      throw new Error('toolCalls is undefined')
    }
  }, 20_000)
})

describe('chat.completions.create streaming', () => {
  it('should call the server successfully', async () => {
    const clientOptions: ClientOptions = {
      api_key: readEnv('DIALTONE_API_KEY') as string,
      provider_config: {
        openai: {
          api_key: readEnv('OPENAI_API_KEY') as string,
        },
        anthropic: {
          api_key: readEnv('ANTHROPIC_API_KEY') as string,
        },
        google: {
          api_key: readEnv('GOOGLE_API_KEY') as string,
        },
        cohere: {
          api_key: readEnv('COHERE_API_KEY') as string,
        },
        groq: {
          api_key: readEnv('GROQ_API_KEY') as string,
        },
        fireworks: {
          api_key: readEnv('FIREWORKS_API_KEY') as string,
        },
      },
    }
    const client = new Dialtone(clientOptions)
    const chatCompletionResponse = await client.chat.completions.create(
      {
        messages: [
          { role: 'user', content: 'Hey, what\'s up? Include many newline characters in the response.' },
        ],
        stream: true,
      },
    ) as AsyncGenerator<ChatCompletionChunk, void, unknown>

    for await (const chunk of chatCompletionResponse) {
      expect(chunk.model).toBeTypeOf('string')
      expect(chunk.provider).toBeTypeOf('string')
    }
  })
})

describe.concurrent('chat.completions.create - all provider/model combinations', () => {
  interface ProviderModelConfigs {
    providerConfig: ProviderConfig
    modelConfigs: Array<RouterModelConfig>
  }

  const allModelProviderCombinations: Map<Provider, ProviderModelConfigs> = new Map()

  allModelProviderCombinations.set(Provider.OpenAI, {
    providerConfig: {
      openai: {
        api_key: readEnv('OPENAI_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.gpt_4o],
        gpt_4o: {
          providers: [Provider.OpenAI],
        },
      },
      {
        include_models: [LLM.gpt_4o],
        gpt_4o: {
          providers: [Provider.OpenAI],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Anthropic, {
    providerConfig: {
      anthropic: {
        api_key: readEnv('ANTHROPIC_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.claude_3_5_sonnet],
        claude_3_5_sonnet: {
          providers: [Provider.Anthropic],
        },
      },
      {
        include_models: [LLM.claude_3_haiku],
        claude_3_haiku: {
          providers: [Provider.Anthropic],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Google, {
    providerConfig: {
      google: {
        api_key: readEnv('GOOGLE_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.gemini_1_5_pro],
        gemini_1_5_pro: {
          providers: [Provider.Google],
        },
      },
      {
        include_models: [LLM.gemini_1_5_flash],
        gemini_1_5_flash: {
          providers: [Provider.Google],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Cohere, {
    providerConfig: {
      cohere: {
        api_key: readEnv('COHERE_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.command_r_plus],
        command_r_plus: {
          providers: [Provider.Cohere],
        },
      },
      {
        include_models: [LLM.command_r],
        command_r: {
          providers: [Provider.Cohere],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Groq, {
    providerConfig: {
      groq: {
        api_key: readEnv('GROQ_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.Groq],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_8b],
        llama_3_1_8b: {
          no_tools_providers: [Provider.Groq],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_70b],
        llama_3_1_70b: {
          no_tools_providers: [Provider.Groq],
          tools_providers: [Provider.Groq],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.DeepInfra, {
    providerConfig: {
      deepinfra: {
        api_key: readEnv('DEEPINFRA_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.DeepInfra],
          tools_providers: [Provider.DeepInfra],
        },
      },
      {
        include_models: [LLM.llama_3_1_8b],
        llama_3_1_8b: {
          no_tools_providers: [Provider.DeepInfra],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_70b],
        llama_3_1_70b: {
          no_tools_providers: [Provider.DeepInfra],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_405b],
        llama_3_1_405b: {
          no_tools_providers: [Provider.DeepInfra],
          tools_providers: [Provider.Groq],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Fireworks, {
    providerConfig: {
      fireworks: {
        api_key: readEnv('FIREWORKS_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.Fireworks],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_8b],
        llama_3_1_8b: {
          no_tools_providers: [Provider.Fireworks],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_70b],
        llama_3_1_70b: {
          no_tools_providers: [Provider.Fireworks],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_405b],
        llama_3_1_405b: {
          no_tools_providers: [Provider.Fireworks],
          tools_providers: [Provider.Groq],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Together, {
    providerConfig: {
      together: {
        api_key: readEnv('TOGETHER_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.Together],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_8b],
        llama_3_1_8b: {
          no_tools_providers: [Provider.Together],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_70b],
        llama_3_1_70b: {
          no_tools_providers: [Provider.Together],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_405b],
        llama_3_1_405b: {
          no_tools_providers: [Provider.Together],
          tools_providers: [Provider.Groq],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Replicate, {
    providerConfig: {
      replicate: {
        api_key: readEnv('REPLICATE_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.Replicate],
          tools_providers: [Provider.Groq],
        },
      },
    ],
  })

  for (const [provider, providerModelConfigs] of allModelProviderCombinations) {
    const providerConfig = providerModelConfigs.providerConfig
    for (const modelConfig of providerModelConfigs.modelConfigs) {
      const modelName = modelConfig.include_models?.at(0)

      it(`should call the server successfully for ${provider} with ${modelName}`, async () => {
        const clientOptions: ClientOptions = {
          api_key: readEnv('DIALTONE_API_KEY') as string,
          provider_config: providerConfig,
          router_model_config: modelConfig,
        }
        const client = new Dialtone(clientOptions)
        const chatCompletionResponse = await client.chat.completions.create(
          {
            messages: [
              { role: 'user', content: 'Hey, what\'s up?' },
            ],
          },
        ) as ChatCompletion
        const chatCompletionChoice = chatCompletionResponse.choices[0]
        const chatCompletionUsage = chatCompletionResponse.usage

        expect(chatCompletionResponse.model).toBeTypeOf('string')
        expect(chatCompletionResponse.provider).toBeTypeOf('string')
        expect(chatCompletionChoice.message.content).toBeTypeOf('string')
        expect(chatCompletionChoice.message.role).toBeTypeOf('string')
        expect(chatCompletionUsage.completion_tokens).toBeTypeOf('number')
        expect(chatCompletionUsage.prompt_tokens).toBeTypeOf('number')
        expect(chatCompletionUsage.total_tokens).toBeTypeOf('number')
      }, 60_000)
    }
  }
})

describe.concurrent('chat.completions.create - all provider/model combinations with tools', () => {
  interface ProviderModelConfigs {
    providerConfig: ProviderConfig
    modelConfigs: Array<RouterModelConfig>
  }

  const allModelProviderCombinations: Map<Provider, ProviderModelConfigs> = new Map()

  allModelProviderCombinations.set(Provider.OpenAI, {
    providerConfig: {
      openai: {
        api_key: readEnv('OPENAI_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.gpt_4o],
        gpt_4o: {
          providers: [Provider.OpenAI],
        },
      },
      {
        include_models: [LLM.gpt_4o],
        gpt_4o: {
          providers: [Provider.OpenAI],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Anthropic, {
    providerConfig: {
      anthropic: {
        api_key: readEnv('ANTHROPIC_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.claude_3_5_sonnet],
        claude_3_5_sonnet: {
          providers: [Provider.Anthropic],
        },
      },
      {
        include_models: [LLM.claude_3_haiku],
        claude_3_haiku: {
          providers: [Provider.Anthropic],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Google, {
    providerConfig: {
      google: {
        api_key: readEnv('GOOGLE_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.gemini_1_5_pro],
        gemini_1_5_pro: {
          providers: [Provider.Google],
        },
      },
      {
        include_models: [LLM.gemini_1_5_flash],
        gemini_1_5_flash: {
          providers: [Provider.Google],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Cohere, {
    providerConfig: {
      cohere: {
        api_key: readEnv('COHERE_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.command_r_plus],
        command_r_plus: {
          providers: [Provider.Cohere],
        },
      },
      {
        include_models: [LLM.command_r],
        command_r: {
          providers: [Provider.Cohere],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.Groq, {
    providerConfig: {
      groq: {
        api_key: readEnv('GROQ_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.Groq],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_8b],
        llama_3_1_8b: {
          no_tools_providers: [Provider.Groq],
          tools_providers: [Provider.Groq],
        },
      },
      {
        include_models: [LLM.llama_3_1_70b],
        llama_3_1_70b: {
          no_tools_providers: [Provider.Groq],
          tools_providers: [Provider.Groq],
        },
      },
    ],
  })

  allModelProviderCombinations.set(Provider.DeepInfra, {
    providerConfig: {
      deepinfra: {
        api_key: readEnv('DEEPINFRA_API_KEY') as string,
      },
    },
    modelConfigs: [
      {
        include_models: [LLM.llama_3_70b],
        llama_3_70b: {
          no_tools_providers: [Provider.DeepInfra],
          tools_providers: [Provider.DeepInfra],
        },
      },
    ],
  })

  for (const [provider, providerModelConfigs] of allModelProviderCombinations) {
    const providerConfig = providerModelConfigs.providerConfig
    for (const modelConfig of providerModelConfigs.modelConfigs) {
      const modelName = modelConfig.include_models?.at(0)

      it(`should call the server successfully for ${provider} with ${modelName}`, async () => {
        const clientOptions: ClientOptions = {
          api_key: readEnv('DIALTONE_API_KEY') as string,
          provider_config: providerConfig,
          router_model_config: modelConfig,
        }
        const client = new Dialtone(clientOptions)
        const messages: ChatMessage[] = [
          { role: 'user', content: 'What\'s the weather like in San Francisco in fahrenheit?' },
        ]
        const tools: Tool[] = [
          {
            type: 'function',
            function: {
              name: 'get_current_weather',
              description: 'Get the current weather in a given location',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
                },
                required: ['location'],
              },
            },
          },
        ]
        const chatCompletionResponse = await client.chat.completions.create(
          {
            messages,
            tools,
          },
        ) as ChatCompletion

        const chatCompletionChoice = chatCompletionResponse.choices[0]
        const chatCompletionUsage = chatCompletionResponse.usage

        expect(chatCompletionResponse.model).toBeTypeOf('string')
        expect(chatCompletionResponse.provider).toBeTypeOf('string')
        expect(chatCompletionChoice.message.content).toBeTypeOf('string')
        expect(chatCompletionChoice.message.role).toBeTypeOf('string')
        expect(chatCompletionUsage.completion_tokens).toBeTypeOf('number')
        expect(chatCompletionUsage.prompt_tokens).toBeTypeOf('number')
        expect(chatCompletionUsage.total_tokens).toBeTypeOf('number')

        const responseMessage = chatCompletionResponse.choices[0].message

        // Step 2: check if the model wanted to call a function
        const toolCalls = responseMessage.tool_calls
        expect(toolCalls).toBeDefined()
        if (responseMessage.tool_calls) {
          // Step 3: call the function
          // Note: the JSON response may not always be valid; be sure to handle errors
          const availableFunctions = {
            get_current_weather: getCurrentWeather,
          } // only one function in this example, but you can have multiple
          messages.push(responseMessage) // extend conversation with assistant's reply
          if (toolCalls === undefined)
            throw new Error('toolCalls is undefined')

          for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name as keyof typeof availableFunctions
            const functionToCall = availableFunctions[functionName]
            const functionArgs = JSON.parse(toolCall.function.arguments)
            const functionResponse = functionToCall(
              functionArgs.location,
              functionArgs.unit,
            )
            messages.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: functionName,
              content: functionResponse,
            }) // extend conversation with function response
          }

          const followupResponse = await client.chat.completions.create({
            messages,
            tools,
          }) as ChatCompletion
          const followupChatCompletionChoice = followupResponse.choices[0]
          const followupChatCompletionUsage = followupResponse.usage

          expect(followupResponse.model).toBeTypeOf('string')
          expect(followupResponse.provider).toBeTypeOf('string')
          expect(followupChatCompletionChoice.message.content).toBeTypeOf('string')
          expect(followupChatCompletionChoice.message.role).toBeTypeOf('string')
          expect(followupChatCompletionUsage.completion_tokens).toBeTypeOf('number')
          expect(followupChatCompletionUsage.prompt_tokens).toBeTypeOf('number')
          expect(followupChatCompletionUsage.total_tokens).toBeTypeOf('number')
        }
        else {
          throw new Error('toolCalls is undefined')
        }
      }, 60_000)
    }
  }
})

// Example dummy function hard coded to return the same weather
// eslint-disable-next-line unused-imports/no-unused-vars
function getCurrentWeather(location: string, unit = 'fahrenheit') {
  if (location.toLowerCase().includes('tokyo'))
    return JSON.stringify({ location: 'Tokyo', temperature: '10', unit: 'celsius' })

  else if (location.toLowerCase().includes('san francisco'))
    return JSON.stringify({ location: 'San Francisco', temperature: '72', unit: 'fahrenheit' })

  else if (location.toLowerCase().includes('paris'))
    return JSON.stringify({ location: 'Paris', temperature: '22', unit: 'fahrenheit' })

  else
    return JSON.stringify({ location, temperature: 'unknown' })
}
