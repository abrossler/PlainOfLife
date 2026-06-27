<script lang="ts">
  import { onMount } from 'svelte'
  import { PolDriver, type PolTurnListener } from './driver/pol_driver'
  import { RawAssembler } from './pol/cells/raw_assembler'
  import { WinCoherentAreas } from './pol/rules/win_coherent_areas'

  // Plain of Life geometry — matches the original Angular UI
  const plainWidth = 250
  const plainHeight = 150
  const plainZoom = 5
  const canvasWidth = plainWidth * plainZoom
  const canvasHeight = plainHeight * plainZoom
  const familyTreeWidth = canvasWidth
  const familyTreeHeight = 400

  // --- Driver setup ---
  // The driver owns the simulation. We create it once at component load and never replace it.
  const driver = new PolDriver()
  driver.init(plainWidth, plainHeight, WinCoherentAreas, RawAssembler, familyTreeWidth, familyTreeHeight)

  // --- Reactive UI state ---
  // $state() makes these reactive — when they change, anything reading them re-renders.
  // This is Svelte 5's "runes" syntax (the modern replacement for the older `let x = ...` reactivity).
  let isRunning = $state(false)
  let familyTreeScales: string[] = $state(driver.plainOfLife.getFamilyTreeScales())
  let familyTreeScale = $state(familyTreeScales[0])
  let selectedScale = $state(familyTreeScale)
  let showScaleDialog = $state(false)
  let showRestartDialog = $state(false)
  let currentTurn = $state(0n)
  let cellCount = $state(0)

  // --- Canvas refs ---
  // bind:this populates these after the canvas elements are mounted in the DOM.
  let plainCanvas: HTMLCanvasElement
  let familyTreeCanvas: HTMLCanvasElement
  let plainCtx: CanvasRenderingContext2D | null = null
  let familyTreeCtx: CanvasRenderingContext2D | null = null

  // --- Paint logic — copied verbatim from PolLabComponent.paint() ---
  function paint(): void {
    if (!plainCtx || !familyTreeCtx) return

    const img = plainCtx.createImageData(canvasWidth, canvasHeight)
    driver.plainOfLife.getPlainImage(img.data)
    plainCtx.putImageData(img, 0, 0)

    const familyTreeImage = new ImageData(
      driver.plainOfLife.getFamilyTreeImage(familyTreeScale),
      familyTreeWidth,
      familyTreeHeight
    )
    // Paint the family tree with the scrolling-effect cut from the original component
    const imageCutX = driver.plainOfLife.getFamilyTreeImageCutX(familyTreeScale)
    familyTreeCtx.putImageData(familyTreeImage, familyTreeWidth - imageCutX, 0, 0, 0, imageCutX, familyTreeHeight)
    familyTreeCtx.putImageData(familyTreeImage, -imageCutX, 0, imageCutX, 0, familyTreeWidth - imageCutX, familyTreeHeight)

    // Update status readouts at most once per paint, not every turn (cheap enough but
    // setting state every turn would re-render every turn — paint() is throttled by rAF
    // effectively because turns run on setInterval(0) and the browser paints when it can).
    currentTurn = driver.plainOfLife.currentTurn
    cellCount = driver.plainOfLife.cellCount
  }

  // Register as a turn listener — paint() runs after every foreground turn.
  const turnListener: PolTurnListener = { onTurnExecuted: paint }
  driver.addTurnListener(turnListener)

  onMount(() => {
    plainCtx = plainCanvas.getContext('2d')
    familyTreeCtx = familyTreeCanvas.getContext('2d')
    paint()
  })

  // --- Control handlers ---
  function start() {
    driver.start()
    isRunning = driver.isRunning
  }

  function stop() {
    driver.stop()
    isRunning = driver.isRunning
  }

  function step() {
    driver.step()
  }

  function confirmRestart() {
    driver.init(plainWidth, plainHeight, WinCoherentAreas, RawAssembler, familyTreeWidth, familyTreeHeight)
    isRunning = false
    showRestartDialog = false
    paint()
  }

  function applyScale() {
    familyTreeScale = selectedScale
    showScaleDialog = false
    paint()
  }

  function save() {
    driver.saveToFile()
  }

  function openFile() {
    // Programmatic file input — same trick as the Angular original.
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.addEventListener('change', async (event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        try {
          await driver.openFromFile(target.files[0])
          isRunning = false
          paint()
        } catch (e) {
          console.error('Unable to open file', e)
        }
      }
    })
    input.click()
  }
</script>

<main>
  <header>
    <h1>Plain of Life</h1>
    <div class="status">
      <span>Turn: <strong>{currentTurn}</strong></span>
      <span>Cells: <strong>{cellCount}</strong></span>
      <span>Status: <strong>{isRunning ? 'Running' : 'Stopped'}</strong></span>
    </div>
  </header>

  <nav class="controls">
    {#if !isRunning}
      <button onclick={start}>Start</button>
    {:else}
      <button onclick={stop}>Stop</button>
    {/if}
    <button onclick={step} disabled={isRunning}>Step</button>
    <button onclick={() => (showRestartDialog = true)}>Restart…</button>
    <button onclick={save}>Save</button>
    <button onclick={openFile}>Open…</button>
    <button onclick={() => { selectedScale = familyTreeScale; showScaleDialog = true }}>
      Family Tree Scale… ({familyTreeScale})
    </button>
  </nav>

  <section class="canvases">
    <canvas bind:this={plainCanvas} width={canvasWidth} height={canvasHeight}></canvas>
    <canvas bind:this={familyTreeCanvas} width={familyTreeWidth} height={familyTreeHeight}></canvas>
  </section>

  {#if showRestartDialog}
    <div class="modal-backdrop" onclick={() => (showRestartDialog = false)} role="presentation">
      <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
        <h2>Restart simulation?</h2>
        <p>Current state will be lost. Save first if you want to keep it.</p>
        <div class="modal-actions">
          <button onclick={() => (showRestartDialog = false)}>Cancel</button>
          <button onclick={confirmRestart}>Restart</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showScaleDialog}
    <div class="modal-backdrop" onclick={() => (showScaleDialog = false)} role="presentation">
      <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
        <h2>Family Tree Scale</h2>
        <div class="scale-options">
          {#each familyTreeScales as scale (scale)}
            <label>
              <input type="radio" name="scale" value={scale} bind:group={selectedScale} />
              {scale}
            </label>
          {/each}
        </div>
        <div class="modal-actions">
          <button onclick={() => (showScaleDialog = false)}>Cancel</button>
          <button onclick={applyScale}>Apply</button>
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    padding: 1rem;
    max-width: 1300px;
    margin: 0 auto;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .status {
    display: flex;
    gap: 1.5rem;
    font-size: 0.9rem;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .controls button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: #f8f8f8;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .controls button:hover:not(:disabled) {
    background: #e8e8e8;
  }

  .controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .canvases {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  canvas {
    border: 1px solid #ccc;
    display: block;
    max-width: 100%;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
  }

  .modal h2 {
    margin-top: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .modal-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: #f8f8f8;
    border-radius: 4px;
    cursor: pointer;
  }

  .scale-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }
</style>
