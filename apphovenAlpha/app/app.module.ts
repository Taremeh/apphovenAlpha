// Imports
import { NgModule } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptHttpModule } from "nativescript-angular/http";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptRouterModule } from "nativescript-angular/router";

// Declarations
import { AppComponent } from "./app.component";
import { TempoTermPipe } from "./pages/metronome/tempo-term.pipe";
import { GraphLegendPipe } from "./pages/practice-session/graph-legend.pipe"
import { TimerPipe, MillisecondTransformerPipe, ComposerNamePipe } from "./shared";
import { routes, navigatableComponents } from "./app.routing";

// Providers
import { authProviders } from "./app.routing";
import { setStatusBarColors, BackendService, LoginService, PieceService, HttpService } from "./shared";
import { PerformanceTestService } from "./pages/metronome/performance-test.service";

// Modules
import { LoginModule } from "./pages/login/login.module";
import { SettingsModule } from "./pages/settings/settings.module";

// Currently disabled: (ToDo: Find a way to regulate the status bar)
// setStatusBarColors();

@NgModule({
  providers: [
    BackendService,
    LoginService,
    authProviders,
    PerformanceTestService,
    HttpService,
    PieceService
  ],
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule,
    NativeScriptHttpModule,
    NativeScriptRouterModule,
    NativeScriptRouterModule.forRoot(routes),
    LoginModule,
    SettingsModule
  ],
  declarations: [
    AppComponent,
    ...navigatableComponents,
    TempoTermPipe,
    TimerPipe,
    GraphLegendPipe,
    MillisecondTransformerPipe,
    ComposerNamePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}