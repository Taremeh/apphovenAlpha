import { Component, OnInit, OnDestroy } from "@angular/core";
import { Page } from "ui/page";
import { Router } from "@angular/router";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import * as application from "application";
import { BackendService } from "../../shared";
import { PageRoute } from "nativescript-angular/router";




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

    public routerParamId;

    constructor(private _pageRoute: PageRoute, private _router: Router, private page: Page) {
        this.routerParamId = [];

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => { 
            this.routerParamId['noPieces'] = params['noPieces'];
            if(this.routerParamId['noPieces']) {
                console.log("NO PIECES TO PRACTICE!");
            }
        });
    }

    ngOnInit() {
        console.log("Home: OnInit!");
        this.isAndroid = !!this.page.android;
        this.page.actionBarHidden = false;


        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            
        });
    }

    ngOnDestroy() {
        // Remove BackPressedEvent Listener
        application.android.off(AndroidApplication.activityBackPressedEvent);
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