/**
 * Headless Plain of Life runner — no browser required.
 *
 * Runs a simulation from the command line and saves periodic snapshots to disk.
 * Snapshots can be loaded back in the browser UI via "Open file".
 *
 * Usage:
 *   npx tsx src/server/pol_runner.ts [options]
 *   npm run run-sim -- [options]
 *
 * Options:
 *   --rules <name>       Rules class name (default: "Win Coherent Areas")
 *   --cell <name>        Cell class name  (default: "Raw Assembler")
 *   --turns <n>          Total turns to run (default: 1000000)
 *   --save-every <n>     Save a snapshot every N turns (default: 100000)
 *   --load <file>        Load from a saved JSON file instead of --rules/--cell
 *   --output-dir <dir>   Output directory for snapshots (default: saved-plains)
 *
 * Names are matched case- and whitespace/dash-insensitively, so "WinCoherentAreas",
 * "win-coherent-areas", and "Win Coherent Areas" all refer to the same rules class.
 *
 * Plain size is fixed at 250×150 to match the UI canvas. A simulation can contain
 * cells of multiple types simultaneously — the seed cell type only determines how
 * the population starts.
 */

import { parseArgs } from 'node:util'
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { PlainOfLife } from '../pol/core/plain_of_life.js'
import type { ExtPlainOfLife } from '../pol/core/plain_of_life.js'
import type { RuleExtensionFactory } from '../pol/core/rule_extension_factory.js'
import { ruleNames } from '../pol/rules/rules_names.js'
import { cellNames } from '../pol/cells/cell_names.js'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Plain size matches the UI canvas exactly */
const PLAIN_WIDTH = 250
const PLAIN_HEIGHT = 150
const FAMILY_TREE_WIDTH = 1250
const FAMILY_TREE_HEIGHT = 400

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_RULES = 'Win Coherent Areas'
const DEFAULT_CELL = 'Raw Assembler'
const DEFAULT_TURNS = 1_000_000
const DEFAULT_SAVE_EVERY = 100_000
const DEFAULT_OUTPUT_DIR = 'saved-plains'
const LOG_EVERY = 1000n

// ── CLI argument parsing ──────────────────────────────────────────────────────

const { values } = parseArgs({
  options: {
    rules: { type: 'string' },
    cell: { type: 'string' },
    turns: { type: 'string' },
    'save-every': { type: 'string' },
    load: { type: 'string' },
    'output-dir': { type: 'string' },
  },
  strict: true,
})

// ── Name normalization ────────────────────────────────────────────────────────

/**
 * Normalize a name for fuzzy matching: lowercase, strip spaces and dashes.
 * "WinCoherentAreas", "win-coherent-areas", "Win Coherent Areas" all → "wincoherentareas"
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[\s\-]/g, '')
}

/**
 * Look up a constructor by name, matching case- and whitespace/dash-insensitively.
 * Returns [canonicalName, constructor] or throws if not found.
 */
function resolveByName<C extends new () => unknown>(
  map: { getNames(): string[]; getConstructor(name: string): C | undefined },
  input: string,
  kind: string
): [string, C] {
  const names = map.getNames()
  const match = names.find((n) => normalize(n) === normalize(input))
  if (!match) {
    console.error(`[pol-runner] Unknown ${kind}: "${input}"`)
    console.error(`[pol-runner] Available: ${names.join(', ')}`)
    process.exit(1)
  }
  return [match, map.getConstructor(match)!]
}

// ── Setup ─────────────────────────────────────────────────────────────────────

const totalTurns = values['turns'] !== undefined ? parseInt(values['turns'], 10) : DEFAULT_TURNS
const saveEvery = values['save-every'] !== undefined ? parseInt(values['save-every'], 10) : DEFAULT_SAVE_EVERY
const outputDir = resolve(values['output-dir'] ?? DEFAULT_OUTPUT_DIR)

if (!Number.isInteger(totalTurns) || totalTurns < 1) {
  console.error('[pol-runner] --turns must be a positive integer')
  process.exit(1)
}
if (!Number.isInteger(saveEvery) || saveEvery < 1) {
  console.error('[pol-runner] --save-every must be a positive integer')
  process.exit(1)
}

mkdirSync(outputDir, { recursive: true })

/**
 * Scan the output folder for existing POL<n>_* files and return the next run index.
 * Example: if POL1_... and POL3_... exist, returns 4.
 */
function nextRunIndex(): number {
  const files = readdirSync(outputDir)
  let max = 0
  for (const file of files) {
    const m = file.match(/^POL(\d+)_/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return max + 1
}

const runIndex = nextRunIndex()

// ── Initialize simulation ─────────────────────────────────────────────────────

let pol: ExtPlainOfLife<RuleExtensionFactory>
let rulesLabel: string

if (values['load']) {
  const loadPath = resolve(values['load'])
  console.log(`[pol-runner] Loading from ${loadPath}`)
  const data = JSON.parse(readFileSync(loadPath, 'utf-8'))
  pol = PlainOfLife.createFromSerializable(data)
  rulesLabel = pol.getRulesName().replace(/\s/g, '')
  console.log(`[pol-runner] Loaded at turn ${pol.currentTurn} | run: POL${runIndex} | rules: ${pol.getRulesName()} | ${pol.cellCount} cells`)
} else {
  const rulesName = values['rules'] ?? DEFAULT_RULES
  const cellName = values['cell'] ?? DEFAULT_CELL
  const [canonicalRules, RulesCtor] = resolveByName(ruleNames, rulesName, 'rules')
  const [canonicalCell, CellCtor] = resolveByName(cellNames, cellName, 'cell')
  rulesLabel = canonicalRules.replace(/\s/g, '')
  console.log(`[pol-runner] Starting new simulation | run: POL${runIndex} | rules: ${canonicalRules} | seed cell: ${canonicalCell}`)
  console.log(`[pol-runner] Plain: ${PLAIN_WIDTH}×${PLAIN_HEIGHT} | target turns: ${totalTurns} | save every: ${saveEvery}`)
  pol = PlainOfLife.createNew(PLAIN_WIDTH, PLAIN_HEIGHT, RulesCtor, CellCtor, FAMILY_TREE_WIDTH, FAMILY_TREE_HEIGHT)
}

// ── Save helper ───────────────────────────────────────────────────────────────

let filesSaved = 0

function saveSnapshot(): void {
  const fileName = `POL${runIndex}_Turn${pol.currentTurn}_${rulesLabel}.json`
  const filePath = join(outputDir, fileName)
  writeFileSync(filePath, JSON.stringify(pol.toSerializable()))
  filesSaved++
  console.log(`[pol-runner] Saved ${filePath}`)
}

// ── Run loop ──────────────────────────────────────────────────────────────────

const startTurn = pol.currentTurn
const targetTurn = startTurn + BigInt(totalTurns)

const wallStart = performance.now()

function runNext(): void {
  if (pol.isGameOver) {
    console.log(`[pol-runner] Game over at turn ${pol.currentTurn}`)
    finish()
    return
  }

  if (pol.currentTurn >= targetTurn) {
    finish()
    return
  }

  const t0 = performance.now()
  pol.executeTurn()

  if (pol.currentTurn % LOG_EVERY === 0n) {
    const dt = performance.now() - t0
    const cellCount = pol.cellCount
    const timePerCell = cellCount > 0 ? (dt / cellCount).toFixed(5) : 'n/a'
    console.log(`[pol-runner] Turn ${pol.currentTurn} | ${cellCount} cells | ${dt.toFixed(1)} ms/turn | ${timePerCell} ms/cell`)
  }

  if (pol.currentTurn % BigInt(saveEvery) === 0n) {
    saveSnapshot()
  }

  setImmediate(runNext)
}

function finish(): void {
  // Save final state if not already saved at this turn
  if (pol.currentTurn % BigInt(saveEvery) !== 0n) {
    saveSnapshot()
  }
  const wallMs = performance.now() - wallStart
  const turnsRun = pol.currentTurn - startTurn
  console.log(`[pol-runner] Done. ${turnsRun} turns in ${(wallMs / 1000).toFixed(1)} s | ${filesSaved} files saved to ${outputDir}`)
}

setImmediate(runNext)
