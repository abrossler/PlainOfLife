import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { PolTurnListener, PolDriver } from '../model/pol_driver.model'
import { LogService } from '../log.service'
import { RawAssembler } from '../pol/cells/raw_assembler'
import { WinCoherentAreas } from '../pol/rules/win_coherent_areas'

@Component({
  selector: 'app-lab-board',
  templateUrl: 'pol_lab.component.html'
})
export class PolLabComponent implements PolTurnListener, AfterViewInit {
  @ViewChild('plainCanvas', { static: true })
  private plainCanvas: ElementRef<HTMLCanvasElement> | null = null

  @ViewChild('familyTreeCanvas', { static: true })
  private familyTreeCanvas: ElementRef<HTMLCanvasElement> | null = null

  private plainCtx: CanvasRenderingContext2D | null = null
  private familyTreeCtx: CanvasRenderingContext2D | null = null

  private familyTreeScale: string
  private selectedFamilyTreeScale = ''

  plainWidth = 250
  plainHeight = 150
  plainZoom = 5
  canvasWidth = this.plainWidth * this.plainZoom
  canvasHeight = this.plainHeight * this.plainZoom
  familyTreeWidth = this.canvasWidth
  familyTreeHeight = 400

  constructor(private logger: LogService, private polDriver: PolDriver) {
    this.polDriver.init(
      this.plainWidth,
      this.plainHeight,
      WinCoherentAreas,
      RawAssembler,
      this.familyTreeWidth,
      this.familyTreeHeight
    )
    this.polDriver.addTurnListener(this)
    this.familyTreeScale = this.polDriver.plainOfLife.getFamilyTreeScales()[0]
  }

  ngAfterViewInit(): void {
    if (this.plainCanvas === null || this.familyTreeCanvas === null) {
      throw new Error('Plain or family tree canvas must not be null after init')
    }
    this.plainCtx = this.plainCanvas.nativeElement.getContext('2d')
    this.familyTreeCtx = this.familyTreeCanvas.nativeElement.getContext('2d')

    this.paint()
  }

  paint(): void {
    if (this.plainCtx === null || this.familyTreeCtx === null) {
      this.logger.warn('Paint called but context is not yet initialized')
      return
    }

    const img = this.plainCtx.createImageData(this.canvasWidth, this.canvasHeight)
    this.polDriver.plainOfLife.getPlainImage(img.data)
    this.plainCtx.putImageData(img, 0, 0)

    const familyTreeImage = new ImageData(
      this.polDriver.plainOfLife.getFamilyTreeImage(this.familyTreeScale),
      this.familyTreeWidth,
      this.familyTreeHeight
    )
    this.familyTreeCtx.putImageData(familyTreeImage, 0, 0)

    // Scaling
    // https://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas
  }

  start(): void {
    this.logger.info('LabComponent.start()')
    this.polDriver.start()
  }

  stop(): void {
    this.logger.info('LabComponent.stop()')
    this.polDriver.stop()
  }

  step(): void {
    this.logger.info('LabComponent.step()')
    this.polDriver.step()
  }

  restart(): void {
    this.logger.info('LabComponent.restart()')
    this.polDriver.init(
      this.plainWidth,
      this.plainHeight,
      WinCoherentAreas,
      RawAssembler,
      this.familyTreeWidth,
      this.familyTreeHeight
    )
    this.paint()
  }

  setFamilyTreeScale() {
    this.logger.info('LabComponent.setFamilyTreeScale()')
    this.familyTreeScale = this.selectedFamilyTreeScale
    this.paint()
  }

  selectFamilyTreeScale(scale: string) {
    this.logger.info('LabComponent.selectFamilyTreeScale()')
    this.selectedFamilyTreeScale = scale
  }

  getFamilyTreeScales() {
    return this.polDriver.plainOfLife.getFamilyTreeScales()
  }

  save(): void {
    this.logger.info('LabComponent.save()')
    this.polDriver.saveToFile()
  }

  async open(event: Event) {
    this.logger.info('LabComponent.open()')
    if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0) {
      const fileName = event.target.files[0].name
      try {
        await this.polDriver.openFromFile(event.target.files[0])
      } catch (e) {
        this.logger.error('Unable to open file ' + fileName)
        this.logger.debug('' + e)
      }
      this.paint()
    }
  }

  openFileSelector() {
    this.logger.info('LabComponent.openFileSelector()')
    // Workaround: Programmatically create a file input element and click it to create a file open dialog.
    // Using the input element directly in the drop-down looks strange - there a dropdown-item is needed...
    const fileSelector = document.createElement('input')
    fileSelector.setAttribute('type', 'file')
    fileSelector.addEventListener('change', (event) => this.open(event))
    fileSelector.click()
  }

  onTurnExecuted(): void {
    this.paint()
  }

  traceChangeDetection() {
    this.logger.debug('ChangeDetection executed...')
  }

  getCellTypes(): string[] {
    return ['Hallo']
  }

  setRestartCellType(typeName: string) {
    // let type = this.getCellTypes().find((type) => type.name === typeName)
    // if (type) {
    //   this.restartCellType = type
    // }
  }
}
