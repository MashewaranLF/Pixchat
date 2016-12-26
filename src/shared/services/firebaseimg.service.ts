import {Injectable} from "@angular/core";

@Injectable()
export class Firebaseimgurl {
    private myUrl;

    constructor() {}

    setValue(val) {
        this.myUrl = val;
    }

    getValue() {
        return this.myUrl;
    }
}