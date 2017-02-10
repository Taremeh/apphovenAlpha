import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'timerformat'})
export class TimerPipe implements PipeTransform {
    transform(seconds: number): number {
        return new Date(1970, 0, 1).setSeconds(seconds);
    }
}