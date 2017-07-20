import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "ui/page";
import { BackendService } from "../../shared";
import { RouterExtensions } from "nativescript-angular/router";
let utilityModule = require("utils/utils");

import firebase = require("nativescript-plugin-firebase");

@Component({
    selector: "ah-settings",
    templateUrl: "pages/settings/settings.component.html",
    styleUrls: ["pages/settings/settings-common.css"],
})

export class SettingsComponent implements OnInit, OnDestroy {
    isAndroid;
    private userEmail;

    constructor(private _router: Router, private page: Page, private _routerExtensions: RouterExtensions) { 

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
}