# claude-mods

Mods (function-hook plugins) for [Claude Code](https://claude.com/claude-code).

## visited-sites

See every website Claude Code visits during a session, live.

- **Status line** under the prompt: `🌐 4 sites · 2 searches · last: docs.anthropic.com · /sites`
- **`/sites`** opens a pane listing each visit with time, how it was reached and the full URL or query
- **`/sites clear`** resets the list

Tracks `WebFetch` URLs, `WebSearch` queries, browser navigation (any MCP tool given an `http(s)` URL, e.g. Claude in Chrome) and URLs in `curl` / `wget` / `httpie` commands. Failed or blocked requests show in red.

### Install

```sh
git clone git@github.com:petricbranko/claude-mods.git ~/.claude/mods
claude --plugin-dir ~/.claude/mods/visited-sites
```

To load it in every session, add to the `env` block of `~/.claude/settings.json`:

```json
"CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/visited-sites"
```

### Develop

```sh
claude plugin validate visited-sites
claude plugin test visited-sites
```
