Read DUMP.md from the current project's root directory using `Read` with the absolute path (e.g. `Read("/path/to/project/DUMP.md")`). Do NOT use Glob to find it — DUMP.md may be a symlink and Glob does not follow symlinks.

## Step 1 — Run helper scripts (mechanical work, no LLM tokens)

If a `scripts/` directory exists in the LIFE project root (`/Users/nathanmoomaw/Sites/LIFE/scripts/`), run these first via Bash:

```bash
# Route all prefixed items (music:, work:, art:, writing:, life:, money:, code:)
python3 /Users/nathanmoomaw/Sites/LIFE/scripts/dump-route.py <DUMP.md path>

# Push any cal: items to Google Calendar
python3 /Users/nathanmoomaw/Sites/LIFE/scripts/cal-push.py --from-dump <DUMP.md path>
```

These handle routing and calendar items automatically. Check the output to see what was processed.

## Step 2 — Handle remaining items with LLM

After the scripts run, re-read DUMP.md. First scan for **priority items** — lines matching `[N]` where N is a digit (e.g., `[1]`, `[2]`). Handle ALL priority items first, in numeric order, before touching any `[]` items. Priority items get an immediate answer or result surfaced to the user. Mark them `[x]` when done.

Then handle standard unchecked items (lines starting with `[]`):
1. Read the relevant source code to understand current state
2. Implement the feature/fix described
3. Mark it complete in DUMP.md by changing `[]` to `[x]`

Skip items that start with `[-]` — those are personal parent markers with `-` sub-notes below them. Not tasks.

**Inline annotations are OFF by default.** Do NOT append notes after `[x]` items unless the user says "dump with notes" or `DUMP_NOTES=true` is set in project CLAUDE.md.

## Step 3 — Commit and push

After all items are done, update CLAUDE.md, DEVLOG.md, ROADMAP.md, and MEMORY.md as needed, then run:

```bash
bash /Users/nathanmoomaw/Sites/LIFE/scripts/dump-git.sh "brief description of what was done"
```

If dump-git.sh is not available, commit and push manually following the project's git workflow.
