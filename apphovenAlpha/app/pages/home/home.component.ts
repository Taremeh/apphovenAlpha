import { Component, OnInit, OnDestroy } from "@angular/core";
import { Page } from "ui/page";
import { Router } from "@angular/router";

@Component({
    selector: "ah-home",
    templateUrl: "pages/home/home.component.html",
    styleUrls: ["pages/home/home-common.css", "pages/home/home.component.css"]
})

export class HomeComponent implements OnInit, OnDestroy {
    isAndroid;
    constructor(private _router: Router, private page: Page) {
    }

    ngOnInit() {
        console.log("Home Registiert: OnInit");
        this.isAndroid = !!this.page.android;
        this.page.actionBarHidden = false;
    }

    ngOnDestroy() {
        console.log("Home - ngOnDestroy()");
    }

    navigateTo(page: string){
        this._router.navigate([page]);
    }
}