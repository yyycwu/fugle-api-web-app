import { FugleApi } from './fugleApi.js';
export class FugleApiSocket {
    static socketVersionUrl = 'wss://api.fugle.tw/realtime/v0.3/';
    static Quote = class Quote {
        socket;
        getReadable;
        constructor(symbolId, apiToken = FugleApi.apiToken) {
            this.socket = new WebSocket(FugleApiSocket.socketVersionUrl + 'intraday/quote?symbolId=' + symbolId + '&apiToken=' + apiToken + '&oddLot=false');
            this.getReadable = async function* () {
                let resolve, reject, closeEvent = null;
                this.socket.onmessage = (messageEvent) => {
                    resolve(messageEvent);
                };
                this.socket.onclose = (socketCloseEvent) => {
                    closeEvent = socketCloseEvent;
                };
                this.socket.onerror = _event => {
                    reject(Error('WebSocket error'));
                };
                while (closeEvent === null) {
                    yield await new Promise((promiseResolve, promiseReject) => {
                        resolve = promiseResolve;
                        reject = promiseReject;
                    });
                }
                return closeEvent;
            }.bind(this);
        }
    };
}
