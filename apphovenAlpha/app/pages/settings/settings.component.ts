import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "ui/page";
import { BackendService, LevelService } from "../../shared";
import { RouterExtensions } from "nativescript-angular/router";
let utilityModule = require("utils/utils");
// Background Service
/* var Observable = require("data/observable").Observable;
var application = require("application");
import * as utils from "utils/utils"; */


import firebase = require("nativescript-plugin-firebase");

@Component({
    selector: "ah-settings",
    templateUrl: "pages/settings/settings.component.html",
    styleUrls: ["pages/settings/settings-common.css"],
})

export class SettingsComponent implements OnInit, OnDestroy {
    isAndroid;
    private userEmail;
    private tapCounter = 0;

    constructor(private _router: Router, private page: Page, private _routerExtensions: RouterExtensions,
        private _lvlService: LevelService) { 

        firebase.getCurrentUser().then((user) => {
            this.userEmail = user.email;
            console.log("User uid: " + user.uid);
        }, (error) => {
            console.log("Firebase User Email not Found: " + error);
        });

    }

    ngOnInit() {
        console.log("Registiert: OnInit");
        this.isAndroid = !!this.page.android;
        this.page.actionBarHidden = false;
    }

    ngOnDestroy() {
        console.log("Settings - ngOnDestroy()");
    }

    logOut() {
        BackendService.token = "";
        BackendService.userName = "";
        BackendService.email = "";

        firebase.logout();
        this._routerExtensions.navigate(["/login"], { clearHistory: true });
    }

    betaFunction(){
        this._routerExtensions.navigate(["/metronome"]);
    }

    tapUrl(url: string) {
        if(url == "imslp"){
            utilityModule.openUrl("https://imslp.org");
        } else if (url == "blog") {
            utilityModule.openUrl("https://www.blog.apphoven.com");
        } else if (url == "flaticon"){
            utilityModule.openUrl("http://flaticon.com");
        }
    }

    onTap(){
        /*
         * BETA TESTING
         * 
        
        if(this.tapCounter > 0) {
            this._lvlService.practiceXp(1800*20);
            /* BackgroundServices
            var services = require("./background-service/service-helper");
            console.log("ONTAP() NOTIFICATION SERVICE FIRED");
            services.setupAlarm(utilityModule.ad.getApplicationContext());
            
        } else {
            console.log("ONTAP() " + this.tapCounter);
            this.tapCounter++;
        }*/
    }
}