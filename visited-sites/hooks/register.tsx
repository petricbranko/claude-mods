import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Visit } from '../types'

const PANE = 'visited-sites'
const visits = atom({ plugin: 'visited-sites', key: 'visits' } as const, [])
const URL_IN_TEXT = /\bhttps?:\/\/[^\s'"`<>|)]+/g
const NETWORK_CMD = /\b(curl|wget|http|xh|httpie)\b/

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

// What a tool call reaches on the web, as [via, target] pairs.
export function targetsOf(e: { tool: string; [k: string]: unknown }): [string, string][] {
  if (e.tool === 'WebFetch' && typeof e.url === 'string') return [['fetch', e.url]]
  if (e.tool === 'WebSearch' && typeof e.query === 'string') return [['search', e.query]]
  if (e.tool === 'Bash' && typeof e.command === 'string' && NETWORK_CMD.test(e.command))
    return [...new Set(e.command.match(URL_IN_TEXT) ?? [])].map(u => ['bash', u])
  if (e.tool.startsWith('mcp__') && typeof e.url === 'string' && /^https?:\/\//.test(e.url))
    return [['browser', e.url]]
  return []
}

async function showStatus($: EngineInterface) {
  const list = await read($, visits)
  const hosts = new Set(list.filter(v => v.via !== 'search').map(v => v.host))
  const searches = list.filter(v => v.via === 'search').length
  const last = list[list.length - 1]
  $.ui.status(
    last === undefined
      ? undefined
      : `🌐 ${hosts.size} site${hosts.size === 1 ? '' : 's'}` +
          (searches ? ` · ${searches} search${searches === 1 ? '' : 'es'}` : '') +
          ` · last: ${last.via === 'search' ? `"${last.target.slice(0, 30)}"` : last.host} · /sites`,
  )
}

const openPane = ($: EngineInterface) => $.ui.open({ id: PANE, title: 'Websites visited' })

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'sites',
      description: 'Show websites Claude visited this session (/sites clear to reset)',
    })
    await showStatus($)
    return next(e)
  })

  on('command.run', { command: 'sites' }, async ($, e) => {
    if (e.args.trim() === 'clear') {
      await update($, visits, () => [])
      await showStatus($)
      return { text: 'Visited-sites list cleared.' }
    }
    await openPane($)
    const list = await read($, visits)
    return { text: `${list.length} visit${list.length === 1 ? '' : 's'} recorded. Pane opened.` }
  })

  on('tool.call', async ($, e, next) => {
    const found = targetsOf(e as { tool: string; [k: string]: unknown })
    if (found.length === 0) return next(e)

    const at = await $.clock.now()
    const fresh: Visit[] = found.map(([via, target]) => ({
      at, via, target, host: via === 'search' ? 'search' : hostOf(target), failed: false,
    }))
    await update($, visits, list => [...list, ...fresh].slice(-500))
    await showStatus($)

    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true)
      await update($, visits, list =>
        list.map(v => (fresh.some(f => f.at === v.at && f.target === v.target) ? { ...v, failed: true } : v)),
      )
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, visits)
    const room = Math.max(1, (e.viewport?.rows ?? 24) - 4)
    const width = Math.max(20, (e.viewport?.columns ?? 80) - 18)

    return (
      <Box flexDirection="column">
        {list.length === 0 && <Text dimColor>No websites visited yet.</Text>}
        {list.slice(-room).map(v => (
          <Text color={v.failed ? 'red' : undefined}>
            <Text dimColor>{new Date(v.at).toTimeString().slice(0, 5)} {v.via.padEnd(7)}</Text>
            {(v.via === 'search' ? `"${v.target}"` : v.target).slice(0, width)}
          </Text>
        ))}
      </Box>
    )
  })
}
