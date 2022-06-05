import { FugleApi } from '../fugleApi/fugleApi.js';
import { FugleApiSocket } from '../fugleApi/fugleApiSocket.js';
const rowDivsMap = new WeakMap;
class SharedTimer {
    static timer = null;
    static timeout = 5000;
    static callbacks = new Map;
    static add(callback) {
        const sharedTimer = new SharedTimer;
        this.callbacks.set(sharedTimer, callback);
        return sharedTimer;
    }
    static clear() {
        this.callbacks.clear();
        this.stop();
    }
    static handler() {
        for (const callback of this.callbacks.values()) {
            callback();
        }
    }
    static start(callback) {
        const sharedTimer = this.add(callback);
        if (this.timer === null) {
            this.timer = setInterval(() => {
                this.handler();
            }, this.timeout);
            this.handler();
        }
        return sharedTimer;
    }
    static stop(sharedTimer) {
        if (sharedTimer instanceof SharedTimer) {
            const result = this.callbacks.delete(sharedTimer);
            if (this.callbacks.size === 0 &&
                this.timer !== null) {
                clearInterval(this.timer);
                this.timer = null;
            }
            return result;
        }
        else if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
            return true;
        }
        return false;
    }
    stop() {
        return SharedTimer.stop(this);
    }
}
FugleApi.alert = console.error;
class QuoteGridGroup {
    metaDivs;
    symbolIdDiv;
    get symbolId() {
        return this.symbolIdDiv.textContent;
    }
    set symbolId(id) {
        this.symbolIdDiv.textContent = id;
    }
    symbolNameDiv;
    get symbolName() {
        return this.symbolNameDiv.textContent;
    }
    set symbolName(name) {
        this.symbolNameDiv.textContent = name;
    }
    countTimesDiv;
    get countTimes() {
        return +this.countTimesDiv.textContent;
    }
    set countTimes(count) {
        this.countTimesDiv.innerHTML = QuoteGridGroup.getColorHtml(count + '', this.getCountTradeColor());
    }
    countVolumeDiv;
    get countVolume() {
        return +this.countVolumeDiv.textContent;
    }
    set countVolume(volume) {
        this.countVolumeDiv.innerHTML = QuoteGridGroup.getColorHtml(volume + '', this.getCountTradeColor());
    }
    countLastVolumeDiv;
    get countLastVolume() {
        return +this.countLastVolumeDiv.textContent;
    }
    set countLastVolume(volume) {
        this.countLastVolumeDiv.innerHTML = QuoteGridGroup.getColorHtml(volume + '', this.getCountTradeColor());
        if (volume < this.totalVolume / this.totalTransaction) {
            const span = this.countLastVolumeDiv.firstElementChild;
            span.style.fontWeight = 'normal';
        }
    }
    amplitudeDiv;
    get amplitude() {
        return parseInt(this.amplitudeDiv.textContent) || 0;
    }
    set amplitude(amplitude) {
        this.amplitudeDiv.textContent = amplitude ? amplitude.toFixed(1) + '%' : '-';
    }
    priceLowDiv;
    get priceLow() {
        return +this.priceLowDiv.textContent || 0;
    }
    set priceLow(price) {
        this.priceLowDiv.innerHTML =
            typeof price === 'undefined' ?
                '-' :
                QuoteGridGroup.getColorHtml(QuoteGridGroup.toFixed(price), this.getPriceColor(price));
    }
    bidPriceDivs;
    bidPrices = new Proxy(Object.create(null), {
        get: (_, key) => {
            const index = +key.toString();
            return +this.bidPriceDivs[index]?.textContent;
        },
        set: (_, key, value) => {
            const index = +key.toString(), div = this.bidPriceDivs[index];
            if (typeof div === 'undefined' ||
                (typeof value !== 'number' &&
                    typeof value !== 'undefined')) {
                return false;
            }
            this.setPriceLimitColorHtml(div, value, this.bidVolumeDivs, index);
            return true;
        }
    });
    tradePriceDiv;
    get tradePrice() {
        return +this.tradePriceDiv.textContent;
    }
    set tradePrice(price) {
        this.tradePriceDiv.innerHTML = typeof price === 'undefined' ? '' :
            QuoteGridGroup.getColorHtml(QuoteGridGroup.toFixed(price), this.getPriceColor(price, '#eee'));
    }
    askPriceDivs;
    askPrices = new Proxy(Object.create(null), {
        get: (_, key) => {
            const index = +key.toString();
            return +this.askPriceDivs[index]?.textContent;
        },
        set: (_, key, value) => {
            const index = +key.toString(), div = this.askPriceDivs[index];
            if (typeof div === 'undefined' ||
                (typeof value !== 'number' &&
                    typeof value !== 'undefined')) {
                return false;
            }
            this.setPriceLimitColorHtml(div, value, this.askVolumeDivs, index);
            return true;
        }
    });
    priceHighDiv;
    get priceHigh() {
        return +this.priceHighDiv.textContent || 0;
    }
    set priceHigh(price) {
        this.priceHighDiv.innerHTML =
            typeof price === 'undefined' ?
                '-'
                : QuoteGridGroup.getColorHtml(QuoteGridGroup.toFixed(price), this.getPriceColor(price));
    }
    changePercentDiv;
    get changePercent() {
        return parseInt(this.changePercentDiv.textContent);
    }
    set changePercent(percent) {
        this.changePercentDiv.innerHTML = QuoteGridGroup.getColorHtml(Math.abs(percent).toFixed(1) + '%', percent > 0 ? 'sandybrown' : percent < 0 ? 'lightgreen' : 'inherit');
    }
    priceLowLimitDiv;
    get priceLowLimit() {
        return +this.priceLowLimitDiv.textContent;
    }
    set priceLowLimit(price) {
        this.priceLowLimitDiv.textContent = price === null ? '0' : QuoteGridGroup.toFixed(price);
    }
    bidVolumeDivs;
    bidVolumes = new Proxy(Object.create(null), {
        get: (_, key) => {
            const index = +key.toString();
            return +this.bidVolumeDivs[index]?.textContent;
        },
        set: (_, key, value) => {
            const index = +key.toString(), div = this.bidVolumeDivs[index];
            if (typeof div === 'undefined' ||
                (typeof value !== 'number' &&
                    typeof value !== 'undefined')) {
                return false;
            }
            div.textContent = typeof value === 'undefined' ? '' : value + '';
            return true;
        }
    });
    tradeVolumeDiv;
    get tradeVolume() {
        return +this.tradeVolumeDiv.textContent;
    }
    set tradeVolume(volume) {
        this.tradeVolumeDiv.textContent = typeof volume === 'undefined' ? '' : volume + '';
    }
    setTradeVolume(trade) {
        if (this.lastTradeAt !== null &&
            Date.now() - Date.parse(this.lastTradeAt) > 5000) {
            return;
        }
        this.tradeVolumeDiv.innerHTML = typeof trade === 'undefined' ? '' :
            QuoteGridGroup.getColorHtml(trade.volume + '', trade.price === trade.bid ? 'lawngreen'
                : trade.price === trade.ask ? 'sandybrown' :
                    '#ddd');
    }
    askVolumeDivs;
    askVolumes = new Proxy(Object.create(null), {
        get: (_, key) => {
            const index = +key.toString();
            return +this.askVolumeDivs[index]?.textContent;
        },
        set: (_, key, value) => {
            const index = +key.toString(), div = this.askVolumeDivs[index];
            if (typeof div === 'undefined' ||
                (typeof value !== 'number' &&
                    typeof value !== 'undefined')) {
                return false;
            }
            div.textContent = typeof value === 'undefined' ? '' : value + '';
            return true;
        }
    });
    priceHighLimitDiv;
    get priceHighLimit() {
        return +this.priceHighLimitDiv.textContent;
    }
    set priceHighLimit(price) {
        this.priceHighLimitDiv.textContent = price === null ? '∞' : QuoteGridGroup.toFixed(price);
    }
    priceReference;
    getPriceColor(price, flatColor = 'inherit', redColor = 'coral', greenColor = 'greenyellow') {
        return price > this.priceReference ? redColor :
            price < this.priceReference ? greenColor :
                flatColor;
    }
    setPriceLimitColorHtml(div, price, volumeDivs, index) {
        if (typeof price === 'undefined') {
            div.textContent = '';
        }
        else {
            function getTransformHtml(text, color = 'inherit') {
                return '<span style="color: ' + color + ';position: absolute;transform: translate(-50%, -3px);">' + text + '</span>';
            }
            function setVolumeDivColor(color) {
                const volumeDiv = volumeDivs[index];
                if (typeof volumeDiv !== 'undefined') {
                    volumeDiv.innerHTML = QuoteGridGroup.getColorHtml(volumeDiv.textContent, color);
                }
            }
            const text = QuoteGridGroup.toFixed(price);
            if (price === this.priceHighLimit ||
                price === this.priceLowLimit) {
                div.innerHTML = getTransformHtml(price === this.priceHighLimit ? '漲停' : '跌停', this.getPriceColor(price, '#ddd', 'chocolate', 'yellowgreen'));
                setVolumeDivColor(price === this.priceHighLimit ? 'lightcoral' : 'lightgreen');
            }
            else if (price === this.tradePrice) {
                div.innerHTML = QuoteGridGroup.getColorHtml(text, this.getPriceColor(price, '#ddd', 'chocolate', 'yellowgreen'));
            }
            else {
                if (price === 0) {
                    div.innerHTML = getTransformHtml('市價');
                    setVolumeDivColor('#eee');
                }
                else {
                    div.textContent = QuoteGridGroup.toFixed(price);
                }
            }
        }
    }
    dealsDivs;
    lastDealPrice = 0 / 0;
    addDeal(price, volume, at = this.lastTradeAt ?? new Date().toISOString(), countTradeAt = this.countTradeAt) {
        if (typeof price === 'undefined') {
            return;
        }
        const div = this.dealsDivs[13], date = new Date(at);
        div.innerHTML =
            (date.getHours() + '').padStart(2, '0') + '<span style="color: #aaa;">' +
                (date.getMinutes() + '').padStart(2, '0') + '</span><span style="color: #ccc;">' +
                (date.getSeconds() + '').padStart(2, '0') + '</span>\n' +
                '<span style="color: ' + (price > this.lastDealPrice ?
                '#febdbd' :
                price < this.lastDealPrice ?
                    '#bbf0bb' :
                    '#eee') + ';">' + QuoteGridGroup.toFixed(price) + '</b>\n' +
                '<span style="color: ' + (countTradeAt === 2 /* CountTradeAt.Ask */ ?
                'lightcoral' :
                countTradeAt === 1 /* CountTradeAt.Bid */ ?
                    'lightgreen' :
                    '#eee') + ';">' + volume + '</b>';
        this.lastDealPrice = price;
        div.parentElement?.prepend(div);
    }
    bidsAsksLength;
    childrenDivs;
    tradeVolumeAtBid = 0;
    tradeVolumeAtAsk = 0;
    constructor(fragment) {
        const cloneFragment = quoteRowTemplate.content.cloneNode(true);
        let metaDiv, orderDiv, dealsDiv;
        this.childrenDivs = [
            this.symbolIdDiv,
            this.symbolNameDiv,
            this.countTimesDiv,
            this.countVolumeDiv,
            this.countLastVolumeDiv,
            metaDiv,
            orderDiv,
            dealsDiv
        ] = [...cloneFragment.children];
        const orderDivs = orderDiv.children;
        this.bidsAsksLength = (orderDivs.length / 2 - 4) / 2;
        let index = 0;
        this.amplitudeDiv = orderDivs[index++];
        this.priceLowDiv = orderDivs[index++];
        this.bidPriceDivs = Array.prototype.slice.call(orderDivs, index, index += this.bidsAsksLength).reverse();
        this.tradePriceDiv = orderDivs[index++];
        this.askPriceDivs = Array.prototype.slice.call(orderDivs, index, index += this.bidsAsksLength);
        this.priceHighDiv = orderDivs[index++];
        this.changePercentDiv = orderDivs[index++];
        this.priceLowLimitDiv = orderDivs[index++];
        this.bidVolumeDivs = Array.prototype.slice.call(orderDivs, index, index += this.bidsAsksLength).reverse();
        this.tradeVolumeDiv = orderDivs[index++];
        this.askVolumeDivs = Array.prototype.slice.call(orderDivs, index, index += this.bidsAsksLength);
        this.priceHighLimitDiv = orderDivs[index];
        const metaDivs = metaDiv.children;
        this.metaDivs = metaDivs;
        {
            let index = metaDivs.length - 1;
            while (index-- > 0) {
                metaDivs[index].textContent = '';
            }
            index = orderDivs.length;
            while (index-- > 0) {
                orderDivs[index].textContent = '';
            }
        }
        this.dealsDivs = dealsDiv.children;
        const closeDiv = metaDiv.lastElementChild;
        closeDiv.onclick = () => {
            this.remove();
        };
        fragment.appendChild(cloneFragment);
    }
    async initMeta() {
        const { data: { meta: { market, nameZhTw, industryZhTw, priceReference, priceHighLimit, priceLowLimit, canDayBuySell, canDaySellBuy, canShortMargin, canShortLend, isTerminated, isSuspended, typeZhTw, abnormal, isUnusuallyRecommended } } } = await FugleApi.meta(this.symbolId);
        this.priceReference = priceReference;
        this.priceHighLimit = priceHighLimit;
        this.priceLowLimit = priceLowLimit;
        this.symbolName = nameZhTw;
        if (canDaySellBuy && !canDayBuySell) {
            this.setMeta('先賣現沖');
            const error = new Error('Impossible \'canDaySellBuy\' ' + canDaySellBuy + ', but \'canDayBuySell\'' + canDayBuySell);
            alert(error);
            throw error;
        }
        function getBuyHtml() {
            return '<span style="background-color: brown;">買</span>';
        }
        function getSellHtml() {
            return '<span style="background-color: seagreen;color: lightgreen;">賣</span>';
        }
        const getColorHtml = QuoteGridGroup.getColorHtml;
        function getTypeZhTw() {
            return typeZhTw.endsWith('證') ?
                typeZhTw.endsWith('認購權證') ?
                    getColorHtml('認購權證', 'lightpink') :
                    typeZhTw.endsWith('認售權證') ?
                        getColorHtml('認售權證', 'lightgreen') :
                        typeZhTw.endsWith('牛證') ?
                            getColorHtml('牛證', 'lightpink') :
                            typeZhTw.endsWith('熊證') ?
                                getColorHtml('熊證', 'lightgreen') :
                                getColorHtml(typeZhTw, 'lightblue') :
                typeZhTw === '一般股票' ? '' : getColorHtml(typeZhTw, 'lightblue');
        }
        this.setMeta(canDayBuySell ? canDaySellBuy ?
            getBuyHtml() + getSellHtml() + '現沖' :
            '先' + getBuyHtml() + '現沖' :
            getColorHtml('禁現沖', 'gold'), market === 'TSE' ? '市' : market === 'OTC' ? '櫃' : market === 'ESB' ? '興' : market, getTypeZhTw(), industryZhTw ? industryZhTw + (industryZhTw.endsWith('業') ? '' : '業') : '', canShortMargin ? canShortLend ? '可盤下空' : '准融券不可借券盤下空' : canShortLend ? '准借券不可融券盤下空' : '不可盤下空', isTerminated ? '下市' : '', isSuspended ? '暫停交易' : '', abnormal === '正常' || !abnormal ? '' : abnormal + '股', isUnusuallyRecommended ? '異常推介股' : '');
    }
    setMeta(startIndex, ...metas) {
        if (typeof startIndex === 'string') {
            metas.unshift(startIndex);
            startIndex = 0;
        }
        for (let index = 0; index < metas.length; index++) {
            const metaDiv = this.metaDivs[startIndex + index];
            if (metaDiv) {
                const meta = metas[index];
                if (meta) {
                    metaDiv.innerHTML = meta;
                    metaDiv.hidden = false;
                }
                else {
                    metaDiv.hidden = true;
                }
            }
        }
    }
    totalTransaction = 0;
    totalVolume = 0;
    lastTradeAt = null;
    setQuote({ isCurbing, isCurbingFall, isCurbingRise, isTrial, isOpenDelayed, isCloseDelayed, isHalting, isClosed, total, trial, trade, order, priceHigh, priceLow, changePercent, amplitude }) {
        this.setMeta(9, isTrial ? '試搓' : '', isCurbing ? '瞬間價格穩定' : '', isCurbingFall ? '緩跌試搓' : '', isCurbingRise ? '緩漲試搓' : '', isOpenDelayed ? '延後開盤' : '', isCloseDelayed ? '延收' : '', isHalting ? '暫停交易' : '', isClosed ? '已收盤' : '');
        if (isTrial) {
            this.tradePrice = trial?.price;
            this.setMeta(9, '試搓');
            this.lastTradeAt = null;
        }
        else {
            this.tradePrice = trade?.price;
            this.setMeta(9, '');
            this.lastTradeAt = trade?.at ?? null;
        }
        this.priceHigh = priceHigh?.price;
        {
            let index = this.bidsAsksLength;
            while (index-- > 0) {
                const ask = order?.asks[index];
                this.askVolumes[index] = ask?.volume;
                this.askPrices[index] = ask?.price;
            }
            index = this.bidsAsksLength;
            while (index-- > 0) {
                const bid = order?.bids[index];
                this.bidVolumes[index] = bid?.volume;
                this.bidPrices[index] = bid?.price;
            }
        }
        this.setTradeVolume(isTrial ? trial : trade);
        this.priceLow = priceLow?.price;
        this.changePercent = changePercent;
        this.amplitude = amplitude;
        this.tradeVolumeAtBid = total?.tradeVolumeAtBid ?? 0;
        this.tradeVolumeAtAsk = total?.tradeVolumeAtAsk ?? 0;
        this.totalTransaction = total?.transaction ?? 0;
        this.totalVolume = total?.tradeVolume ?? 0;
    }
    quoteTimer;
    startQuote(timeout = 10000, slowTimeout = 60000) {
        if (typeof this.quoteTimer !== 'undefined') {
            return;
        }
        let quoteTimerType = 1 /* QuoteTimerType.Normal */, isClosed = false;
        const quoteHandler = async () => {
            if (document.visibilityState === 'hidden') {
                if (quoteTimerType !== 0 /* QuoteTimerType.Paused */) {
                    quoteTimerType = 0 /* QuoteTimerType.Paused */;
                    requestAnimationFrame(quoteHandler);
                }
                return;
            }
            try {
                const { data: { info: { lastUpdatedAt }, quote } } = await FugleApi.quote(this.symbolId);
                if (quote.isClosed) {
                    if (quoteTimerType !== 2 /* QuoteTimerType.Slow */) {
                        quoteTimerType = 2 /* QuoteTimerType.Slow */;
                        clearInterval(this.quoteTimer);
                        this.quoteTimer = setInterval(quoteHandler, slowTimeout);
                    }
                    if (this.countSharedTimer !== null) {
                        this.stopCount();
                        this.tradeVolume = quote.trade?.volume;
                    }
                }
                else {
                    if (quoteTimerType !== 1 /* QuoteTimerType.Normal */) {
                        quoteTimerType = 1 /* QuoteTimerType.Normal */;
                        clearInterval(this.quoteTimer);
                        this.quoteTimer = setInterval(quoteHandler, timeout);
                    }
                }
                this.setMeta(17, '');
                const lastUpdatedAtTime = Date.parse(lastUpdatedAt), socketLastUpdatedAtTime = Date.parse(this.lastUpdatedAt);
                if (lastUpdatedAtTime > socketLastUpdatedAtTime) {
                    this.lastUpdatedAt = lastUpdatedAt;
                    if (quote.isClosed) {
                        if (this.socket !== null) {
                            this.socket.close();
                            this.socket = null;
                        }
                        this.lastTradeAt = null;
                        this.setTradeVolume(quote.trade);
                        this.setQuote(quote);
                        isClosed = true;
                    }
                    else {
                        if (isClosed) {
                            try {
                                await this.initMeta();
                                isClosed = false;
                            }
                            catch (error) {
                                this.setMeta(17, '重新連線中' + (error?.message ? ' (' + error.message + ')' : ''));
                            }
                            this.initDealts();
                        }
                        this.setQuote(quote);
                        if (lastUpdatedAtTime - socketLastUpdatedAtTime > 2000) {
                            this.socket?.close();
                            this.startQuoteSocket();
                        }
                        if (this.countSharedTimer === null) {
                            this.startCount();
                        }
                    }
                }
            }
            catch (error) {
                this.setMeta(17, '重新連線中' + (error?.message ? ' (' + error.message + ')' : ''));
            }
        };
        this.quoteTimer = setInterval(quoteHandler, timeout);
        quoteHandler();
    }
    countLastTradeAt;
    getCountTradeColor() {
        return this.countLastTradeAt === 1 /* CountTradeAt.Bid */ ? 'palegreen' :
            this.countLastTradeAt === 2 /* CountTradeAt.Ask */ ? 'sandybrown' :
                '#ddd';
    }
    get countTradeAt() {
        return this.countLastTradeAt;
    }
    set countTradeAt(countTradeAt) {
        if (countTradeAt !== this.countLastTradeAt) {
            this.countLastTradeAt = countTradeAt;
            this.countTimes = 0;
            this.countVolume = 0;
        }
        if (this.lastTradeAt !== null) {
            const time = Date.now(), lastTime = Date.parse(this.lastTradeAt);
            if (time - lastTime > 5000) {
                this.tradeVolume = void 0;
                if (time - lastTime >= 10000) {
                    this.countLastVolume = 0;
                }
            }
        }
    }
    countSharedTimer = null;
    startCount() {
        if (this.countSharedTimer !== null) {
            return;
        }
        let recentVolumeAtBid = this.tradeVolumeAtBid, recentVolumeAtAsk = this.tradeVolumeAtAsk;
        this.countSharedTimer = SharedTimer.start(() => {
            const bidVolume = this.tradeVolumeAtBid - recentVolumeAtBid, askVolume = this.tradeVolumeAtAsk - recentVolumeAtAsk;
            if (bidVolume !== askVolume) {
                if (bidVolume > askVolume) {
                    this.countTradeAt = 1 /* CountTradeAt.Bid */;
                    this.countLastVolume = bidVolume - askVolume;
                    this.addDeal(this.tradePrice, this.countLastVolume);
                }
                else if (askVolume > bidVolume) {
                    this.countTradeAt = 2 /* CountTradeAt.Ask */;
                    this.countLastVolume = askVolume - bidVolume;
                    this.addDeal(this.tradePrice, this.countLastVolume);
                }
                this.countVolume += this.countLastVolume;
                this.countTimes++;
            }
            else {
                this.countTradeAt = 0 /* CountTradeAt.Initial */;
            }
            recentVolumeAtBid = this.tradeVolumeAtBid;
            recentVolumeAtAsk = this.tradeVolumeAtAsk;
        });
    }
    stopCount() {
        if (this.countSharedTimer !== null) {
            this.countSharedTimer.stop();
            this.countSharedTimer = null;
        }
    }
    lastUpdatedAt = '1970-01-01T00:00:00.000Z';
    socket = null;
    async startQuoteSocket() {
        const connection = new FugleApiSocket.Quote(this.symbolId);
        this.socket = connection.socket;
        this.setMeta(17, '');
        try {
            for await (const { data } of connection.getReadable()) {
                if (typeof data !== 'string') {
                    continue;
                }
                const { data: { info: { lastUpdatedAt, type }, quote } } = JSON.parse(data);
                if (type !== 'EQUITY') {
                    continue;
                }
                this.lastUpdatedAt = lastUpdatedAt;
                this.setQuote(quote);
            }
        }
        catch { }
        this.setMeta(17, '主動回報連線中斷');
    }
    async initDealts() {
        for (const div of this.dealsDivs) {
            div.textContent = '';
        }
        const { data: { dealts } } = await FugleApi.dealts(this.symbolId);
        let dealAt = dealts[0]?.at;
        if (typeof dealAt === 'undefined') {
            return;
        }
        let seperatorTime = Date.parse(dealAt) - 5000, priceSum = 0, bidsVolume = 0, asksVolume = 0, fineVolume = 0;
        const deals = [];
        for (const { at, bid, ask, price, volume } of dealts) {
            const time = Date.parse(at);
            if (time < seperatorTime) {
                while (seperatorTime > time) {
                    seperatorTime -= 5000;
                }
                const dealVolume = bidsVolume + asksVolume + fineVolume;
                deals.unshift({
                    at: dealAt,
                    price: priceSum / dealVolume,
                    volume: dealVolume,
                    countTradeAt: bidsVolume > asksVolume ?
                        1 /* CountTradeAt.Bid */ :
                        asksVolume > bidsVolume ?
                            2 /* CountTradeAt.Ask */ :
                            0 /* CountTradeAt.Initial */
                });
                if (deals.length === 14) {
                    break;
                }
                dealAt = at;
                priceSum = 0;
                bidsVolume = 0;
                asksVolume = 0;
                fineVolume = 0;
            }
            if (price === bid) {
                bidsVolume += volume;
            }
            else if (price === ask) {
                asksVolume += volume;
            }
            else {
                fineVolume += volume;
            }
            priceSum += price * volume;
        }
        for (const { at, price, volume, countTradeAt } of deals) {
            this.addDeal(price, volume, at, countTradeAt);
        }
    }
    async start() {
        try {
            await this.initMeta();
        }
        catch (error) {
            const { message = '' } = error;
            this.symbolName = message.includes('403') ? '權限不足' :
                message.includes('404') ? '代碼錯誤' :
                    '網路錯誤';
            this.setMeta(message);
            throw error;
        }
        this.startQuote();
        this.initDealts();
    }
    remove() {
        for (const div of this.childrenDivs) {
            div.remove();
        }
        this.stopCount();
        this.socket?.close();
        clearInterval(this.quoteTimer);
    }
    static getColorHtml(text, color) {
        return '<span style="color: ' + color + ';">' + text + '</span>';
    }
    static toFixed(n) {
        return typeof n == 'number' ? n.toFixed(n > 500 ? 0 : n > 50 ? 1 : 2) : '-';
    }
}
addButton.onclick = async () => {
    const fragment = new DocumentFragment, group = new QuoteGridGroup(fragment);
    group.symbolId = symbolIdInput.value;
    gridDiv.appendChild(fragment);
    try {
        await group.start();
    }
    catch { }
};
symbolIdInput.onkeyup = ({ key }) => {
    if (key === 'Enter') {
        addButton.click();
        symbolIdInput.select();
    }
};
