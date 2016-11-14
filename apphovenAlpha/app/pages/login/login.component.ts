import { Component, ChangeDetectionStrategy, OnInit} from "@angular/core";
import firebase = require("nativescript-plugin-firebase");

@Component({
    selector: "ah-about",
    templateUrl:  "pages/login/login.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit {

    ngOnInit() {
        firebase.init({
            onAuthStateChanged: function(data) { // optional but useful to immediately re-logon the user when he re-visits your app
            console.log(data.loggedIn ? "Logged in to firebase" : "Logged out from firebase");
            if (data.loggedIn) {
                console.log("user's email address: " + (data.user.email ? data.user.email : "N/A"));
            }
        }
        }).then(
            (instance) => {
                console.log("firebase.init done");
            },
            (error) => {
                console.log("firebase.init error: " + error);
            }
        );
    }

    onTap(){
    firebase.login({
    type: firebase.LoginType.PASSWORD,
    email: 'XXX',
    password: 'XXX'
  }).then(
      function (result) {
        // the result object has these properties: uid, provider, expiresAtUnixEpochSeconds, profileImageURL, token
        JSON.stringify(result);
        console.log("FIREBASE SUCCESS!");
        console.log(result);
      },
      function (errorMessage) {
        console.log(errorMessage);
      }
  )
    }
}