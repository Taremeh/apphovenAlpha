import { AuthGuard } from "./auth-guard.service";
import { LoginComponent } from "./pages/login/login.component";
import { HomeComponent } from "./pages/home/home.component";
import { SettingsComponent } from "./pages/settings/settings.component";
import { ProfileComponent } from "./pages/profile/profile.component";

export const authProviders = [
  AuthGuard
];

export const routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, clearHistory: true, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] }
];

// Needed for app.module.ts declaration
export const navigatableComponents = [
  LoginComponent,
  HomeComponent,
  SettingsComponent,
  ProfileComponent
];