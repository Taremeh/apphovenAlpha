import { Injectable, Inject } from "@angular/core";
import { BackendService } from "./backend.service";

// Deprecated Import
import firebase = require("nativescript-plugin-firebase");

// New Firebase Firestore Import
const firebasef = require("nativescript-plugin-firebase/app");

import { Observable } from "rxjs/Rx";

@Injectable()
export class PieceService {

    recordedPiece(pieceId: number, movementId: number, practicedTime: number, progressMade: number) {

    }


    addPiece(pieceId: any, composerId: number, pieceData: any, movementArray: any, pieceMovementArray: any): Promise<Response>{
        let i;
        let sP = pieceData;
        let piecePracticeArray;
        let piecePracticeMovements: any[];
        let piecePracticeMovementsAmount: number = 0;
        let dateToday = new Date().getTime();

        // If piece created by used, add prefix "u"
        if(sP.user_piece){
            pieceId = "u" + pieceId;
        }

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
            
            piecePracticeArray = { pieceId: pieceId, composerId: composerId, pieceTitle: sP.piece_title, 
                pieceWorkNumber: sP.piece_work_number, 
                movementItem: pieceMovementArray, 
                movementItemAmount: piecePracticeMovementsAmount,
                dateLastUsed: dateToday,
                dateAdded: dateToday
            };

            console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);
        } else {
            // MOVEMENTS DO NOT EXIST
            piecePracticeArray = { pieceId: pieceId, composerId: composerId, pieceTitle: sP.piece_title, 
                pieceWorkNumber: sP.piece_work_number, 
                movementItemAmount: piecePracticeMovementsAmount,
                dateLastUsed: dateToday,
                dateAdded: dateToday
            };
            console.log(piecePracticeArray.pieceTitle, piecePracticeArray.pieceWorkNumber);
        }

        let that = this;

        let pieceCollection = firebasef.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("piece");
        console.log("BACKEND ID: " + BackendService.token);
        return pieceCollection.doc(pieceId).set(piecePracticeArray);
        /* 
        Depracated Method Firebase
        
        return firebase.setValue(
            '/user/'+BackendService.token+'/piece/'+pieceId,
            piecePracticeArray
        );*/
    }

    removePiece(pieceId) {
        let pieceDocument = firebasef.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("piece")
            .doc(String(pieceId));

        return pieceDocument.delete().then(() => {
             console.log("Piece with ID ->" + pieceId + "<- has been deleted.");
        });        
    }

    updateMovement(pieceId: number, movementPackage){
        let dateToday = new Date().getTime();
        let pieceDocument = firebasef.firestore()
        .collection("user")
        .doc(BackendService.token)
        .collection("piece")
        .doc(String(pieceId));

        pieceDocument.update({
            dateLastUsed: dateToday,
            movementItem: movementPackage
        }).then(() => {
            console.log("Movements of piece -> " + pieceId + " <- updated.");
          });
    }

    removeSession(sessionId: number) {
        let pieceDocument = firebasef.firestore()
            .collection("user")
            .doc(BackendService.token)
            .collection("practice-session")
            .doc(String(sessionId));

        return pieceDocument.delete().then(() => {
            console.log("Session with ID ->" + sessionId + "<- has been deleted.");
        });       
    }
}