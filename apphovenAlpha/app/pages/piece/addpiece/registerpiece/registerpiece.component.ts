import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { HttpService, BackendService, PieceService, ComposerNamePipe } from "../../../../shared";
import { Color } from "color";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import firebase = require("nativescript-plugin-firebase");
import { RouterExtensions } from "nativescript-angular/router";
import * as Toast from "nativescript-toast";
import { connectionType, getConnectionType } from "connectivity";
import dialogs = require("ui/dialogs");
import { PageRoute } from "nativescript-angular/router";
import { Switch } from "ui/switch";
import { TextField } from "ui/text-field";
var http = require("http");

@Component({
    selector: "ah-registerpiece",
    templateUrl: "pages/piece/addpiece/registerpiece/registerpiece.component.html",
    styleUrls: ["pages/piece/addpiece/registerpiece/registerpiece-common.css"],
    providers: [HttpService]
})
export class RegisterPieceComponent implements OnInit, OnDestroy {
    public test = "Hallo";
    private composerId;
    private composerName;
    private movementSwitchState: boolean = false;
    private movementArray;
    private movementCounter: number = 0;

    constructor(private _pageRoute: PageRoute, private _httpService: HttpService, private _page: Page,
                private _pieceService: PieceService, private _routerExtensions: RouterExtensions){
        this.movementArray = [];

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => { 
            this.composerId = Number(params['composerId']);
        });

        // Get Composer Name
        this._httpService.getComposerName(this.composerId).subscribe((res) => {
            this.composerName = res[0].name;
        });
    }

    ngOnInit(){
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            this.backEvent(data);
        });

        // Hide ActionBar
        this._page.actionBarHidden = true;

        this.movementArray.push({
            id: this.movementCounter,
            title: ""
        });
    }

    movementSwitch(args){
        let switchInstance = <Switch>args.object;

        if (switchInstance.checked) {
            this.movementSwitchState = true;
        } else {
            this.movementSwitchState = false;
        }
    }

    addMovementTextField(){
        ++this.movementCounter;

        this.movementArray.push({
            id: this.movementCounter,
            title: ""
        });

        console.log("Movement Array: " + JSON.stringify(this.movementArray));
    }

    removeMovementTextField(){
        if(this.movementCounter > 0){
            this.movementArray.pop();
            --this.movementCounter;
            //console.log("Movement Array: " + JSON.stringify(this.movementArray));
        }
    }

    addPiece(){
        let movementArrayIncomplete = false;
        let workTitle = this._page.getViewById<TextField>("workTitle").text;
        let workNumber = this._page.getViewById<TextField>("workNumber").text;
        console.log("test " + this.movementArray.length);
        // Insert Movement-Values into Array
        for (let i = 0; i < this.movementArray.length; i++) {
            this.movementArray[i].title = this._page.getViewById<TextField>("movement"+i).text;
        }

        if(workTitle != "" && workNumber != ""){
            if(this.movementSwitchState){
                for (let i = 0; i < this.movementArray.length; i++) {
                    if(this.movementArray[i].title == ""){
                        movementArrayIncomplete = true;
                    }
                }

                if(movementArrayIncomplete){
                    this.showToast("Fill out every Movement-Field");
                } else {
                    // PASS
                    this.saveToDB(workTitle,workNumber,this.movementArray);
                }

            } else {
                // PASS
                this.saveToDB(workTitle,workNumber,null);
            }
        } else {
            this.showToast("Define Work-Title and Work-Number");
        }

        console.log("Movement Array: " + JSON.stringify(this.movementArray));
    }

    saveToDB(workTitle, workNumber, movementArray){
        let i;
        let data;
        let movementText = "";
        let record_created = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if(movementArray != null){
            for (i = 0; i < this.movementArray.length; i++) {
                this.movementArray[i].state = true;
                movementText += this.movementArray[i].title + "|";
            }
            movementText = movementText.substring(0, movementText.length - 1);
            data = { "record_created": record_created, "piece_composer_id": this.composerId, "piece_title": workTitle, "piece_work_number": workNumber, "piece_movement_title": movementText, "piece_movement_amount": i};

        } else {
            data = { "record_created": record_created, "piece_composer_id": this.composerId, "piece_title": workTitle, "piece_work_number": workNumber};
        }
        this._httpService.setData( data ).subscribe((res) => {
            let pieceId = res;   
            this.saveToFirebase(pieceId, workTitle, workNumber, movementArray)  
        }, (e) => {
            console.log("ERROR: " + e);
        } );
    }

    saveToFirebase(pieceId, workTitle, workNumber, movementArray){
        let that = this;
        this._pieceService.addPiece(pieceId, this.composerId, this.composerName, {piece_title: workTitle, piece_work_number: workNumber, user_piece: true}, movementArray, movementArray)
            .then(
                function () {
                    console.log("SUCCESS"); 
                    // BACKENDSERVICE FUNCTIONS MAY BE DELETED IN NEXT COMMIT
                    // Add Piece-Id to backend service DEL
                    // BackendService.lastPieceId = Number(that.pieceId);
                    // that._routerExtensions.navigate(["/piece-db/"+that.pieceId], { clearHistory: true });

                    // Navigate to Home (Tutorial yes / no?)
                    if(BackendService.tutorialTour > 0){
                        that._routerExtensions.navigate(["/home/con-piece-add-success"], { clearHistory: true });
                    } else {
                        BackendService.toastLoaded = 1;
                        that._routerExtensions.navigate(["/home/tos-piece-add-success"], { clearHistory: true });
                    }
                },
                function (error) {
                    console.log("ERROR: " + error);
                }
            );
    }

    ngOnDestroy(){
        application.android.off(AndroidApplication.activityBackPressedEvent);
        console.log("RegisterPiece - ngOnDestroy()");
    }

    public showToast(message: string) {
        Toast.makeText(message).show();
    }

    backEvent(args){
        args.cancel = true;
        this._routerExtensions.navigate(["/home"], { clearHistory: true });
    }
}