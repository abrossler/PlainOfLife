import { CellBase } from '../cell.base';

export class SimpleCell extends CellBase {
    executeTurn( input: Uint8Array, output: Uint8Array ): void{
        let neighbours = 0;
        let i0 = input[0];
        while (i0 != 0) {
            i0 &= i0 - 1; // clear the least significant bit set
            neighbours++;
        }

        if( neighbours == 0 ){
            if( Math.random() > 0.5 ){
                output[1] = 0b00010001;
            }
            else {
                output[1] = 0b01000100;
            }
        }
        else if( neighbours == 1 ){
            if(input[0] & 0b00000001) { output[0] = 1; }
            else if(input[0] & 0b00000010) { output[0] = 2; }
            else if(input[0] & 0b00000100) { output[0] = 3; }
            else if(input[0] & 0b00001000) { output[0] = 4; }
            else if(input[0] & 0b00010000) { output[0] = 5; }
            else if(input[0] & 0b00100000) { output[0] = 6; }
            else if(input[0] & 0b01000000) { output[0] = 7; }
            else if(input[0] & 0b10000000) { output[0] = 0; }
            output[0] += 8;
        }
        else if( neighbours == 2 ){
            output[0] = Math.floor( Math.random() * 8 ) + 8;
        } 
        else if ( neighbours == 3 ){
            while( output[0] = 0 ){
                let moveDirection = Math.floor( Math.random() * 8 );
                switch( moveDirection ){
                    case 0: if( input[0] & 0b00000001 ) { output[0] = 8; } break;
                    case 1: if( input[0] & 0b00000010 ) { output[0] = 9; } break;
                    case 2: if( input[0] & 0b00000100 ) { output[0] = 10; } break;
                    case 3: if( input[0] & 0b00001000 ) { output[0] = 11; } break;
                    case 4: if( input[0] & 0b00010000 ) { output[0] = 12; } break;
                    case 5: if( input[0] & 0b00100000 ) { output[0] = 13; } break;
                    case 6: if( input[0] & 0b01000000 ) { output[0] = 14; } break;
                    default: if( input[0] & 0b10000000 ) { output[0] = 15; } break;
                }
            }
        }
        else if( neighbours > 3){
            while( neighbours > 2 ){
                let killDirection = Math.floor( Math.random() * 8 );
                switch( killDirection ){
                    case 0: if( input[0] & 0b00000001 ) {
                        output[1] |= 0b00000001;
                        input[0] &= 0b11111110;
                        neighbours --;
                    } break;

                    case 1: if( input[0] & 0b00000010 ) {
                        output[1] |= 0b00000010;
                        input[0] &= 0b11111101;
                        neighbours --;
                    } break;
                    
                    case 2: if( input[0] & 0b00000100 ) {
                        output[1] |= 0b00000100;
                        input[0] &= 0b11111011;
                        neighbours --;
                    } break;
                    
                    case 3: if( input[0] & 0b00001000 ) {
                        output[1] |= 0b00001000;
                        input[0] &= 0b11110111;
                        neighbours --;
                    } break;
                    
                    case 4: if( input[0] & 0b00010000 ) {
                        output[1] |= 0b00010000;
                        input[0] &= 0b11101111;
                        neighbours --;
                    } break;
                    
                    case 5: if( input[0] & 0b00100000 ) {
                        output[1] |= 0b00100000;
                        input[0] &= 0b11011111;
                        neighbours --;
                    } break;
                    
                    case 6: if( input[0] & 0b01000000 ) {
                        output[1] |= 0b01000000;
                        input[0] &= 0b10111111;
                        neighbours --;
                    } break;
                    
                    default: if( input[0] & 0b10000000 ) {
                        output[1] |= 0b10000000;
                        input[0] &= 0b01111111;
                        neighbours --;
                    } break;
                }
            }
        }
    }

    reproduce(){
        return new SimpleCell();
    }
}