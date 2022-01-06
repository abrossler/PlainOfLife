import { CellBase } from './cell.base';
import { SimpleCell } from './cells/simple.cell';
import { ModelModule } from './model.module';
import { TurnListener } from './turn.listener.interface';

//let debug = true;
let debug = false;

export class Board {

    static readonly MOVE_OR_REPRODUCE = 0b00001000;
    static readonly POSITION = 0b00000111;

    private sizeX = 0;
    private sizeY = 0;

    private cellConstructor!: new () => CellBase;
    private turnListeners: TurnListener[] = [];
    private interval: number | undefined;
    private cells1: (CellBase | undefined | null)[] = [];
    private cells2: (CellBase | undefined | null)[] = [];

    private currentTurn = 0;
    public init( sizeX: number, sizeY: number, cellConstructor: (new () => CellBase ) ) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.currentTurn = 0;
        this.cellConstructor = cellConstructor;

        this.cells1 = new Array<CellBase>(this.sizeX * this.sizeX);
        for( let i=0; i<this.cells1.length; i++){
            let rand = Math.random();
            if( rand > 0.97 ){
                this.cells1[i] = this.cells2[i] = new this.cellConstructor();
            } else if( rand > 0.94 ) {
                this.cells1[i] = this.cells2[i] = null;
            }
        }


        // this.cells1 = new Array<CellBase>(this.sizeX * this.sizeX);
        // for( let i=0; i<this.cells1.length; i++){
        //     let rand = Math.random();
        //     if( rand > 0.97 ){
        //         this.cells1[i] = new this.cellConstructor();
        //     } else if( rand > 0.94 ) {
        //         this.cells1[i] = null;
        //     }
        // }  
        
        // this.cells1[10000] = null;
        // this.cells1[10001] = null;
        // this.cells1[10002] = null;

    }

    public isRunning(): boolean {
        return( this.interval !== undefined )
    }

    public start(): void {
        if( this.isRunning() ){
            return;
        }
        this.interval = window.setInterval(() => {
            this.run( );
        }, 100);  
    }

    public stop(): void {
        if( !this.isRunning() ){
            return;
        }
        window.clearInterval(this.interval);
        this.interval = undefined;
    }

    public step(): void {
        if( this.isRunning() ){
            return;
        }
        this.run( );
    }

    public registerOnTurn( listener: TurnListener): void{
        this.turnListeners.push( listener );
    }

    private run( ): void {
        this.executeTurn();
        this.currentTurn ++;
        
        for( let listener of this.turnListeners ){
            listener.onTurnExecuted( this );
        }
    }

    protected executeTurn( ): void{

        let i = this.sizeX + 1;
        let input = new Uint8Array(2);
        let output = new Uint8Array(2);
        let conflictIndices: number[] = [];
        for( let y=1; y<this.sizeY-1; y++){
            for( let x=1; x<this.sizeX-1; x++){

                // Prepare input
                if(this.cells2[i] !== undefined  &&  this.cells2[i] !== null ){
                    input[0] = input[1] = 0b00000000;
                    output[0] = output[1] = 0b00000000;

                    let iMinusSizeX = i-this.sizeX;
                    let iPlusSizeX = i+this.sizeX;

                    if(debug){
                        console.log( "Cell Neighbours" );
                        let s = "";
                        if( this.cells2[iMinusSizeX-1] !== undefined ) { s += "X"; } else { s += "."; }
                        if( this.cells2[iMinusSizeX] !== undefined ) { s += "X"; } else { s += "."; }
                        if( this.cells2[iMinusSizeX+1] !== undefined ) { s += "X"; } else { s += "."; }
                        console.log( s );
                        s = "";
                        if( this.cells2[i-1] !== undefined ) { s += "X"; } else { s += "."; }
                        s += "O";
                        if( this.cells2[i+1] !== undefined ) { s += "X"; } else { s += "."; }
                        console.log( s );
                        s = "";
                        if( this.cells2[iPlusSizeX-1] !== undefined ) { s += "X"; } else { s += "."; }
                        if( this.cells2[iPlusSizeX] !== undefined ) { s += "X"; } else { s += "."; }
                        if( this.cells2[iPlusSizeX+1] !== undefined ) { s += "X"; } else { s += "."; }
                        console.log( s );
                    }

                    if( this.cells2[iMinusSizeX] !== undefined ){
                        input[0] |= 0b00000001;
                        if( this.cells2[iMinusSizeX] !== null ){ input[1] |= 0b00000001; }
                    }
                    if( this.cells2[iMinusSizeX+1] !== undefined ){
                        input[0] |= 0b00000010;
                        if( this.cells2[iMinusSizeX+1] !== null ){ input[1] |= 0b00000010; }
                    }
                    if( this.cells2[i+1] !== undefined ){
                        input[0] |= 0b00000100;
                        if( this.cells2[i+1] !== null ){ input[1] |= 0b00000100; }
                    }
                    if( this.cells2[iPlusSizeX+1] !== undefined ){
                        input[0] |= 0b00001000;
                        if( this.cells2[iPlusSizeX+1] !== null ){ input[1] |= 0b00001000; }
                    }
                    if( this.cells2[iPlusSizeX] !== undefined ){
                        input[0] |= 0b00010000;
                        if( this.cells2[iPlusSizeX] !== null ){ input[1] |= 0b00010000; }
                    }
                    if( this.cells2[iPlusSizeX-1] !== undefined ){
                        input[0] |= 0b00100000;
                        if( this.cells2[iPlusSizeX-1] !== null ){ input[1] |= 0b00100000; }
                    }
                    if( this.cells2[i-1] !== undefined ){
                        input[0] |= 0b01000000;
                        if( this.cells2[i-1] !== null ){ input[1] |= 0b01000000; }
                    }
                    if( this.cells2[iMinusSizeX-1] !== undefined ){
                        input[0] |= 0b10000000;
                        if( this.cells2[iMinusSizeX-1] !== null ){ input[1] |= 0b10000000; }
                    }

                    if( debug ) {
                        console.log( "Input[0]: " + input[0].toString(2).padStart(8, "0") );
                        console.log( "Input[1]: " + input[1].toString(2).padStart(8, "0") );
                    }

                    // Execute turn
                    this.cells2[i]!.executeTurn(input, output);

                    if( debug ) {
                        console.log( "Output[0]: " + output[0].toString(2).padStart(8, "0") );
                        console.log( "Output[1]: " + output[1].toString(2).padStart(8, "0") );
                    }

                    // Process output
                    // Either move or reproduce...
                    if( output[0] & Board.MOVE_OR_REPRODUCE ){
                        // Get Position where to move or reproduce
                        let newPosition = output[0] & Board.POSITION;
                        let newIndex;
                        switch( newPosition ){
                            case 0: newIndex = iMinusSizeX; break;
                            case 1: newIndex = iMinusSizeX+1; break;
                            case 2: newIndex = i+1; break;
                            case 3: newIndex = iPlusSizeX+1; break;
                            case 4: newIndex = iPlusSizeX; break;
                            case 5: newIndex = iPlusSizeX-1; break;
                            case 6: newIndex = i-1; break;
                            default: newIndex = iMinusSizeX-1; break;
                        }
                        // Reproduce if position is free
                        if( this.cells2[newIndex] === undefined){
                            if( this.cells1[newIndex] !== undefined  &&  this.cells1[newIndex] !== null){
                                conflictIndices.push( newIndex );
                            }
                            this.cells1[newIndex] = this.cells2[i]!.reproduce();

                        // Move if position is occupied by standard cell
                        } else if( this.cells2[newIndex] === null){
                            if( this.cells1[newIndex] !== undefined  &&  this.cells1[newIndex] !== null){
                                conflictIndices.push( newIndex );
                            }
                            this.cells1[newIndex] = this.cells2[i];
                            this.cells1[i] = undefined;             
                        }

                    // ... or set / kill other cells
                    } else {
                        if( output[1] & 0b00000001 ){
                            if( this.cells2[iMinusSizeX] === undefined ){
                                if( this.cells1[iMinusSizeX] === undefined ) { this.cells1[iMinusSizeX] = null }
                            } else if( this.cells2[iMinusSizeX] === null ){
                                if( this.cells1[iMinusSizeX] === null ) { this.cells1[iMinusSizeX] = undefined }
                            }
                        }
                        if( output[1] & 0b00000010 ){
                            if( this.cells2[iMinusSizeX+1] === undefined ){
                                if( this.cells1[iMinusSizeX+1] === undefined ) { this.cells1[iMinusSizeX+1] = null }
                            } else if( this.cells2[iMinusSizeX+1] === null ){
                                if( this.cells1[iMinusSizeX+1] === null ) { this.cells1[iMinusSizeX+1] = undefined }
                            }
                        }
                        if( output[1] & 0b00000100 ){
                            if( this.cells2[i+1] === undefined ){
                                if( this.cells1[i+1] === undefined ) { this.cells1[i+1] = null }
                            } else if( this.cells2[i+1] === null ){
                                if( this.cells1[i+1] === null ) { this.cells1[i+1] = undefined }
                            }
                        }                        
                        if( output[1] & 0b00001000 ){
                            if( this.cells2[iPlusSizeX+1] === undefined ){
                                if( this.cells1[iPlusSizeX+1] === undefined ) { this.cells1[iPlusSizeX+1] = null }
                            } else if( this.cells2[iPlusSizeX+1] === null ){
                                if( this.cells1[iPlusSizeX+1] === null ) { this.cells1[iPlusSizeX+1] = undefined }
                            }
                        }                        
                        if( output[1] & 0b00010000 ){
                            if( this.cells2[iPlusSizeX] === undefined ){
                                if( this.cells1[iPlusSizeX] === undefined ) { this.cells1[iPlusSizeX] = null }
                            } else if( this.cells2[iPlusSizeX] === null ){
                                if( this.cells1[iPlusSizeX] === null ) { this.cells1[iPlusSizeX] = undefined }
                            }
                        }
                        if( output[1] & 0b00100000 ){
                            if( this.cells2[iPlusSizeX-1] === undefined ){
                                if( this.cells1[iPlusSizeX-1] === undefined ) { this.cells1[iPlusSizeX-1] = null }
                            } else if( this.cells2[iPlusSizeX-1] === null ){
                                if( this.cells1[iPlusSizeX-1] === null ) { this.cells1[iPlusSizeX-1] = undefined }
                            }
                        }                        
                        if( output[1] & 0b01000000 ){
                            if( this.cells2[i-1] === undefined ){
                                if( this.cells1[i-1] === undefined ) { this.cells1[i-1] = null }
                            } else if( this.cells2[i-1] === null ){
                                if( this.cells1[i-1] === null ) { this.cells1[i-1] = undefined }
                            }
                        }                        
                        if( output[1] & 0b10000000 ){
                            if( this.cells2[iMinusSizeX-1] === undefined ){
                                if( this.cells1[iMinusSizeX-1] === undefined ) { this.cells1[iMinusSizeX-1] = null }
                            } else if( this.cells2[iMinusSizeX-1] === null ){
                                if( this.cells1[iMinusSizeX-1] === null ) { this.cells1[iMinusSizeX-1] = undefined }
                            }
                        }

                    }

                }
                i++
            }
            i += 2;
        }

        // If more than one cell tried to move or reproduce to the same cell, all of those cells are killed
        for( let index of conflictIndices ){
            this.cells1[index] = null;
        }










        i = this.sizeX + 1;
        for( let y=1; y<this.sizeY-1; y++){
            for( let x=1; x<this.sizeX-1; x++){
                let neighbours = 0;
                let iMinusSizeX = i-this.sizeX;
                let iPlusSizeX = i+this.sizeX;
                if( this.cells1[iMinusSizeX-1] !== undefined ) { neighbours++; }
                if( this.cells1[iMinusSizeX] !== undefined ) { neighbours++; }
                if( this.cells1[iMinusSizeX+1] !== undefined ) { neighbours++; }
                if( this.cells1[i-1] !== undefined ) { neighbours++; }
                if( this.cells1[i+1] !== undefined ) { neighbours++; }
                if( this.cells1[iPlusSizeX-1] !== undefined ) { neighbours++; }
                if( this.cells1[iPlusSizeX] !== undefined ) { neighbours++; }
                if( this.cells1[iPlusSizeX+1] !== undefined ) { neighbours++; }

                if(this.cells1[i] === undefined ){
                    if(neighbours === 3){
                        this.cells2[i] = null;
                    } else {
                        this.cells2[i] = undefined;
                    }   
                } else {
                    if(neighbours>1 && neighbours<4){
                        this.cells2[i] = this.cells1[i];
                    } else {
                        this.cells2[i] = undefined;
                    }                 
                }
                i++
            }
            i += 2;
        }

        i = this.sizeX + 1;
        for( let y=1; y<this.sizeY-1; y++){
            for( let x=1; x<this.sizeX-1; x++){
                this.cells1[i] = this.cells2[i]
                i++
            }
            i += 2;
        }




    }

    getImage( data: Uint8ClampedArray ){
        let i=0;
        for(let di=0; di<data.length; ){
            if(this.cells1[i] === null){
                data[di++] = 0;
                data[di++] = 0;
                data[di++] = 0;
                data[di++] = 255;
            } else if(this.cells1[i] === undefined){
                data[di++] = 255;
                data[di++] = 255;
                data[di++] = 255;
                data[di++] = 255;
            } else {
                data[di++] = 255;
                data[di++] = 0;
                data[di++] = 0;
                data[di++] = 255;
            }
            i++;
        }
    }
}
