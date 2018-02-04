import { Injectable } from "@angular/core";
import { getString, setString, getNumber, setNumber } from "application-settings";

const tokenKey = "token";
const email = "email";
const lastPracticeDuration  = "lastPracticeDuration";
const tutorialTour = "tutorialTour";
const toastLoaded = "toastLoaded";
const practiceTimeBackup = "practiceTimeBackup";
const practiceTimestampBackup = "practiceTimestampBackup";
const userName = "userName";

export class BackendService {
  
  static isLoggedIn(): boolean {
    return !!getString("token"); // If token is null => false, if anything else => true
  }

  static get token(): string {
    return getString("token");
  }

  static set token(theToken: string) {
    setString("token", theToken);
  }

  static get email(): string {
    return getString("email");
  }

  static set email(email: string) {
    setString("email", email);
  }

  static get userName(): string {
    return getString("userName");
  }

  static set userName(userName: string) {
    setString("userName", userName);
  }

  static get lastPracticeDuration(): number {
    return getNumber("lastPracticeDuration");
  }

  static set lastPracticeDuration(lastPracticeDuration: number) {
    setNumber("lastPracticeDuration", lastPracticeDuration);
  }

  static get tutorialTour(): number {
    return getNumber("tutorialTour");
  }

  static set tutorialTour(tutorialTour: number) {
    setNumber("tutorialTour", tutorialTour);
  }

  static get toastLoaded(): number {
    return getNumber("toastLoaded");
  }

  static set toastLoaded(toastLoaded: number) {
    setNumber("toastLoaded", toastLoaded);
  }

  /*
   *  Practice Time Recorder: Time Backup
   */

  static set practiceTimeBackup(practiceTimeBackup: number) {
    setNumber("practiceTimeBackup", practiceTimeBackup);
  }

  static get practiceTimeBackup(): number {
    return getNumber("practiceTimeBackup");
  }

  static set practiceTimestampBackup(practiceTimestampBackup: number) {
    setNumber("practiceTimestampBackup", practiceTimestampBackup);
  }

  static get practiceTimestampBackup(): number {
    return getNumber("practiceTimestampBackup");
  }

}