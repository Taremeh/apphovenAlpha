import { Component, OnInit, NgZone } from "@angular/core";
import firebase = require("nativescript-plugin-firebase");
import { PageRoute } from "nativescript-angular/router";
import { Observable as RxObservable } from 'rxjs/Observable';
import { HttpService, BackendService } from "../../../shared";
import { Page } from "ui/page";
import * as application from "application";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "application";
import { Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import dialogs = require("ui/dialogs");


@Component({
    selector: "ah-piece-db",
    templateUrl: "pages/piece/piece-dashboard/piece-dashboard.component.html",
    styleUrls: ["pages/piece/piece-dashboard/piece-dashboard-common.css"]
})

export class PieceDashboardComponent implements OnInit {

    public routerParamId: Array<any>;
    public myItems: RxObservable<Array<any>>;

    public pieceMovementArray: Array<any>;
    public pieceMovementArrayNotSelected: Array<any>;
    public pieceMovementArrayAll: Array<any>;
    public selectedArray: Array<any>;

    public toggleButtonText = "Add / Remove Movements";
    public showRemainingMovements: boolean = false;

    // Icons:
    public iconRemove = String.fromCharCode(0xf1f8);
    public iconAdd = String.fromCharCode(0xf067);

    // Nativescript doesn't allow an easy way to render an object, 
    // which is created while loading the values from firebase. Therefore: Each value gets an own var
    public pieceTitle: string;
    public pieceWorkNumber: string;
    public pieceMovementAmount: number;

    constructor(private _pageRoute: PageRoute, private _page: Page, private _routerExtensions: RouterExtensions, private _router: Router, private _ngZone: NgZone) {

        this.pieceMovementArray = [];
        this.pieceMovementArrayNotSelected = [];
        this.pieceMovementArrayAll = [];
        this.selectedArray = [];
        this.routerParamId = [];

        this._pageRoute.activatedRoute
        .switchMap(activatedRoute => activatedRoute.params)
        .forEach((params) => { 
            this.routerParamId['pieceId'] = Number(params['pieceId']);
            this.routerParamId['originType'] = Number(params['originType']);
        });

        // Fetch User-Data from Firebase (true, because of first initialization)
        this.loadFirebaseData(true);
    }

    loadFirebaseData(initialize: boolean){
        firebase.query(
            (result) => {
                if (result) {

                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    if(result.value.movementItem){
                        // Movements are available

                        // RESET Arrays
                        this.pieceMovementArray = [];
                        this.pieceMovementArrayNotSelected = [];
                        this.pieceMovementArrayAll = [];
                        this.selectedArray = [];

                        // Amount of movements
                        var len = result.value.movementItem.length;

                        for (let i = 0; i < len; i++) {
                            if (result.value.movementItem[i].state != 0){
                                // Add only movements to pieceMovementArray, that are being practiced
                                this.pieceMovementArray.push({
                                    title: result.value.movementItem[i].title,
                                    state: result.value.movementItem[i].state
                                });
                            }

                            // Add all movements to pieceMovementArrayAll
                            this.pieceMovementArrayAll.push({
                                title: result.value.movementItem[i].title,
                                state: result.value.movementItem[i].state
                            });
                        }

                        if(initialize){    
                            // Show only movements, that are being practiced (onInit)
                            this.selectedArray = this.pieceMovementArray;
                        } else {
                            // ngZone is needed here to update the Listview in case of:
                            // First action => Delete Movement
                            // (If the first action was adding a movement, the listview would 
                            // refresh even without ngZone) - Why?
                            this._ngZone.run(() => {
                                // Show all piece (after adding / removing pieces)
                                this.selectedArray = this.pieceMovementArrayAll;
                            })
                            
                        }
                        
                        // Is this code-line needed? -> Saves pieceMovementAmount 
                        this.pieceMovementAmount = result.value.movementItem.length;
                        
                    } else {
                        this.pieceMovementAmount = 0;
                        console.log("No piece movements found");
                    }
                    
                    this.pieceTitle = result.value.pieceTitle;
                    this.pieceWorkNumber = result.value.pieceWorkNumber;
                } else {
                    console.log("Error: Piece not found");
                }
            },
            "/user/" + BackendService.token + "/piece/" + this.routerParamId['pieceId'],
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
        // Hide Action-Bar
        this._page.actionBarHidden = true;

        // Create onBackButtonPressed-Listener
        application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
            console.log("BACK BUTTON EVENT TRIGGERED");
            //this._router.navigate(['/addpiece']);
            if(this.routerParamId['originType'] == 1){
                this._routerExtensions.navigate(["/home"], { clearHistory: true });
            }
        });
    }

    toggleRemainingMovements(type: number){

        this.showRemainingMovements = !this.showRemainingMovements;
        if(this.showRemainingMovements === false) {
            this.selectedArray = this.pieceMovementArray;
            this.toggleButtonText = "Add / Remove Movements";
        } else {
            this.selectedArray = this.pieceMovementArrayAll;
            this.toggleButtonText = "Cancel";
        }
    }

    recordSession(args){
        this._router.navigate(['/piece-recorder/'+this.routerParamId['pieceId']+"/"+args.index]);
    }

    handleItemTap(args){
        if(!this.showRemainingMovements){
            // Reading-Mode -> Go to piece recorder
            this.recordSession(args);
        } else {
            // Editing-Mode -> Add / Remove movement from list
            if(this.pieceMovementArrayAll[args.index].state == 0){
                this.updateMovementList(1, args); // ADD movement
            } else if(this.pieceMovementArrayAll[args.index].state == 1){
                this.updateMovementList(2, args); // REMOVE movement
            }
        }
    }

    updateMovementList(type: number, args){
        if(this.pieceMovementAmount > 0) {
            let that = this;
            if(type == 1) {
                // TYPE 1 = ADD MOVEMENT to PRACTICE LIST
                console.log("HANDLE ADD");
                this.pieceMovementArrayAll[args.index].state = 1;
                this.firebaseAction();
            } else if (type == 2){
                // TYPE 2 = REMOVE MOVEMENT FROM PRACTICE LIST
                console.log("HANDLE REMOVE");
                if(this.pieceMovementArray.length < 2) {
                    // IF DELETING LAST MOVEMENT -> Inform User, that piece will be deleted | Still in DEV-Mode
                    dialogs.confirm({
                        title: "Attention!",
                        message:  '"' + this.pieceMovementArrayAll[args.index].title + '" is your last remaining movement! Do you want to delete the entire piece from your practicing list?',
                        okButtonText: "Yes, delete entire piece",
                        cancelButtonText: "No!",
                    }).then(function (result) {
                        if(result){
                            // STILL IN DEVELOPMENT
                            that.pieceMovementArrayAll[args.index].state = 0;
                            that.firebaseAction();
                        }
                    });
                } else {
                    // SURE you want to delete?
                    dialogs.confirm({
                        title: "Reset your progress?",
                        message: 'Do you want to reset your progress (practice time, ratings etc.) for \n\n"' + this.pieceTitle + '\n' + this.pieceMovementArrayAll[args.index].title + '" ?',
                        okButtonText: "Yes, reset please",
                        cancelButtonText: "No!",
                    }).then(function (result) {
                        if(result){
                            that.pieceMovementArrayAll[args.index].state = 0;
                            that.firebaseAction();
                        }
                    });
                }
            }
        }
    }

    firebaseAction(){

        let that = this;
        firebase.setValue(
                '/user/'+BackendService.token+'/piece/'+this.routerParamId['pieceId']+'/movementItem',
                this.pieceMovementArrayAll
            ).then(
            function () {
                // Reload Firebase-Data (false, because show all pieces)
                that.loadFirebaseData(false);
            },
            function (error) {
                console.log("ERROR: " + error);
            });
    }
}