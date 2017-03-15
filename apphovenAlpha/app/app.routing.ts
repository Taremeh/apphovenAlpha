import { AuthGuard } from "./auth-guard.service";
import { LoginComponent } from "./pages/login/login.component";
import { HomeComponent } from "./pages/home/home.component";
import { SettingsComponent } from "./pages/settings/settings.component";
import { ProfileComponent } from "./pages/profile/profile.component";
import { MetronomeComponent } from "./pages/metronome/metronome.component";
import { AddPieceComponent } from "./pages/piece/addpiece/addpiece.component";
import { PieceDashboardComponent } from "./pages/piece/piece-dashboard/piece-dashboard.component";
import { PieceListComponent } from "./pages/piece/piece-list/piece-list.component";
import { PieceRecorderComponent } from "./pages/piece/piece-recorder/piece-recorder.component";
import { PracticeSessionComponent } from "./pages/practice-session/practice-session.component";

export const authProviders = [
  AuthGuard
];

export const routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, clearHistory: true, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'metronome', component: MetronomeComponent, canActivate: [AuthGuard] },
  { path: 'addpiece', component: AddPieceComponent, canActivate: [AuthGuard] },
  { path: 'piece-db/:pieceId/:originType', component: PieceDashboardComponent, canActivate: [AuthGuard] },
  { path: 'piece-list', component: PieceListComponent, canActivate: [AuthGuard] },
  { path: 'piece-recorder', component: PieceRecorderComponent, canActivate: [AuthGuard] },
  { path: 'practice-session', component: PracticeSessionComponent, canActivate: [AuthGuard] },
];

// Needed for app.module.ts declaration
export const navigatableComponents = [
  LoginComponent,
  HomeComponent,
  SettingsComponent,
  ProfileComponent,
  MetronomeComponent,
  AddPieceComponent,
  PieceDashboardComponent,
  PieceListComponent,
  PieceRecorderComponent,
  PracticeSessionComponent
];