import {Injectable} from "@angular/core";

@Injectable()
export class Firebaseimgurl {
    private myUrl;

    constructor() {}

    setval(val) {
        this.myUrl = val;
    }

    getval() {
        return this.myUrl;
    }
}