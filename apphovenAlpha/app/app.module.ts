import { NgModule } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptHttpModule } from "nativescript-angular/http";
import { NativeScriptModule } from "nativescript-angular/platform";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { AppComponent } from "./app.component";
import { authProviders } from "./app.routing";
import { routes, navigatableComponents } from "./app.routing";
import { setStatusBarColors, BackendService, LoginService } from "./shared";

import { LoginModule } from "./pages/login/login.module";
import { HomeModule } from "./pages/home/home.module";
import { SettingsModule } from "./pages/settings/settings.module";
import { ProfileModule } from "./pages/profile/profile.module";

// Currently disabled: (ToDo: Find a way to regulate the status bar)
//setStatusBarColors();

@NgModule({
  providers: [
    BackendService,
    LoginService,
    authProviders
  ],
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule,
    NativeScriptHttpModule,
    NativeScriptRouterModule,
    NativeScriptRouterModule.forRoot(routes),
    LoginModule,
    HomeModule,
    SettingsModule,
    ProfileModule
  ],
  declarations: [
    AppComponent,
    ...navigatableComponents
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}