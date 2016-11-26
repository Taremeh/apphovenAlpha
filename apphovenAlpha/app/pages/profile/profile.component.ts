import { Component, OnInit, ChangeDetectionStrategy, Input } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "ui/page";
import { BackendService } from "../../shared";

import firebase = require("nativescript-plugin-firebase");

class Country {
    constructor(public name: string, public desc: string) { }
}

@Component({
    selector: "ah-profile",
    templateUrl: "pages/profile/profile.component.html",
    styleUrls: ["pages/profile/profile-common.css", "pages/profile/profile.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {
    isAndroid;
    public countries: Array<Country> = [];
    public mockedDataArray: Array<Country> = [{name: BackendService.email, desc:"Email"}];
    constructor(private _router: Router, private page: Page) {
        
    }

    ngOnInit() {
        this.isAndroid = !!this.page.android;
        this.page.actionBarHidden = false;
        
        for (var i = 0; i < this.mockedDataArray.length; i++) {
            this.countries.push(this.mockedDataArray[i]);
        }
    }

    logOut() {
        BackendService.token = "";
        firebase.logout();
        this._router.navigate(["/login"]);
    }

    public onItemTap(args) {
        console.log("Item Tapped at cell index: " + args.index);
    }

/*    onItemTapFirstList(args: ItemEventData) {
        console.log(args.index);
    }

    onItemTapSecondList(args: ItemEventData) {
        console.log(args.index);
    }

    onItemTapThirdList(args: ItemEventData) {
        console.log(args.index);
    }   
*/
}