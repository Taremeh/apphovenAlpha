import { Injectable } from "@angular/core";
import { Http, Headers, Response, RequestOptions } from "@angular/http";

@Injectable()
export class HttpService {
    private serverUrlBase = "";

    constructor(private http: Http) { }

    postData(data: any, urlPath: string) {
        let options = this.createRequestOptions();
        return this.http.post(this.serverUrlBase + urlPath, { data }, options)
            .map(res => res.json());
    }

    getData(type: number, query: string, composer_id: number = null) {
        let options = this.createRequestOptions();
        console.log("COMPOSER ID CHECK: " + composer_id);
        let urlPath = "&type=" + type + "&composer_id=" + composer_id + "&query=" + encodeURI(query);
        console.log("PATH: " + urlPath);
        let headers = this.createRequestHeader();
        return this.http.get(this.serverUrlBase + urlPath, { headers: headers })
            .map(res => res.json());
    } 
    getResponseInfo(urlPath: string) {
        let options = this.createRequestOptions();
        return this.http.get(this.serverUrlBase + urlPath, options)
            .do(res => res);
    }

    getToken() {
        // IN DEV
        let options = this.createRequestOptions();
        let urlPath = "tkng.php?tknp=" + Math.floor((Math.random() * 1000) + 1);
        return this.http.get(this.serverUrlBase + urlPath)
            .map(res => res.json());
    }

    private createRequestOptions() {
        let headers = new Headers();
        //headers.append("AuthKey", "my-key");
        //headers.append("AuthToken", "my-token");
        headers.append("Content-Type", "application/json");
        let options = new RequestOptions({ headers: headers });
        return options;
    }

    private createRequestHeader() {
        let headers = new Headers();
        // set headers here e.g.
        headers.append("AuthKey", "my-key");
        headers.append("AuthToken", "my-token");
        headers.append("Content-Type", "application/json");
        return headers;
    }
}