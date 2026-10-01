import { describe, expect, test } from 'claude-code/testing'

import { targetsOf } from '../hooks/register'

describe('targetsOf', () => {
  test('WebFetch, WebSearch and browser navigate are recorded', async () => {
    expect(targetsOf({ tool: 'WebFetch', url: 'https://a.com/x', prompt: '' })).toEqual([['fetch', 'https://a.com/x']])
    expect(targetsOf({ tool: 'WebSearch', query: 'claude mods' })).toEqual([['search', 'claude mods']])
    expect(targetsOf({ tool: 'mcp__claude-in-chrome__navigate', url: 'https://b.io' })).toEqual([['browser', 'https://b.io']])
  })

  test('curl URLs in Bash are recorded, other commands are not', async () => {
    expect(targetsOf({ tool: 'Bash', command: 'curl -s "https://api.x.dev/v1?q=1" | jq .' })).toEqual([['bash', 'https://api.x.dev/v1?q=1']])
    expect(targetsOf({ tool: 'Bash', command: 'echo https://not-visited.com' })).toEqual([])
    expect(targetsOf({ tool: 'Read', file_path: '/x' })).toEqual([])
  })
})
