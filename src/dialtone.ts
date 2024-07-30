import type { ChatCompletion, ChatCompletionChunk, ChatCompletionParams, ChatMessage, ClientOptions, Dials, FallbackConfig, ProviderConfig, RouterModelConfig, Tool, ToolsConfig } from './types'
import { Provider } from './types'
import { APIError } from './errors'

const DIALTONE_BASE_URL = 'https://dialtone-app.fly.dev'

const API_VERSION = 'v0'

async function createChatCompletion(
  apiKey: string,
  messages: ChatMessage[],
  baseUrl: string,
  dials: Dials,
  providerConfig: ProviderConfig,
  routerModelConfig?: RouterModelConfig,
  fallbackConfig?: FallbackConfig,
  toolsConfig?: ToolsConfig,
  stream?: boolean,
  tools?: Tool[],
): Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  let params: ChatCompletionParams = {
    messages,
    dials,
    provider_config: providerConfig,
    router_model_config: routerModelConfig,
  }

  if (routerModelConfig) {
    params = {
      ...params,
      router_model_config: routerModelConfig,
    }
  }

  if (fallbackConfig) {
    params = {
      ...params,
      fallback_config: fallbackConfig,
    }
  }

  if (toolsConfig) {
    params = {
      ...params,
      tools_config: toolsConfig,
    }
  }

  if (stream) {
    params = {
      ...params,
      stream: true,
    }
  }

  if (tools) {
    params = {
      ...params,
      tools,
    }
  }

  try {
    const response = await fetch(`${baseUrl}/${API_VERSION}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params, (_key, value) => {
        if (value !== null)
          return value
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw APIError.generate(response.status, errorData, response.statusText)
    }

    if (stream) {
      async function* streamingFetch(response: Response) {
        if (!response.body)
          throw APIError.generate(418, undefined, 'Failed to create chat completion due to an unexpected error')
        // Attach Reader
        const reader = response.body.getReader()
        let buffer = ''
        while (true) {
          // wait for next encoded chunk
          const { done, value } = await reader.read()
          // check if stream is done
          if (done)
            break
          // Decode data chunk and append to buffer
          buffer += new TextDecoder().decode(value)
          // Split buffer by newlines to get complete JSON objects.
          //
          // Stream data is sent in jsonl format (https://jsonlines.org/).
          //
          // Note that newlines within completion strings embdedded inside text-serialized
          // json objects are handled approriately because those are interpreted differently.
          // So the split only happens on valid top level json objects separated by newlines,
          // and other newlines are all "ignored".
          const parts = buffer.split('\n')
          buffer = parts.pop() || '' // Keep the last part in buffer (it might be incomplete)
          for (const part of parts) {
            if (part.trim()) {
              try {
                yield (JSON.parse(part) as ChatCompletionChunk)
              }
              catch (e) {
                console.error('Failed to parse chunk:', part)
                throw new Error('Failed to parse chunk')
              }
            }
          }
        }
        // Handle any remaining data in buffer if it is valid json
        if (buffer.trim()) {
          try {
            yield (JSON.parse(buffer) as ChatCompletionChunk)
          }
          catch (e) {
            console.error('Failed to parse remaining buffer data:', buffer)
            throw new Error('Failed to parse remaining buffer data')
          }
        }
      }
      return streamingFetch(response)
    }
    else {
      const data = await response.json()
      return data as ChatCompletion
    }
  }
  catch (error: any) {
    if (error instanceof APIError)
      throw error

    throw APIError.generate(418, undefined, 'Failed to create chat completion due to an unexpected error')
  }
}

export class Dialtone {
  apiKey: string

  baseUrl: string = DIALTONE_BASE_URL

  dials: Dials = {
    quality: 0.5,
    cost: 0.5,
  }

  providerConfig: ProviderConfig = {

  }

  routerModelConfig?: RouterModelConfig = {
    gpt_4o: {
      providers: [Provider.OpenAI],
    },
    gpt_4o_mini: {
      providers: [Provider.OpenAI],
    },
    llama_3_70b: {
      tools_providers: [Provider.Groq, Provider.DeepInfra],
      no_tools_providers: [Provider.Groq, Provider.Fireworks, Provider.Together, Provider.DeepInfra, Provider.Replicate],
    },
    llama_3_1_8b: {
      tools_providers: [Provider.Groq],
      no_tools_providers: [Provider.Groq, Provider.Fireworks, Provider.Together, Provider.DeepInfra],
    },
    llama_3_1_70b: {
      tools_providers: [Provider.Groq],
      no_tools_providers: [Provider.Groq, Provider.Fireworks, Provider.Together, Provider.DeepInfra],
    },
    llama_3_1_405b: {
      tools_providers: [],
      no_tools_providers: [Provider.Fireworks, Provider.Together, Provider.DeepInfra],
    },
    claude_3_5_sonnet: {
      providers: [Provider.Anthropic],
    },
    claude_3_haiku: {
      providers: [Provider.Anthropic],
    },
    gemini_1_5_pro: {
      providers: [Provider.Google],
    },
    gemini_1_5_flash: {
      providers: [Provider.Google],
    },
    command_r_plus: {
      providers: [Provider.Cohere],
    },
    command_r: {
      providers: [Provider.Cohere],
    },
  }

  fallbackConfig?: FallbackConfig

  toolsConfig?: ToolsConfig

  chat: {
    completions: {
      create: ({
        messages,
        tools,
        stream,
      }: {
        messages: ChatMessage[]
        tools?: Tool[]
        stream?: boolean
      }) => Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk, void, unknown>>
    }
  }

  constructor(options: ClientOptions) {
    this.apiKey = options.api_key
    if (options.dials)
      this.dials = options.dials
    if (options.base_url)
      this.baseUrl = options.base_url
    this.providerConfig = options.provider_config
    if (options.router_model_config)
      this.routerModelConfig = options.router_model_config
    if (options.fallback_config)
      this.fallbackConfig = options.fallback_config
    if (options.tools_config)
      this.toolsConfig = options.tools_config

    this.chat = {
      completions: {
        create: async ({
          messages,
          tools,
          stream,
        }: {
          messages: ChatMessage[]
          tools?: Tool[]
          stream?: boolean
        }) => createChatCompletion(
          this.apiKey,
          messages,
          this.baseUrl,
          this.dials,
          this.providerConfig,
          this.routerModelConfig,
          this.fallbackConfig,
          this.toolsConfig,
          stream,
          tools,
        ),
      },
    }
  }
}
