import { Component, OnInit, NgZone } from "@angular/core";
import firebase = require("nativescript-plugin-firebase");
import { PageRoute } from "nativescript-angular/router";
import { Observable as RxObservable } from 'rxjs/Observable';
import { HttpService, BackendService, PieceService } from "../../../shared";
import { Page } from "ui/page";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import { Router } from "@angular/router";
import dialogs = require("ui/dialogs");
import * as Toast from "nativescript-toast";

@Component({
    selector: "ah-piece-list",
    templateUrl: "pages/piece/piece-list/piece-list.component.html",
    styleUrls: ["pages/piece/piece-list/piece-list-common.css"]
})
export class PieceListComponent implements OnInit {
    public routerParamId: number;
    public myItems: RxObservable<Array<any>>;

    public pieceArray: Array<any>;
    public pieceMovementIdArray: Array<any>;
    public pieceMovementArray: Array<any>;
    public pieceMovementArrayNotSelected: Array<any>;

    // Icons
    public iconSettings = String.fromCharCode(0xf1f8);

    // Nativescript doesn't allow an easy way to render an object, 
    // which is created while loading the values from firebase. Therefore: Each value gets an own var
    public pieceTitle: string;
    public pieceWorkNumber: string;
    public pieceMovementAmount: number;

    // UI
    private noPiecesFound: boolean;

    constructor(private _pageRoute: PageRoute, private _page: Page, private _router: Router,
                private _ngZone: NgZone, private _pieceService: PieceService, private _httpService: HttpService) {
        this.pieceArray = [];
        this.pieceMovementArray = [];
        this.pieceMovementIdArray = [];
        this.pieceMovementArrayNotSelected = [];

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => { this.routerParamId = Number(params['id']); });
        console.log("PARAM: "+this.routerParamId);

        // Fetch User-Data from Firebase (true, because of first initialization)
        this.loadFirebaseData();

    }

    loadFirebaseData(){
        // CLEARING
        this.pieceArray = [];
        this.pieceMovementIdArray = [];

        firebase.query(
            (result) => {
                if (result) {
                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    if(result.value){
                        console.log("PIECE-ITEMS FOUND");
                        let composerName;
                        let lenPieces = Object.keys(result.value).length;
                        for (let i = 0; i < lenPieces; i++) {
                            this.pieceMovementIdArray.push(Object.keys(result.value)[i]);
                        }
                        

                        for (let i = 0; i < this.pieceMovementIdArray.length; i++) {
                            // Get Composer Name
                            this._ngZone.run(() => {
                            // **********
                            // DEV NOTICE!
                            // Composer Name Function Currently Disabled
                            // **********
                            //this._httpService.getComposerName(result.value[this.pieceMovementIdArray[i]].composerId).subscribe((res) => {
                                //composerName = res[0].name;      
                                //console.log("COMPOSER NAME: " + composerName);                      

                                if(result.value[this.pieceMovementIdArray[i]].movementItem){
                                    console.log("MOVEMENT-ITEMS FOUND");

                                    // CLEARING
                                    this.pieceMovementArray = [];

                                    let lenMovements = result.value[this.pieceMovementIdArray[i]].movementItem.length;
                                    for (let iMov = 0; iMov < lenMovements; iMov++) {
                                        if(result.value[this.pieceMovementIdArray[i]].movementItem[iMov].state == 1){
                                            this.pieceMovementArray.push(result.value[this.pieceMovementIdArray[i]].movementItem[iMov].title);
                                        }
                                    }
                                    let pieceMovementArrayString = this.pieceMovementArray.join(", ");
                                    
                                        this.pieceArray.push({
                                            id: this.pieceMovementIdArray[i],
                                            title: result.value[this.pieceMovementIdArray[i]].pieceTitle,
                                            composerName: composerName,
                                            dateAdded: result.value[this.pieceMovementIdArray[i]].dateAdded,
                                            movements: pieceMovementArrayString,

                                    })
                                } else {

                                        this.pieceArray.push({
                                            id: this.pieceMovementIdArray[i],
                                            title: result.value[this.pieceMovementIdArray[i]].pieceTitle,
                                            composerName: composerName,
                                            dateAdded: result.value[this.pieceMovementIdArray[i]].dateAdded,
                                        });

                                }
                            //},
                            //(e) => {
                            //    console.log("COMPOSER NAME ERROR (composerId not contained in Firebase Piece Entry)");
                            //});
                            });
                        }

                        // SORT PIECES:
                        this._ngZone.run(() => {
                            this.pieceArray.sort(function(a, b) {
                                return parseFloat(b.dateAdded) - parseFloat(a.dateAdded);
                            });
                        });

                    } else {
                        this._ngZone.run(() => {
                            this.noPiecesFound = true;
                            //result.value.movementItem.length = 0;
                            console.log("NO PIECES FOUND");
                        });
                    }

                } else {
                    this._ngZone.run(() => {
                        this.noPiecesFound = true;
                        //result.value.movementItem.length = 0;
                        console.log("NO PIECES FOUND");
                    });
                }
            },
            "/user/" + BackendService.token + "/piece",
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'dateAdded' // mandatory when type is 'child'
                },
            }
        );
    }

    ngOnInit() {
        // Hide Action-Bar
        //this._page.actionBarHidden = true;

        /*application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            //this._router.navigate(['/addpiece']);
        });*/
    }

    onPieceTap(args){
        if(this.pieceArray[args.index].movements) {
            let pieceId = this.pieceArray[args.index].id;
            console.log("PIECE ID TAPPED: "+pieceId);
            this._router.navigate(['/piece-db/'+pieceId+"/0"]);
        } else {
            this.showToast("This piece doesn't contain any movements");
        }
    }

    showPieceOptions(pieceId: number){
        console.log("üBERMITTELTE PIECE ID: ->" + pieceId + "<-");
        let that = this;
        dialogs.confirm({
            title: "Delete piece from Practice-List?",
            message: "Do you want to remove this piece (and all its movements) from your Practice-List? \n\nYour Practice-Progress (Practice-Sessions) won't be deleted.",
            okButtonText: "Yes, remove please",
            cancelButtonText: "No!",
        }).then(function (result) {
            if(result){
                that._pieceService.removePiece(pieceId, -1).then(
                    function () {
                        console.log("success REMOVING");
                        that.loadFirebaseData();
                },
                function (error) {
                console.log("firebase.keepInSync error: " + error);
                }
                );
            }
        });
    }
    
    public showToast(message: string) {
        Toast.makeText(message).show();
    }
}