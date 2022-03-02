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
      this.polDriver.plainOfLife.getFamilyTreeImage(),
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
