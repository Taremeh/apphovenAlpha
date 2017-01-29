import { AuthGuard } from "./auth-guard.service";
import { LoginComponent } from "./pages/login/login.component";
import { HomeComponent } from "./pages/home/home.component";
import { SettingsComponent } from "./pages/settings/settings.component";
import { ProfileComponent } from "./pages/profile/profile.component";
import { MetronomeComponent } from "./pages/metronome/metronome.component";
import { ComposerComponent } from "./pages/composer/composer.component";
import { SearchComponent } from "./pages/search/search.component";
import { AddPieceComponent } from "./pages/addpiece/addpiece.component";

export const authProviders = [
  AuthGuard
];

export const routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, clearHistory: true, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'metronome', component: MetronomeComponent, canActivate: [AuthGuard] },
  { path: 'composer/:id', component: ComposerComponent, canActivate: [AuthGuard] },
  { path: 'search', component: SearchComponent, canActivate: [AuthGuard] },
  { path: 'addpiece', component: AddPieceComponent, canActivate: [AuthGuard] }
];

// Needed for app.module.ts declaration
export const navigatableComponents = [
  LoginComponent,
  HomeComponent,
  SettingsComponent,
  ProfileComponent,
  MetronomeComponent,
  ComposerComponent,
  SearchComponent,
  AddPieceComponent
];