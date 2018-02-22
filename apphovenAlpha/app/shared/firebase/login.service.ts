import { Injectable } from "@angular/core";
import { User } from "./user.model";
import { BackendService } from "./backend.service";
import firebase = require("nativescript-plugin-firebase");
const firestorebase = require("nativescript-plugin-firebase/app");
// import { firestore } from "nativescript-plugin-firebase";

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
          
          return JSON.stringify(result);
        }
    ).catch(this.handleErrors);
  }

  login(user: User) {
    return firebase.login({
      type: firebase.LoginType.PASSWORD,
      passwordOptions: { 
        email: user.email,
        password: user.password
      }
    }).then(
        function (result) {
          let dateNow = Date.now();
          BackendService.lastLogin = dateNow;
          BackendService.token = result.uid;
          BackendService.email = result.email;
          if(result.name) {
            BackendService.userName = result.name;
          }
          console.log("LOGIN SUCCESS (email) - SERVICE");
          return JSON.stringify(result);
        },
    ).catch(this.handleErrors);
  }

  loginGoogle(){
    return firebase.login({
      type: firebase.LoginType.GOOGLE
    }).then(
        function (result) {
          let dateNow = Date.now();
          BackendService.lastLogin = dateNow;
          BackendService.token = result.uid;
          BackendService.email = result.email;
          BackendService.userName = result.name;
          let date = Date.now();

          const lvl1Doc = firestorebase.firestore()
            .collection("user")
            .doc(result.uid)
            .collection("stats")
            .doc("1");
        
          lvl1Doc.get().then(doc => {
            if (doc.exists) {
              // LOGIN
              console.log("LOGGING IN GOOGLE USER.");
            } else {
              // First Time Login -> Create LVL 1 Entry
              console.log("LOGGING IN NEW GOOGLE USER. CREATING LVL 1 ENTRY");
              const statsCollection = firestorebase.firestore()
                .collection("user")
                .doc(result.uid)
                .collection("stats");
              
              statsCollection.doc("1").set({
                 lvl: 1,
                 xpCurrent: 0,
                 xpMax: 50,
                 dateStarted: date,
                 lastTouched: date
              }).then(() => {
                console.log("FIRST TIME LOGIN SUCCESS (google) - SERVICE");
              });
            }
          });
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

  updateName(username) {
    return firebase.updateProfile({
        displayName: username,
        // photoURL: ''
    }).then(
        () => {
            BackendService.userName = String(username);
        },
        (errorMessage) => {
            console.log(errorMessage);
        }
    );
  }

  handleErrors(error) {
    console.log(JSON.stringify(error));
    return Promise.reject(error);
  }
}