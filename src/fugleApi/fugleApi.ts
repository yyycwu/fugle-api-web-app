export class FugleApi {
	static apiToken = localStorage.getItem('FugleApi.apiToken') || 'demo';
	static versionUrl = 'https://api.fugle.tw/realtime/v0.3/';
	static alert = alert;
	private static async fetchJson(url: string, options?: RequestInit) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				let code: number | undefined,
					message: string | undefined;
				try {
					({ error: { code, message } } = await response.json());
				} catch { }
				throw Error((code || response.status) + ' ' + (message || response.statusText));
			}
			return await response.json();
		} catch (error) {
			if (!options?.signal?.aborted) { this.alert(error); }
			throw error;
		}
	}
	static meta(symbolId: string, options?: RequestInit, apiToken = this.apiToken): Promise<MetaResult> {
		return this.fetchJson(this.versionUrl + 'intraday/meta?symbolId=' + symbolId + '&apiToken=' + apiToken, options);
	}
	static chart(symbolId: string, options?: RequestInit, apiToken = this.apiToken): Promise<ChartResult> {
		return this.fetchJson(this.versionUrl + 'intraday/chart?symbolId=' + symbolId + '&apiToken=' + apiToken, options);
	}
	static quote(symbolId: string, options?: RequestInit, apiToken = this.apiToken): Promise<QuoteResult> {
		return this.fetchJson(this.versionUrl + 'intraday/quote?symbolId=' + symbolId + '&apiToken=' + apiToken, options);
	}
	static dealts(symbolId: string, options?: RequestInit, apiToken?: string): Promise<DealtsResult>;
	static dealts(params: { symbolId: string; limit?: number; offset?: number }, options?: RequestInit, apiToken?: string): Promise<DealtsResult>;
	static dealts(symbolId: string | { symbolId: string; limit?: number; offset?: number }, options?: RequestInit, apiToken = this.apiToken): Promise<DealtsResult> {
		const params = new URLSearchParams({
			apiToken,
			...typeof symbolId === 'string' ? {
				symbolId,
				limit: 200
			} : symbolId,
		} as Record<string, any>);
		return this.fetchJson(this.versionUrl + 'intraday/dealts?' + params, options);
	}
}

interface SuccessResult {
	apiVersion: string;
}

export interface ErrorResult extends SuccessResult {
	error: {
		code: number;
		message: string
	}
}

export interface InfoObject {
	date: string;
	type: string;
	exchange: string;
	market: string;
	symbolId: string;
	countryCode: string;
	timeZone: string;
	lastUpdatedAt: string;
}

export interface ChartObject {
	a: number[];
	o: number[];
	h: number[];
	l: number[];
	c: number[];
	v: number[];
	t: number[]
}

export interface ChartResult extends SuccessResult {
	data: {
		info: InfoObject;
		chart: ChartObject
	}
}

type integer = number;
export interface MetaObject {
	market: string;
	nameZhTw: string;
	industryZhTw?: string;
	priceReference: number;
	priceHighLimit: number | null;
	priceLowLimit: number | null;
	canDayBuySell: boolean;
	canDaySellBuy: boolean;
	canShortMargin: boolean;
	canShortLend: boolean;
	tradingUnit: integer;
	currency: boolean;
	isTerminated: boolean;
	isSuspended: boolean;
	typeZhTw: string;
	abnormal?: string;
	isUnusuallyRecommended: boolean;
	isNewlyCompiled: boolean
}

export interface MetaResult extends SuccessResult {
	data: {
		info: InfoObject;
		meta: MetaObject
	}
}

export interface TotalObject {
	at: string;
	transaction: number;
	tradeValue: number;
	tradeVolume: number;
	tradeVolumeAtBid: number;
	tradeVolumeAtAsk: number;
	bidOrders?: number;
	askOrders?: number;
	bidVolume: number;
	askVolume: number;
	serial: string
}

export interface TrialObject {
	at: string;
	bid?: number;
	ask?: number;
	price: number;
	volume: number
}

export interface TradeObject {
	at: string;
	bid?: number;
	ask?: number;
	price: number;
	volume: number;
	serial: string
}

export interface BidAskObject {
	price: number;
	volume: number
}

export interface OrderObject {
	at: string;
	bids: BidAskObject[];
	asks: BidAskObject[]
}

export interface PriceObject {
	price: number;
	at: string
}

export interface QuoteObject {
	isCurbing: boolean;
	isCurbingFall: boolean;
	isCurbingRise: boolean;
	isTrial: boolean;
	isOpenDelayed: boolean;
	isCloseDelayed: boolean;
	isHalting: boolean;
	isDealt: boolean;
	isClosed: boolean;
	total?: TotalObject;
	trial?: TrialObject;
	trade?: TradeObject;
	order?: OrderObject;
	priceHigh?: PriceObject;
	priceLow?: PriceObject;
	priceOpen?: PriceObject;
	priceAvg?: PriceObject;
	change: number;
	changePercent: number;
	amplitude: number;
	priceLimit?: 0 | 1 | 2
}

export interface QuoteResult extends SuccessResult {
	data: {
		info: InfoObject;
		quote: QuoteObject
	}
}

export interface DealtObject {
	at: string;
	bid: number;
	ask: number;
	price: number;
	volume: number;
	serial: number
}

export interface DealtsResult extends SuccessResult {
	data: {
		info: InfoObject;
		dealts: DealtObject[]
	}
}
