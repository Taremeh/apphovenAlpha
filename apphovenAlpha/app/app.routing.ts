import { LoginComponent } from "./pages/login/login.component";

export const routes = [
  { path: '', component: LoginComponent }
];

// Needed for app.module.ts declaration
export const navigatableComponents = [
  LoginComponent
];