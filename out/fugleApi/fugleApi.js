export class FugleApi {
    static apiToken = localStorage.getItem('FugleApi.apiToken') || 'demo';
    static versionUrl = 'https://api.fugle.tw/realtime/v0.3/';
    static alert = alert;
    static async fetchJson(url, options) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let code, message;
                try {
                    ({ error: { code, message } } = await response.json());
                }
                catch { }
                throw Error((code || response.status) + ' ' + (message || response.statusText));
            }
            return await response.json();
        }
        catch (error) {
            if (!options?.signal?.aborted) {
                this.alert(error);
            }
            throw error;
        }
    }
    static meta(symbolId, options, apiToken = this.apiToken) {
        return this.fetchJson(this.versionUrl + 'intraday/meta?symbolId=' + symbolId + '&apiToken=' + apiToken, options);
    }
    static chart(symbolId, options, apiToken = this.apiToken) {
        return this.fetchJson(this.versionUrl + 'intraday/chart?symbolId=' + symbolId + '&apiToken=' + apiToken, options);
    }
    static quote(symbolId, options, apiToken = this.apiToken) {
        return this.fetchJson(this.versionUrl + 'intraday/quote?symbolId=' + symbolId + '&apiToken=' + apiToken, options);
    }
    static dealts(symbolId, options, apiToken = this.apiToken) {
        const params = new URLSearchParams({
            apiToken,
            ...typeof symbolId === 'string' ? {
                symbolId,
                limit: 200
            } : symbolId,
        });
        return this.fetchJson(this.versionUrl + 'intraday/dealts?' + params, options);
    }
}
