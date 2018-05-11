import { Injectable } from "@angular/core";
import { BackendService } from "./backend.service";

import firestore = require("nativescript-plugin-firebase");
const firebase = require("nativescript-plugin-firebase/app");

@Injectable()
export class InitService {

    // Email & Password Registration Init
    initUser(uid, email){
        let date = Date.now();
        const statsCollection = firebase.firestore()
            .collection("user")
            .doc(uid)
            .collection("stats");
    
        statsCollection.doc("1").set({
            lvl: 1,
            xpCurrent: 0,
            xpMax: 50,
            dateStarted: date,
            lastTouched: date
        });

      const userProfile = firebase.firestore()
        .collection("user")
        .doc(uid);
  
        userProfile.set({userEmail: email});
    }

    // Google Registration & Login
    googleLoginCheck(uid, email){
        let date = Date.now();

        const userProfile = firebase.firestore()
            .collection("user")
            .doc(uid);

        const lvl1Doc = userProfile
            .collection("stats")
            .doc("1");
        
        return lvl1Doc.get().then(doc => {
            if (doc.exists) {
                // LOGIN
                return true;
            } else {
                // Add E-Mail to Firestore-User-Entity
                userProfile.set({userEmail: email});

                // First Time Login -> Create LVL 1 Entry
                console.log("LevelService: First LogIn! Initalizing LvlStats & Logging in User...");
                const statsCollection = firebase.firestore()
                    .collection("user")
                    .doc(uid)
                    .collection("stats");
                
                return statsCollection.doc("1").set({
                    lvl: 1,
                    xpCurrent: 0,
                    xpMax: 50,
                    dateStarted: date,
                    lastTouched: date
                });
            }
        });
    }

    /* 
     * * * * * * * * * * * * * * * * * *
     * Will be removed in next Commit  *
     * * * * * * * * * * * * * * * * * *
     * 

    // Check if
    loginCheck(uid, email){
        if(email == ""){
            email = "empty";
        }
        const userProfile = firebase.firestore()
            .collection("user")
            .doc(uid);

        return userProfile.get().then(doc => {
            let dataEmail = doc.data().userEmail || ""; 
            if (dataEmail != "") {
                // CHECK IF lvl1Doc EXISTS => (CREATE AND) LOGIN
                return this.initLvlCheck(uid);
            } else {
                // ADD EMAIL TO FIRESTORE-PROFILE-ENTITY
                return userProfile.update({
                    userEmail: email
                }).then(() => {
                    // CHECK IF lvl1Doc EXISTS => (CREATE AND) LOGIN
                    return this.initLvlCheck(uid);
                });
            }
        });
        
    }

    // Initialized Statistics-Entity (First LogIn)
    initLvlCheck(uid) {
        let date = Date.now();

        const lvl1Doc = firebase.firestore()
            .collection("user")
            .doc(uid)
            .collection("stats")
            .doc("1");
        
        return lvl1Doc.get().then(doc => {
            if (doc.exists) {
                // LOGIN
                console.log("LevelService: Init already done. Logging in User...");
                return true;
            } else {
                // First Time Login -> Create LVL 1 Entry
                console.log("LevelService: First LogIn! Initalizing LvlStats & Logging in User...");
                const statsCollection = firebase.firestore()
                    .collection("user")
                    .doc(uid)
                    .collection("stats");
                
                return statsCollection.doc("1").set({
                    lvl: 1,
                    xpCurrent: 0,
                    xpMax: 50,
                    dateStarted: date,
                    lastTouched: date
                });
            }
        });
    } */
}