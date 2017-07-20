import { Pipe, PipeTransform } from '@angular/core';
import { HttpService } from'../http/http.service';
import { Observable } from "tns-core-modules/data/observable";
@Pipe({name: 'composerNamePipe'})
export class ComposerNamePipe implements PipeTransform {
    constructor(public httpService: HttpService) {

    }
    transform(composerId: number): any {
        return this.httpService.getComposerName(composerId);
    }
}