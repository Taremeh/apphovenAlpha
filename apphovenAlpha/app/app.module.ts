// Imports
import { NgModule } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptHttpModule } from "nativescript-angular/http";
import { NativeScriptModule } from "nativescript-angular/platform";
import { NativeScriptRouterModule } from "nativescript-angular/router";

// Declarations
import { AppComponent } from "./app.component";
import { TempoTermPipe } from "./pages/metronome/tempo-term.pipe";
import { TimerPipe } from "./pages/piece/piece-recorder/timer.pipe";
import { routes, navigatableComponents } from "./app.routing";

// Providers
import { authProviders } from "./app.routing";
import { setStatusBarColors, BackendService, LoginService } from "./shared";
import { PerformanceTestService } from "./pages/metronome/performance-test.service";
import { HttpService } from "./shared";

// Modules
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
    authProviders,
    PerformanceTestService,
    HttpService,
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
    ...navigatableComponents,
    TempoTermPipe,
    TimerPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}