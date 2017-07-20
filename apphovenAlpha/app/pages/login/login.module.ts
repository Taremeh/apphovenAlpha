import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NgModule } from "@angular/core";

@NgModule({
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule
  ]
})

export class LoginModule { }