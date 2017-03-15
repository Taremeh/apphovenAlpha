import { Component, OnInit, OnDestroy } from "@angular/core";
import { Page } from "ui/page";
import { Router } from "@angular/router";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import * as application from "application";
import { BackendService } from "../../shared";



@Component({
    selector: "ah-home",
    templateUrl: "pages/home/home.component.html",
    styleUrls: ["pages/home/home-common.css"]
})

export class HomeComponent implements OnInit, OnDestroy {
    isAndroid;
    public actionButtonText: string = "PRACTICE NOW";
    public addPieceIcon = String.fromCharCode(0xf196);
    public pieceListIcon = String.fromCharCode(0xf0ca);
    constructor(private _router: Router, private page: Page) {
    }

    ngOnInit() {
        /*
        
        WILL BE DELETED IN NEXT COMMIT

        if(!BackendService.lastPieceId){
            // No piece found (fresh user / all deleted)
            this.actionButtonText = "ADD PIECE TO START PRACTICING";
        } else if(BackendService.lastPieceId == -1 || BackendService.lastMovementId == -1) {
            // Last used piece / piece movement was deleted

            // DEV: WHAT IF LAST WAS DELETED??? THEN THERE'S NOTHING TO SELECT... 2nd CHECK NEEDED
            this.actionButtonText = "SELECT A PIECE TO START PRACTICING";
        }*/
        console.log("Home: OnInit!");
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

    practiceNow(){
        // if(!BackendService.lastPieceId || BackendService.lastPieceId == -1 || BackendService.lastMovementId == -1){
        //    console.log("No ID found");
        // } else {
            this._router.navigate(["/piece-recorder"]);
        // }
    }
}