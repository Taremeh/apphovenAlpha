import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { View } from "ui/core/view";
import { Color } from "color";
import { firestore } from "nativescript-plugin-firebase";
const firebase = require("nativescript-plugin-firebase/app");
import { BackendService, PieceService } from "../../../shared";
import { Observable as RxObservable } from 'rxjs/Observable';
import * as fs from "file-system";
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

export class AudioListComponent implements OnDestroy {

    private fbRecordingArray: Array<any>;
    private fbRecordingIdArray: Array<any>;
    private noRecordingsFound: boolean;

    // Icons
    public iconSettings = String.fromCharCode(0xf1f8);

    // Observable
    private listenerUnsubscribe: () => void;

    constructor(private _router: Router, private _ngZone: NgZone){
        this.fbRecordingIdArray = [];
        this.fbRecordingArray = [];

        this.firestoreListen();
    }

    onRecordingTap(args){
        let fileName = this.fbRecordingArray[args.index].fileName;
        console.log("RECORDING TAPPED: " + fileName);
        this._router.navigate(['/audio-analyzer/'+fileName]);
    }

    showRecordingOptions(filename){
        console.log("FILENAME: ->" + filename + "<-");
        let that = this;
        dialogs.confirm({
            title: "Remove recording?",
            message: "Do you want to delete the recording and all its markers?",
            okButtonText: "Yes, remove please",
            cancelButtonText: "No!",
        }).then(function (result) {
            if(result){

                // DELTE FILE FROM DEVICE
                // Android Muisc Path => apphoven-recordings
                let androidMusicPath = android.os.Environment.getExternalStoragePublicDirectory(
                    android.os.Environment.DIRECTORY_MUSIC).toString(); 
                // creates PATH for folder called apphoven-recordings in /Music (string value)
                let apphovenRecordingPath = fs.path.join(androidMusicPath, "apphoven-recordings");
                let audioFolder = fs.Folder.fromPath(apphovenRecordingPath);
                let deleteFile = fs.Folder.fromPath(apphovenRecordingPath).getFile(filename+".m4a");

                console.log("delete: "+deleteFile);
                if (deleteFile) {
                    // >> fs-delete-file-code
                    deleteFile.remove()
                        .then(res => {
                            // Success removing the file.
                            //this.resultMessage = "File successfully deleted!";
                            console.log("Sucessfully deleted");
                        }).catch(err => {
                            console.log(err.stack);
                        });
                    // << fs-delete-file-code
                } else {
                    console.log("Already deleted")
                    //this.resultMessage = "Already deleted file!";
                }

                // DELTE METAINFO FROM FIREBASE
                let recordingDocument = firebase.firestore()
                    .collection("user")
                    .doc(BackendService.token)
                    .collection("recording")
                    .doc(filename);

                recordingDocument.delete();

                /*firebase.remove("/user/" + BackendService.token + "/recording/" + filename).then( (r) => {
                      //that.loadPieceInformation();
                });;*/
            } else {
                // ERROR
            }
        });
    }

    public firestoreListen(): void {
        if (this.listenerUnsubscribe !== undefined) {
          console.log("Already listening");
          return;
        }
        
        // Define Firestore Collection
        let recordingCollection = firebase.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("recording");

        this.listenerUnsubscribe = recordingCollection.onSnapshot((snapshot: firestore.QuerySnapshot) => {
            if (snapshot) {
                console.log("Handling Snapshot");
                this.handleSnapshot(snapshot);
            } else {
                console.log("No Pieces Found!");
            }
        });
    }

    handleSnapshot(snapshot) {
        // CLEARING
        this.fbRecordingIdArray = [];
        this.fbRecordingArray = [];
    
        if(snapshot.docSnapshots.length !== 0){
            this.noRecordingsFound = false;
            let recordingAmount = snapshot.docSnapshots.length;
            snapshot.forEach(recording => {
                this._ngZone.run(() => {

                    let displayTitle;
                    // for (let i = 0; i < recordingAmount; i++) {
                        if(recording.data().recordingTitle != ""){
                            console.log("RECORDING TITLE FOUND");
                            displayTitle = recording.data().recordingTitle;
                        } else if(recording.data().pieceTitle != null){
                            console.log("pieceTitle found");
                            displayTitle = recording.data().pieceTitle;
                        } else {
                            displayTitle = "Recording (no title)"; 
                        }
                        
                        this.fbRecordingArray.push({
                            duration: recording.data().duration,
                            pieceTitle: recording.data().pieceTitle,
                            fileName: recording.data().fileName,
                            fileLocation: recording.data().fileLocation,
                            recordingTitle: recording.data().recordingTitle,
                            recordingType:recording.data().recordingType,
                            audioMeterLine: recording.data().audioMeterLine,
                            recordingDate: recording.data().recordingDate,
                            displayTitle: displayTitle
                            // lastUsed: result.value[this.pieceIdArray[i]].lastUsed,
                            // iconCode: String.fromCharCode(0xf11a), 
                            // iconState: -1,
                            // iconColor: "#afafaf",
                            // durationSliderValue: 0,
                            // state: false
                        });
                    // }
                    this._ngZone.run(() => {
                        // Sort Recordings
                        this.fbRecordingArray.sort(function(a, b) {
                                return parseFloat(b.recordingDate) - parseFloat(a.recordingDate);
                        });
                    });
                });
            });
        } else {
            this._ngZone.run(() => {
                this.noRecordingsFound = true;
                console.log("NO RECORDINGS FOUND");
            });
        }
    }

    /*loadPieceInformation() {
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
                        this.noRecordingsFound = false;
                        console.log("PIECE-ITEMS FOUND");
                        var lenPieces = Object.keys(result.value).length;
                        for (let i = 0; i < lenPieces; i++) {
                            this.fbRecordingIdArray.push(Object.keys(result.value)[i]);
                        }

                        let displayTitle;
                        for (let i = 0; i < this.fbRecordingIdArray.length; i++) {
                            if(result.value[this.fbRecordingIdArray[i]].recordingTitle != ""){
                                console.log("RECORDING TITLE FOUND");
                                displayTitle = result.value[this.fbRecordingIdArray[i]].recordingTitle;
                            } else if(result.value[this.fbRecordingIdArray[i]].pieceTitle != null){
                                console.log("pieceTitle found");
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
                        this._ngZone.run(() => {
                            this.noRecordingsFound = true;
                            console.log("NO RECORDINGS FOUND");
                        });
                    }

                } else {
                    this._ngZone.run(() => {
                        this.noRecordingsFound = true;
                        console.log("NO RECORDINGS FOUND");
                    });
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
    }*/

    public firestoreStopListening(): void {
        if (this.listenerUnsubscribe === undefined) {
          console.log("Please start listening first.");
          return;
        }
    
        this.listenerUnsubscribe();
        this.listenerUnsubscribe = undefined;
    }

    ngOnDestroy(){
        this.firestoreStopListening();
    }
}