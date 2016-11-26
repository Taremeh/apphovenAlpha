import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "ui/page";
import { BackendService } from "../../shared";

import firebase = require("nativescript-plugin-firebase");

@Component({
    selector: "ah-settings",
    templateUrl: "pages/settings/settings.component.html",
    styleUrls: ["pages/settings/settings-common.css", "pages/settings/settings.component.css"],
})

export class SettingsComponent implements OnInit, OnDestroy {
    isAndroid;
    constructor(private _router: Router, private page: Page) { }

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
        this._router.navigate(["/login"]);
    }
}