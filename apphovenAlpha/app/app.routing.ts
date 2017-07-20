import { AuthGuard } from "./auth-guard.service";
import { LoginComponent } from "./pages/login/login.component";
import { HomeComponent } from "./pages/home/home.component";
import { SettingsComponent } from "./pages/settings/settings.component";
import { MetronomeComponent } from "./pages/metronome/metronome.component";
import { AddPieceComponent } from "./pages/piece/addpiece/addpiece.component";
import { RegisterPieceComponent } from "./pages/piece/addpiece/registerpiece/registerpiece.component";
import { PieceDashboardComponent } from "./pages/piece/piece-dashboard/piece-dashboard.component";
import { PieceListComponent } from "./pages/piece/piece-list/piece-list.component";
import { PieceRecorderComponent } from "./pages/piece/piece-recorder/piece-recorder.component";
import { PracticeSessionComponent } from "./pages/practice-session/practice-session.component";
import { AudioRecorderComponent } from "./pages/audio-recorder/audio-recorder/audio-recorder.component";
import { AudioListComponent } from "./pages/audio-recorder/audio-list/audio-list.component";
import { AudioAnalyzerComponent } from "./pages/audio-recorder/audio-analyzer/audio-analyzer.component";

export const authProviders = [
  AuthGuard
];

export const routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'home/:optionalParam', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, clearHistory: true, canActivate: [AuthGuard] },
  { path: 'metronome', component: MetronomeComponent, canActivate: [AuthGuard] },
  { path: 'addpiece', component: AddPieceComponent, canActivate: [AuthGuard] },
  { path: 'addpiece/registerpiece/:composerId', component: RegisterPieceComponent, canActivate: [AuthGuard] },
  { path: 'piece-db/:pieceId/:originType', component: PieceDashboardComponent, canActivate: [AuthGuard] },
  { path: 'piece-list', component: PieceListComponent, canActivate: [AuthGuard] },
  { path: 'piece-recorder', component: PieceRecorderComponent, canActivate: [AuthGuard] },
  { path: 'practice-session', component: PracticeSessionComponent, canActivate: [AuthGuard] },
  { path: 'audio-recorder', component: AudioRecorderComponent, canActivate: [AuthGuard] },
  { path: 'audio-list', component: AudioListComponent, canActivate: [AuthGuard] },
  { path: 'audio-analyzer/:recordingFileName', component: AudioAnalyzerComponent, canActivate: [AuthGuard] },
  { path: 'audio-analyzer/:recordingFileName/:optionalParam', component: AudioAnalyzerComponent, canActivate: [AuthGuard] }
];

// Needed for app.module.ts declaration
export const navigatableComponents = [
  LoginComponent,
  HomeComponent,
  SettingsComponent,
  MetronomeComponent,
  AddPieceComponent,
  RegisterPieceComponent,
  PieceDashboardComponent,
  PieceListComponent,
  PieceRecorderComponent,
  PracticeSessionComponent,
  AudioRecorderComponent,
  AudioListComponent,
  AudioAnalyzerComponent
];