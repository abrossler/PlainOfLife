import { Component, ViewChild, ElementRef, OnInit, NgZone } from '@angular/core';
import { TurnListener } from '../model/turn.listener.interface';
import { Board } from '../model/board';
import { CellBase } from '../model/cell.base';
import { SimpleCell } from '../model/cells/simple.cell';

@Component({
    selector: 'app-lab-board',
    templateUrl: 'lab.component.html'
})
export class LabComponent implements OnInit, TurnListener  {
    @ViewChild('canvas', { static: true })
    private canvas: ElementRef<HTMLCanvasElement> | null = null;  
    
    private ctx: CanvasRenderingContext2D | null = null;
    private board: Board | undefined;

    private boardSizeX = 1000;
    private boardSizeY = 400

    constructor( private ngZone: NgZone ){
        this.restart();
    }

    ngOnInit(): void {
        if( this.canvas === null){
            return;
        }
        this.ctx = this.canvas.nativeElement.getContext('2d');
        this.paint();
    }
    
    paint(): void {
        if( this.ctx === null  ||  !this.board ) {
            return;
        }

        const canvas = this.ctx.canvas;
        let img = this.ctx.createImageData(this.boardSizeX, this.boardSizeY);
        this.board.getImage( img.data );

        this.ctx.putImageData(img, 20,20);
        // Scaling
        // https://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas
    }

    start(): void {
        console.log( 'LabComponent.start()' );
        this.ngZone.runOutsideAngular(() => this.board?.start() ); // Avoid running angular change detection for every new turn
    }

    stop(): void {
        if( !this.board ) { return; }

        console.log( 'LabComponent.stop()' );
        this.board.stop();
    }

    step(): void {
        if( !this.board ) { return; }

        console.log( 'LabComponent.step()' );
        this.board.step();
    }

    restart( ): void {
        console.log( 'LabComponent.restart()' );
        this.board?.stop();
        console.log(this.restartCellType);
        this.board = new Board( );
        this.board.init( this.boardSizeX, this.boardSizeY, this.restartCellType );
        this.board.registerOnTurn( this );
        this.paint();
    }

    onTurnExecuted(board: Board): void {
        this.paint( );
    }

    traceChangeDetection(){
        console.log( 'Ping!' );
    }
    

    getCellTypes(): (new () => CellBase)[] {
        return [SimpleCell];
    }

    public restartCellType: (new () => CellBase) = SimpleCell;

    setRestartCellType( typeName: string ){
        let type = this.getCellTypes().find( type => type.name === typeName );
        if( type ){
            this.restartCellType = type;
        }
    }

  }

