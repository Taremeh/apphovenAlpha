import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'graphlegend'})
export class GraphLegendPipe implements PipeTransform {
  transform(seconds: number): number {
    switch(true) {
       case (seconds > 3600):
          return(Math.ceil(seconds/3600));
       default:
           return(seconds);
    }
  }
}