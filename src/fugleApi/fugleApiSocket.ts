import { FugleApi } from './fugleApi.js';

export class FugleApiSocket {
	static socketVersionUrl = 'wss://api.fugle.tw/realtime/v0.3/';
	static Quote = class Quote {
		socket: WebSocket;
		getReadable: () => AsyncGenerator<MessageEvent<Blob>, CloseEvent>;
		constructor(symbolId: string, apiToken = FugleApi.apiToken) {
			this.socket = new WebSocket(FugleApiSocket.socketVersionUrl + 'intraday/quote?symbolId=' + symbolId + '&apiToken=' + apiToken + '&oddLot=false');
			this.getReadable = async function* (this: Quote) {
				let resolve: (data: MessageEvent<Blob>) => void,
					reject: (reason: Error) => void,
					closeEvent: CloseEvent | null = null;
				this.socket.onmessage = (messageEvent: MessageEvent<Blob>) => {
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
					}) as MessageEvent<Blob>;
				}
				return closeEvent;
			}.bind(this);
		}
	}
}
