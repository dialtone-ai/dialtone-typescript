import process from 'node:process'

export function readEnv(env: string): string | undefined {
  if (typeof process !== 'undefined')
    return process.env?.[env]?.trim() ?? undefined

  return undefined
}
