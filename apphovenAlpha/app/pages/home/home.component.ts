import { Component, OnInit, OnDestroy } from "@angular/core";
import { Page } from "ui/page";
import { Router } from "@angular/router";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import * as application from "application";
import * as LocalNotifications from "nativescript-local-notifications";


@Component({
    selector: "ah-home",
    templateUrl: "pages/home/home.component.html",
    styleUrls: ["pages/home/home-common.css", "pages/home/home.component.css"]
})

export class HomeComponent implements OnInit, OnDestroy {
    isAndroid;
    constructor(private _router: Router, private page: Page) {
    }

    ngOnInit() {
        console.log("Home Registiert: OnInit");
        this.isAndroid = !!this.page.android;
        this.page.actionBarHidden = false;
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
          
        });

    }

    ngOnDestroy() {
        console.log("Home - ngOnDestroy()");
    }

    navigateTo(page: string){
        this._router.navigate([page]);
    }

    notify(){
        LocalNotifications.schedule([{
            id: 1,
            title: 'The title',
            body: 'And here the body',
            at: new Date(new Date().getTime() + (5 * 1000)) // 5 seconds from now
        }]).then(
            function() {
                console.log("Notification scheduled");
            },
            function(error) {
                console.log("scheduling error: " + error);
            }
        );

        LocalNotifications.getScheduledIds().then(
            function(ids) {
                console.log("ID's: " + ids);
            }
        );
    }

}