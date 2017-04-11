import { Component, OnInit, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Color } from "color";
import firebase = require("nativescript-plugin-firebase");
import { BackendService, PieceService } from "../../../shared";
import { Observable as RxObservable } from 'rxjs/Observable';
import { knownFolders, File } from 'file-system';
// import * as fs from 'file-system';
import * as app from 'application';
import * as color from 'color';
import * as platform from 'platform';
import * as dialogs from 'ui/dialogs';
import { Page } from 'ui/page';
import { Slider } from 'ui/slider';
// import { SnackBar } from 'nativescript-snackbar';
import { SegmentedBarItem } from "ui/segmented-bar";
import { TNSRecorder, TNSPlayer, AudioPlayerOptions, AudioRecorderOptions } from 'nativescript-audio';
import { Router } from "@angular/router";

@Component({
    selector: "ah-audio-list",
    templateUrl: "pages/audio-recorder/audio-list/audio-list.component.html",
    styleUrls: ["pages/audio-recorder/audio-list/audio-list-common.css"]
})

export class AudioListComponent {

    private fbRecordingArray: Array<any>;
    private fbRecordingIdArray: Array<any>;
    private noRecordingsFound: boolean;

    // Icons
    public iconSettings = String.fromCharCode(0xf013);

    constructor(private _router: Router, private _ngZone: NgZone){
        this.fbRecordingIdArray = [];
        this.fbRecordingArray = [];

        this.loadPieceInformation();
    }

    onRecordingTap(args){
        let fileName = this.fbRecordingArray[args.index].fileName;
        console.log("RECORDING TAPPED: " + fileName);
        this._router.navigate(['/audio-analyzer/'+fileName]);
    }

    showRecordingOptions(filename){
        console.log("FILENAME: ->" + filename + "<-");
        let that = this;
        let options = {
            title: "Recording Options",
            message: "Choose your option",
            cancelButtonText: "Cancel",
            actions: ["Remove Recording"]
        };
        dialogs.action(options).then((result) => {
            console.log(result);
            if(result == "Remove Recording"){
                firebase.remove("/user/" + BackendService.token + "/recording/" + filename).then( (r) => {
                      this.loadPieceInformation();
                });;
            } else {
                // ERROR
            }
        });
    }

    loadPieceInformation() {
        // CLEARING
        this.fbRecordingIdArray = [];
        this.fbRecordingArray = [];

        firebase.query(
            (result) => {
                if (result) {
                    console.log("Event type: " + result.type);
                    console.log("Key: " + result.key);
                    console.log("Value: " + JSON.stringify(result.value));

                    if(result.value){
                        console.log("PIECE-ITEMS FOUND");
                        var lenPieces = Object.keys(result.value).length;
                        for (let i = 0; i < lenPieces; i++) {
                            this.fbRecordingIdArray.push(Object.keys(result.value)[i]);
                        }

                        let displayTitle;
                        for (let i = 0; i < this.fbRecordingIdArray.length; i++) {
                            console.log("mark 1");
                            if(result.value[this.fbRecordingIdArray[i]].recordingTitle != ""){
                                console.log("RECORDING TITLE FOUND");
                                displayTitle = result.value[this.fbRecordingIdArray[i]].recordingTitle;
                            } else if(result.value[this.fbRecordingIdArray[i]].pieceTitle != ""){
                                displayTitle = result.value[this.fbRecordingIdArray[i]].pieceTitle;
                            } else {
                                displayTitle = "Recording (no title)"; 
                            }
                            
                            this.fbRecordingArray.push({
                                duration: result.value[this.fbRecordingIdArray[i]].duration,
                                pieceTitle: result.value[this.fbRecordingIdArray[i]].pieceTitle,
                                fileName: result.value[this.fbRecordingIdArray[i]].fileName,
                                fileLocation: result.value[this.fbRecordingIdArray[i]].fileLocation,
                                recordingTitle: result.value[this.fbRecordingIdArray[i]].recordingTitle,
                                recordingType:result.value[this.fbRecordingIdArray[i]].recordingType,
                                audioMeterLine: result.value[this.fbRecordingIdArray[i]].audioMeterLine,
                                recordingDate: result.value[this.fbRecordingIdArray[i]].recordingDate,
                                displayTitle: displayTitle
                                // lastUsed: result.value[this.pieceIdArray[i]].lastUsed,
                                // iconCode: String.fromCharCode(0xf11a), 
                                // iconState: -1,
                                // iconColor: "#afafaf",
                                // durationSliderValue: 0,
                                // state: false
                            });
                        }
                        this._ngZone.run(() => {
                            // Sort Recordings
                            this.fbRecordingArray.sort(function(a, b) {
                                    return parseFloat(b.recordingDate) - parseFloat(a.recordingDate);
                            });
                        });
                    } else {
                        //result.value.movementItem.length = 0;
                        this.noRecordingsFound = true;
                        console.log("NO PIECES FOUND");
                    }

                } else {
                    this.noRecordingsFound = true;
                    console.log("NO PIECES FOUND");
                }
            },
            "/user/" + BackendService.token + "/recording",
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'recordingDate' // mandatory when type is 'child'
                }
            }
        );
    }
}