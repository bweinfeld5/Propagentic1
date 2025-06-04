import * as functions from "firebase-functions";
export declare const ping: functions.https.CallableFunction<any, Promise<{
    message: string;
    timestamp: number;
}>, unknown>;
