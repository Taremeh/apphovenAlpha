import { Injectable } from "@angular/core";
import { User } from "./user.model";
import { BackendService } from "./backend.service";
import { InitService } from "./init.service";
import firebase = require("nativescript-plugin-firebase");
const firestorebase = require("nativescript-plugin-firebase/app");
// import { firestore } from "nativescript-plugin-firebase";

@Injectable()
export class LoginService {
  constructor(private _initService: InitService) { }

  register(user: User) {
    // Set tutorialTour to true (1)
    BackendService.tutorialTour = 1;
    return firebase.createUser({
      email: user.email,
      password: user.password
    }).then((result) => {
      // Add Email to Firestore-User-Entity
      this._initService.initUser(result.key, user.email);
    })
    .catch(this.handleErrors);
  }

  login(user: User) {
    return firebase.login({
      type: firebase.LoginType.PASSWORD,
      passwordOptions: { 
        email: user.email,
        password: user.password
      }
    }).then( (result) => {
        let dateNow = Date.now();
        BackendService.lastLogin = dateNow;
        BackendService.token = result.uid;
        BackendService.email = result.email;
        if(result.name) {
          BackendService.userName = result.name;
        }
        return JSON.stringify(result);
      })
      .catch(this.handleErrors);
  }

  loginGoogle(){
    return firebase.login({
      type: firebase.LoginType.GOOGLE
    }).then((result) => {
        let dateNow = Date.now();
        BackendService.lastLogin = dateNow;
        BackendService.token = result.uid;
        BackendService.email = result.email;
        BackendService.userName = result.name;

        // Check if First-Time Login => If true, add email to Firestore-User-Entity
        return this._initService.googleLoginCheck(result.uid, result.email);
      })
      .catch(this.handleErrors);
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
          const userProfile = firestorebase.firestore()
            .collection("user")
            .doc(BackendService.token);

          return userProfile.update({
            userName: username
          }).then(() => {
            BackendService.userName = String(username);
          });
        },
        (errorMessage) => {
            console.log(errorMessage);
        }
    );
  }

  updateProfile(propertyName, propertyContent) {
    const userProfile = firestorebase.firestore()
            .collection("user")
            .doc(BackendService.token);
            /*.collection("userProfile")
            .doc("userProfileData");*/

    if(propertyName == 'userUrl'){
      // Blocked Urls
      let blockedUserUrls = ["","apphoven","app","administrator","admin","ceo","login","register","account","help","user","www","xxx","contact","download","root","super","void","null","request","system","payment","invoice","faq","delete","create","404","beethoven","mozart","liszt","chopin"];
      
      // Sanitize userUrl
      propertyContent = propertyContent.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "");

      return firestorebase.firestore().collection("user")
        .where("userUrl", "==", propertyContent)
        .get()
        .then(querySnapshot => {
          // console.log("Raw Snapshot: " + JSON.stringify(querySnapshot));

          // Check userUrl lenght > 3 AND Check if username is already taken or blocked
          if(propertyContent.length < 3 || propertyContent.length > 25){
            // UserUrl too short or long

            // Throw error
            throw "user-url too short/long";
          } else if(querySnapshot.docSnapshots.length > 0 || blockedUserUrls.some(x => x === propertyContent)) {
            // UserUrl taken
            // querySnapshot.forEach(doc => { console.log(`RES: ${doc.id} => ${JSON.stringify(doc.data())}`); });
            
            // Throw error
            throw "user-url taken";

          } else { 
            // UserUrl available
            console.log("UserUrl available");

            return userProfile.update({
              userUrl: propertyContent
            });
          }
        });
    }

    if(propertyName == 'userVideoLink') {
      // Just save the YouTube-ID
      propertyContent = propertyContent.substring(propertyContent.length-11);
    }

    return userProfile.get().then(doc => {
      if (doc.exists) {
        return userProfile.update({
          [propertyName]: propertyContent
        });
      } else {
        return userProfile.set({
          [propertyName]: propertyContent
        });
      }
    });
  }

  handleErrors(error) {
    console.log(JSON.stringify(error));
    return Promise.reject(error);
  }
}