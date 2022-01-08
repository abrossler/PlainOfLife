import { Component, ViewChild, ElementRef, OnInit, NgZone } from '@angular/core'
import { TurnListener } from '../model/turn.listener.interface'
import { PlainOfLifeDriver } from '../model/plain_of_life_driver'
import { CellBase } from '../model/cell.base'
import { SimpleCell } from '../model/cells/simple.cell'

@Component({
  selector: 'app-lab-board',
  templateUrl: 'lab.component.html'
})
export class LabComponent implements OnInit, TurnListener {
  @ViewChild('canvas', { static: true })
  private canvas: ElementRef<HTMLCanvasElement> | null = null

  @ViewChild('plainCanvas', { static: true })
  private plainCanvas: ElementRef<HTMLCanvasElement> | null = null

  private ctx: CanvasRenderingContext2D | null = null
  private plainCtx: CanvasRenderingContext2D | null = null
  private plainDriver: PlainOfLifeDriver | undefined

  private plainWidth = 1000
  private plainHeight = 400

  constructor(private ngZone: NgZone) {
    this.restart()
  }

  ngOnInit(): void {
    if (this.canvas === null || this.plainCanvas === null) {
      return
    }
    this.ctx = this.canvas.nativeElement.getContext('2d')
    this.plainCtx = this.plainCanvas.nativeElement.getContext('2d')
    this.paint()
  }

  paint(): void {
    if (this.ctx === null || this.plainCtx === null || !this.plainDriver) {
      return
    }

    const canvas = this.ctx.canvas
    let img = this.ctx.createImageData(this.plainWidth, this.plainHeight)
    this.plainDriver.getImage(img.data)
    this.ctx.putImageData(img, 20, 20)

    this.plainDriver.plainOfLife?.getPlainImage(img.data)
    this.plainCtx.putImageData(img, 20, 20)

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
    console.log(this.restartCellType)
    this.plainDriver = new PlainOfLifeDriver()
    this.plainDriver.init(this.plainWidth, this.plainHeight, this.restartCellType)
    this.plainDriver.addOnTurnListener(this)
    this.paint()
  }

  onTurnExecuted(board: PlainOfLifeDriver): void {
    this.paint()
  }

  traceChangeDetection() {
    console.log('Ping!')
  }

  getCellTypes(): (new () => CellBase)[] {
    return [SimpleCell]
  }

  public restartCellType: new () => CellBase = SimpleCell

  setRestartCellType(typeName: string) {
    let type = this.getCellTypes().find((type) => type.name === typeName)
    if (type) {
      this.restartCellType = type
    }
  }
}
