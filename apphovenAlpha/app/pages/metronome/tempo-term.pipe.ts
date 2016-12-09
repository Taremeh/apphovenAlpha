import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'tempoterm'})
export class TempoTermPipe implements PipeTransform {
  transform(interval: number): string {
    switch(true) {
      case (interval < 60):
          return("Largo");
       case(interval >= 60 && interval < 66):
          return("Larghetto");           
       case(interval >= 66 && interval < 76):
           return("Adagio");           
       case(interval >= 76 && interval < 108):
           return("Andante");           
       case(interval >= 108 && interval < 120):
           return("Moderato");           
       case(interval >= 120 && interval < 168):
           return("Allegro");           
       case(interval >= 168 && interval < 200):
           return("Presto");               
       case(interval >= 200 && interval < 208):
           return("Prestissimo");           
       case(interval >= 208):
           return("Prestissimo / Up Tempo");
       default:
           return("Unknown Tempo");
    }
  }
}