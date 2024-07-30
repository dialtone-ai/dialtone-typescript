export enum LLM {
  claude_3_5_sonnet = 'claude-3-5-sonnet-20240620',
  claude_3_haiku = 'claude-3-haiku-20240307',
  gpt_4o = 'gpt-4o-2024-05-13',
  gpt_4o_mini = 'gpt-4o-mini-2024-07-18',
  gemini_1_5_pro = 'gemini-1.5-pro',
  gemini_1_5_flash = 'gemini-1.5-flash',
  command_r_plus = 'command-r-plus',
  command_r = 'command-r',
  llama_3_70b = 'llama3-70b-8192',
  llama_3_1_8b = 'llama3.1-8b',
  llama_3_1_70b = 'llama3.1-70b',
  llama_3_1_405b = 'llama3.1-405b',
}

export enum Provider {
  OpenAI = 'openai',
  Groq = 'groq',
  DeepInfra = 'deepinfra',
  Fireworks = 'fireworks',
  Together = 'together',
  Replicate = 'replicate',
  Anthropic = 'anthropic',
  Google = 'google',
  Cohere = 'cohere',
}

export interface OpenAIConfig {
  api_key: string
}

export interface AnthropicConfig {
  api_key: string
}

export interface GoogleConfig {
  api_key: string
}

export interface CohereConfig {
  api_key: string
}

export interface GroqConfig {
  api_key: string
}

export interface ReplicateConfig {
  api_key: string
}

export interface FireworksConfig {
  api_key: string
}

export interface TogetherConfig {
  api_key: string
}

export interface DeepInfraConfig {
  api_key: string
}

export interface ProviderConfig {
  openai?: OpenAIConfig
  anthropic?: AnthropicConfig
  google?: GoogleConfig
  cohere?: CohereConfig
  groq?: GroqConfig
  replicate?: ReplicateConfig
  fireworks?: FireworksConfig
  together?: TogetherConfig
  deepinfra?: DeepInfraConfig
}

export interface OpenAIModelConfig {
  providers: Array<Provider.OpenAI>
}

export interface AnthropicModelConfig {
  providers: Array<Provider.Anthropic>
}

export interface GoogleModelConfig {
  providers: Array<Provider.Google>
}

export interface CohereModelConfig {
  providers: Array<Provider.Cohere>
}

export interface Llama_3_70B_ModelConfig {
  tools_providers: Array<Provider.Groq | Provider.DeepInfra>
  no_tools_providers: Array<Provider.Groq | Provider.Fireworks | Provider.Together | Provider.DeepInfra | Provider.Replicate>
}

export interface Llama_3_1_8B_ModelConfig {
  tools_providers: Array<Provider.Groq>
  no_tools_providers: Array<Provider.Groq | Provider.Fireworks | Provider.Together | Provider.DeepInfra>
}

export interface Llama_3_1_70B_ModelConfig {
  tools_providers: Array<Provider.Groq>
  no_tools_providers: Array<Provider.Groq | Provider.Fireworks | Provider.Together | Provider.DeepInfra>
}

export interface Llama_3_1_405B_ModelConfig {
  tools_providers: Array<Provider.Groq>
  no_tools_providers: Array<Provider.Groq | Provider.Fireworks | Provider.Together | Provider.DeepInfra>
}

export interface RouterModelConfig {
  include_models?: LLM[]
  exclude_models?: LLM[]

  gpt_4o?: OpenAIModelConfig
  gpt_4o_mini?: OpenAIModelConfig
  claude_3_5_sonnet?: AnthropicModelConfig
  claude_3_haiku?: AnthropicModelConfig
  gemini_1_5_pro?: GoogleModelConfig
  gemini_1_5_flash?: GoogleModelConfig
  command_r_plus?: CohereModelConfig
  command_r?: CohereModelConfig
  llama_3_70b?: Llama_3_70B_ModelConfig
  llama_3_1_8b?: Llama_3_1_8B_ModelConfig
  llama_3_1_70b?: Llama_3_1_70B_ModelConfig
  llama_3_1_405b?: Llama_3_1_405B_ModelConfig
}

export interface FallbackConfig {
  fallback_model?: LLM
  max_model_fallback_attempts?: number
  max_provider_fallback_attempts?: number
}

export interface ToolsConfig {
  parallel_tool_use?: boolean
}

export interface Tool {
  type: 'function'
  function: Record<string, any>
}

export interface ToolCallFunction {
  name: string
  arguments: string
}

export interface ChoiceDeltaToolCallFunction {
  name?: string
  arguments?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: ToolCallFunction
}

export interface ChoiceDeltaToolCall {
  index: number
  id?: string
  type?: 'function'
  function?: ChoiceDeltaToolCallFunction
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatMessage {
  role: 'assistant' | 'user' | 'system' | 'tool'
  content: string
  tool_calls?: Array<ToolCall>
  tool_call_id?: string
  name?: string
}

export interface ChoiceDelta {
  role?: 'assistant' | 'user' | 'system' | 'tool'
  content?: string
  tool_calls?: Array<ChoiceDeltaToolCall>
}

export interface ChatCompletion {
  choices: Array<Choice>
  model: LLM
  provider: Provider
  usage: TokenUsage
}

export interface ChatCompletionChunk {
  choices: Array<ChunkChoice>
  model: LLM
  provider: Provider
  usage?: TokenUsage
}

export interface Choice {
  message: ChatMessage
}

export interface ChunkChoice {
  delta: ChoiceDelta
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call'
}

export interface Dials {
  quality: number
  cost: number
  speed?: number
}

export interface ChatCompletionParams {
  messages: ChatMessage[]
  dials: Dials
  provider_config: ProviderConfig
  router_model_config?: RouterModelConfig
  fallback_config?: FallbackConfig
  tools_config?: ToolsConfig
  stream?: boolean
  tools?: Tool[]
}

export interface ClientOptions {
  api_key: string
  base_url?: string
  dials?: Dials
  provider_config: ProviderConfig
  router_model_config?: RouterModelConfig
  fallback_config?: FallbackConfig
  stream?: boolean
  tools_config?: ToolsConfig
}
