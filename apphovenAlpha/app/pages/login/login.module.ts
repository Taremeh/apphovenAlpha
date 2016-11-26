import { NativeScriptModule } from "nativescript-angular/platform";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NgModule } from "@angular/core";

@NgModule({
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule
  ]
})

export class LoginModule { }