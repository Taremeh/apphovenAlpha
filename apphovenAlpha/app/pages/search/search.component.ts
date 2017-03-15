import { Component, ViewChild, ElementRef, ChangeDetectionStrategy } from "@angular/core";
import { Router } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { Animation } from "ui/animation";
import { SearchBar } from "ui/search-bar";
import { isAndroid } from "platform";
import { HttpService } from "../../shared";

@Component({
    selector: "ah-search",
    templateUrl: "pages/search/search.component.html",
    styleUrls: ["pages/search/search-common.css"]
})

export class SearchComponent {
    @ViewChild("searchContainer") searchContainer: ElementRef;
    @ViewChild("composerAddContainer") composerAddContainer: ElementRef;

    public searchResp: Array<any>; // For Testing
    public composerArray: Array<any>; // For Listview
    public composerData: Array<any>; // To fetch data

    constructor(private _page: Page, private _httpService: HttpService, private _router: Router) {
        this.searchResp = [];
        this.composerArray = [];
        this.composerData = [];
    }

    onItemTap(args) { // Would it be possible to directly pass a parameter with the object?
        console.log("Composer ID: " + this.composerData[args.index].id); 
        this._router.navigate(["/composer", this.composerData[args.index].id]);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    search(composerName: string){
        /*if((composerName+"").length > 3) {
            this._httpService.getToken().subscribe((actok) => {
                console.log("ACC: " + actok);
                this._httpService.getData("api.php/composer/?actok=" + actok + "&transform=1&filter=name_tags,cs," + composerName).subscribe((res) => {
                    console.log(res.composer);
                    console.log("STATUS: " + res.statusCode);
                    console.log(JSON.stringify(res));
                    this.searchResp[0] = JSON.stringify(res.composer[0].name_de); // Currently: Display German Name
                    this.composerData = res.composer;
                    this.composerArray = [];
                    
                    for (let i = 0; i < res.composer.length; i++) {
                        this.composerArray.push(res.composer[i]);
                    }
                    
                }, (e) => {
                    console.log("ERROR: " + e);
                    console.log("HEADER ERROR: " + e.header["Content-Type"]);
                });
            }, (e) => {
                console.log("ACHTUNG ERROR: " + e);
            });
        }*/
    }

    showContent() {
    let searchContainer = <View>this.searchContainer.nativeElement;
    let composerAddContainer = <View>this.composerAddContainer.nativeElement;
    let animations = [];

    // Fade out the initial content over one half second
    searchContainer.animate({
            opacity: 0,
            duration: 500
        }).then(function() {
            // After the animation completes, hide the initial container and
            // show the main container and logo. The main container and logo will
            // not immediately appear because their opacity is set to 0 in CSS.
            searchContainer.style.visibility = "collapse";
            composerAddContainer.style.visibility = "visible";

            // Fade in the main container and logo over one half second.
            animations.push({ target: composerAddContainer, opacity: 1, duration: 500 });

            // Kick off the animation queue
            new Animation(animations, false).play();
        })
    }

    addComposer(name: string, birthYear: number, deathYear: number, era: string, nationality: string, descENG: string, descDE: string) {
        /*this._httpService.getToken().subscribe((actok) => {
            console.log("ACC: " + actok);
            this._httpService.getData("api.php/composers/?actok=" + actok).subscribe((res) => {
                console.log(res);
                console.log("STATUS: " + res.statusCode);
                console.log(JSON.stringify(res));
            }, (e) => {
                console.log("ERROR: " + e);
            });
        });*/
        console.log("\nTIMESTAMP before:  " + Date.now());
    }
}