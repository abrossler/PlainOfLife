import { Component, ViewChild, ElementRef, OnInit, NgZone } from '@angular/core'
import { TurnListener, PlainOfLifeDriver } from '../model/pol.driver'

@Component({
  selector: 'app-lab-board',
  templateUrl: 'lab.component.html'
})
export class LabComponent implements TurnListener {
  @ViewChild('plainCanvas', { static: true })
  private plainCanvas: ElementRef<HTMLCanvasElement> | null = null

  @ViewChild('familyTreeCanvas', { static: true })
  private familyTreeCanvas: ElementRef<HTMLCanvasElement> | null = null

  private plainCtx: CanvasRenderingContext2D | null = null
  private plainDriver: PlainOfLifeDriver | undefined

  private familyTreeCtx: CanvasRenderingContext2D | null = null

  plainWidth = 250
  plainHeight = 150
  plainZoom = 5
  canvasWidth = this.plainWidth * this.plainZoom
  canvasHeight = this.plainHeight * this.plainZoom
  familyTreeWidth = this.canvasWidth
  familyTreeHeight = 400

  constructor(private ngZone: NgZone) {
  }

  ngAfterViewInit(): void {
    if (this.plainCanvas === null || this.familyTreeCanvas === null) {
      return
    }
    this.plainCtx = this.plainCanvas.nativeElement.getContext('2d')
    this.familyTreeCtx = this.familyTreeCanvas.nativeElement.getContext('2d')
    this.restart()

    document.addEventListener('visibilitychange', () => {
      console.log('Visibility changed2')
        if (document.visibilityState === 'visible') {
          console.log('Tab became visible2')
          this.ngZone.runOutsideAngular(() => this.plainDriver?.switchToForeground()) // Avoid running angular change detection for every new turn
         } else {
          console.log('Tab became invisible2')
          setTimeout(() => {  
            if(document.visibilityState !== 'visible'){ // Still not visible after timeout
              console.log('Tab still invisible2')
              this.plainDriver?.switchToBackground()
        }
        }, 5000)
      }
    })

  }

  paint(): void {
    if (this.plainCtx === null || this.familyTreeCtx === null || !this.plainDriver) {
      return
    }

    const img = this.plainCtx.createImageData(this.canvasWidth, this.canvasHeight)
    if (this.plainDriver.plainOfLife) {
      this.plainDriver.plainOfLife.getPlainImage(img.data)
      this.plainCtx.putImageData(img, 0, 0)

      // const familyTreeImage = new ImageData(
      //   this.plainDriver.plainOfLife.getFamilyTreeImage(),
      //   this.familyTreeWidth,
      //   this.familyTreeHeight
      // )
      // this.familyTreeCtx.putImageData(familyTreeImage, 0, 0)
    }
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
    this.plainDriver.init(this.plainWidth, this.plainHeight, this.familyTreeWidth, this.familyTreeHeight)
    this.plainDriver.addOnTurnListener(this)
    this.paint()
  }

  onTurnExecuted(board: PlainOfLifeDriver): void {
    this.paint()
  }

  traceChangeDetection() {
    //console.log('ChangeDetection running...')
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
