import { Injectable, Inject } from "@angular/core";
import { BackendService } from "./backend.service";
import firebase = require("nativescript-plugin-firebase");
import { Observable } from "rxjs/Rx"

@Injectable()
export class PieceService {

    recordedPiece(pieceId: number, movementId: number, practicedTime: number, progressMade: number) {

    }


    addPiece(pieceId: any, pieceData: any, movementArray: any, pieceMovementArray: any): Promise<Response>{
        let i;
        let sP = pieceData;
        let piecePracticeArray;
        let piecePracticeMovements: any[];
        let piecePracticeMovementsAmount: number = 0;
        let dateToday = new Date().getTime();

        // Needed for BackendService: lastMovementId
        let firstMovementAdded = false
        let movementId = -2;

        if(movementArray != null) {
            // MOVEMENTS EXIST
            for(i = 0; i < pieceMovementArray.length; i++){
                // Define Movement Id
                pieceMovementArray[i].id = i;

                // Defines lastMovementId for BackendService. If multiple movements selected, register first one
                if(!firstMovementAdded && pieceMovementArray[i].state){
                    movementId = i;
                    firstMovementAdded = true;
                }
                if(pieceMovementArray[i].state){
                    // IF BEING PRACTICED
                    pieceMovementArray[i].lastUsed = dateToday;
                    pieceMovementArray[i].added = dateToday;
                    piecePracticeMovementsAmount += i;
                }
            }
            
            piecePracticeArray = { pieceTitle: sP.piece_title, 
                pieceWorkNumber: sP.piece_work_number, 
                movementItem: pieceMovementArray, 
                movementItemAmount: piecePracticeMovementsAmount,
            };

            console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);
        } else {
            // MOVEMENTS DO NOT EXIST
            piecePracticeArray = { pieceTitle: sP.piece_title, 
                pieceWorkNumber: sP.piece_work_number, 
                movementItemAmount: piecePracticeMovementsAmount,
                lastUsed: dateToday,
                added: dateToday
            };
            console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);
        }

        let that = this;
        return firebase.setValue(
            '/user/'+BackendService.token+'/piece/'+pieceId,
            piecePracticeArray
        );
    }

    removePiece(pieceId: number, movementId: number) {
        // if piece contains no movements, declare -1
        return firebase.query(
            (result) => {
                if (result.value) {
                    console.log("TTTTTTTTTTTTTTTETETETETETeETTETSTSTSTTST");
                    
                    // Reset Practice Session Data Array:
                    let deleteSessionArray = [];
                    let sessionIdArray = [];

                    var lenSessions = Object.keys(result.value).length;
                    console.log("RESULT LENGTH: " + lenSessions);

                    // Get Keys of all Practice Sessions
                    for (let i = 0; i < lenSessions; i++) {
                        console.log("SESSION ID(s): "+ Object.keys(result.value)[i]);
                        sessionIdArray.push(Object.keys(result.value)[i]);
                    }

                    // Find Practice Sessions, thats Piece will be deleted
                    for (let i = 0; i < sessionIdArray.length; i++) {
                        if(movementId != -1) {
                            // Delete only the movement sessions
                            if(result.value[sessionIdArray[i]].pieceId == pieceId &&
                                result.value[sessionIdArray[i]].movementId == movementId){
                                    deleteSessionArray.push(sessionIdArray[i]);
                            }
                        } else {
                            // Delete whole piece sessions (all movements)
                            if(result.value[sessionIdArray[i]].pieceId == pieceId){
                                deleteSessionArray.push(sessionIdArray[i]);
                            }
                        }
                    }

                    

                    // Remove Practice Sessions
                    for (let i = 0; i < deleteSessionArray.length; i++) {
                        firebase.remove("/user/" + BackendService.token + "/practice-session/" + deleteSessionArray[i]);
                    }
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
        ).then(() => {
            if(movementId == -1) {
                firebase.remove("/user/" + BackendService.token + "/piece/" + pieceId);
            }
        }
        );        
    }
}