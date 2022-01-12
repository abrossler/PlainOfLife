import { Component, ViewChild, ElementRef, OnInit, NgZone } from '@angular/core'
import { TurnListener } from '../model/turn.listener.interface'
import { PlainOfLifeDriver } from '../model/plain_of_life_driver'

@Component({
  selector: 'app-lab-board',
  templateUrl: 'lab.component.html'
})
export class LabComponent implements OnInit, TurnListener {
  @ViewChild('plainCanvas', { static: true })
  private plainCanvas: ElementRef<HTMLCanvasElement> | null = null

  private plainCtx: CanvasRenderingContext2D | null = null
  private plainDriver: PlainOfLifeDriver | undefined

  plainWidth = 250
  plainHeight = 150
  plainZoom = 5
  canvasWidth = this.plainWidth * this.plainZoom
  canvasHeight = this.plainHeight * this.plainZoom

  constructor(private ngZone: NgZone) {
    this.restart()
  }

  ngOnInit(): void {
    if (this.plainCanvas === null) {
      return
    }
    this.plainCtx = this.plainCanvas.nativeElement.getContext('2d')
    this.paint()
  }

  paint(): void {
    if (this.plainCtx === null || !this.plainDriver) {
      return
    }

    const img = this.plainCtx.createImageData(this.canvasWidth, this.canvasHeight)

    this.plainDriver.plainOfLife?.getPlainImage(img.data)
    this.plainCtx.putImageData(img, 0, 0)

    // Scaling
    // https://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas
  }

  start(): void {
    console.log('LabComponent.start()')
    this.ngZone.runOutsideAngular(() => this.plainDriver?.start()) // Avoid running angular change detection for every new turn
  }

  stop(): void {
    if (!this.plainDriver) {
      return
    }

    console.log('LabComponent.stop()')
    this.plainDriver.stop()
  }

  step(): void {
    if (!this.plainDriver) {
      return
    }

    console.log('LabComponent.step()')
    this.plainDriver.step()
  }

  restart(): void {
    console.log('LabComponent.restart()')
    this.plainDriver?.stop()
    this.plainDriver = new PlainOfLifeDriver()
    this.plainDriver.init(this.plainWidth, this.plainHeight)
    this.plainDriver.addOnTurnListener(this)
    this.paint()
  }

  onTurnExecuted(board: PlainOfLifeDriver): void {
    this.paint()
  }

  traceChangeDetection() {
    console.log('Ping!')
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
