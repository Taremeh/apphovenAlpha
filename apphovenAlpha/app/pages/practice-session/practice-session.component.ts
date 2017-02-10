import { Component, OnInit, NgZone } from "@angular/core";
import firebase = require("nativescript-plugin-firebase");
import { PageRoute } from "nativescript-angular/router";
import { HttpService, BackendService } from "../../shared";
import { Page } from "ui/page";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import { Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import dialogs = require("ui/dialogs");

@Component({
    selector: "ah-practice-session",
    templateUrl: "pages/practice-session/practice-session.component.html",
    styleUrls: ["pages/practice-session/practice-session-common.css"]
})

export class PracticeSessionComponent implements OnInit {

    public sessionArray: Array<any>;
    public sessionIdArray: Array<any>;

    constructor(private _pageRoute: PageRoute, private _page: Page, private _routerExtensions: RouterExtensions, private _router: Router, private _ngZone: NgZone) {
        this.sessionArray = [];
        this.sessionIdArray = [];
        this.loadFirebaseData(true);
    }

    loadFirebaseData(initialize: boolean){

        firebase.query(
            (result) => {
                if (result) {

                    var lenSessions = Object.keys(result.value).length;
                    console.log("RESULT LENGTH: " + lenSessions);
                    for (let i = 0; i < lenSessions; i++) {
                        console.log("SESSION ID: "+ Object.keys(result.value)[i]);
                        this.sessionIdArray.push(Object.keys(result.value)[i]);
                    }

                    for (let i = 0; i < this.sessionIdArray.length; i++) {
                        this.sessionArray.push(result.value[this.sessionIdArray[i]]);
                        console.log(this.sessionArray[i].userNotes);
                    }


                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    this.sessionArray = result.value;

                } else {
                    console.log("NO SESSIONS FOUND");
                }
            },
            "/user/" + BackendService.token + "/practice-session",
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'since' // mandatory when type is 'child'
                }
            }
        );
    }

    ngOnInit() {
        this._page.actionBarHidden = true;
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            //this._router.navigate(['/addpiece']); 
        });
    }

}