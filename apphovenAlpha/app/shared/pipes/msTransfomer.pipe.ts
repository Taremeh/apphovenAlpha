import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'mstransformer'})
export class MillisecondTransformerPipe implements PipeTransform {
    transform(milliseconds: number): string {
        let secondsTotal = milliseconds / 1000;
        let minutes = Math.floor(secondsTotal / 60);
        let seconds = Math.floor(secondsTotal - (minutes * 60));

        let minutesDisplay;
        let secondsDisplay;

        if (minutes < 10) {
            minutesDisplay = "0"+minutes;
        } else {
            minutesDisplay = minutes;
        }

        if (seconds < 10) {
            secondsDisplay = "0"+seconds;
        } else {
            secondsDisplay = seconds;
        }

        
        return minutesDisplay + ":" + secondsDisplay;
    }
}