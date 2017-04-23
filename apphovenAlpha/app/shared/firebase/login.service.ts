import { Injectable } from "@angular/core";
import { User } from "./user.model";
import { BackendService } from "./backend.service";
import firebase = require("nativescript-plugin-firebase");

@Injectable()
export class LoginService {
  register(user: User) {
    // Set tutorialTour to true (1)
    BackendService.tutorialTour = 1;
    return firebase.createUser({
      email: user.email,
      password: user.password
    }).then(
        function (result) {
          console.log("FALSCHER SUCCESS");
          return JSON.stringify(result);
        }
    ).catch(this.handleErrors);
  }

  login(user: User) {
    return firebase.login({
      type: firebase.LoginType.PASSWORD,
      email: user.email,
      password: user.password
    }).then(
        function (result) {
          BackendService.token = result.uid;
          BackendService.email = result.email;
          firebase.keepInSync(
              "/user/"+BackendService.token, // which path in your Firebase needs to be kept in sync?
              true      // set to false to disable this feature again
          ).then(
              function () {
              console.log("firebase.keepInSync is ON for ../piece");
              },
              function (error) {
              console.log("firebase.keepInSync error: " + error);
              }
          );
          console.log("LOGIN SUCCESS - SERVICE");
          return JSON.stringify(result);
        },
    ).catch(this.handleErrors);
  }
  
  resetPassword(email) {
    return firebase.resetPassword({
    email: email
    }).then(
        function () {
          // called when password reset was successful,
          // you could now prompt the user to check his email
        }
    ).catch(this.handleErrors);
  }

  handleErrors(error) {
    console.log(JSON.stringify(error));
    return Promise.reject(error);
  }
}