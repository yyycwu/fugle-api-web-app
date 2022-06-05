import Pixi, { DisplayObject, IApplicationOptions, ILineStyleOptions, GraphicsGeometry } from 'pixi.js/index';
import { FederatedPointerEvent } from '@pixi/events/index';
import { ChartObject, FugleApi } from '../fugleApi/fugleApi.js';
declare const symbolIdInput: HTMLInputElement;
declare const addChartButton: HTMLButtonElement;
symbolIdInput.onkeyup = ({ key }) => {
	if (key === 'Enter') {
		addChartButton.click();
		symbolIdInput.select();
	}
};
declare const PIXI: typeof Pixi & { EventSystem: any };
PIXI.utils.skipHello();
delete PIXI.Renderer.__plugins.interaction;
class PixiContainer extends PIXI.Container {
	override addChild(...children: DisplayObject[]) {
		super.addChild(...children);
		return this;
	}
}
class StrokeGraphicsContainer extends PixiContainer {
	strokeGraphicsGraphics = new PIXI.Graphics;
	strokeGraphicsThickness = 1;
	strokeGraphics = new PIXI.Graphics;
	constructor() {
		super();
		this.strokeGraphicsGraphics.line.cap = PIXI.LINE_CAP.ROUND;
		this.addChild(this.strokeGraphicsGraphics);
		this.strokeGraphics.line.cap = PIXI.LINE_CAP.ROUND;
		this.addChild(this.strokeGraphics);
	}
	clear() {
		this.strokeGraphics.clear();
		this.strokeGraphicsGraphics.clear();
	}
	lineStyle(width: number, color?: number, alpha?: number, alignment?: number, native?: boolean): void;
	lineStyle(options?: ILineStyleOptions): void;
	lineStyle(options?: ILineStyleOptions | number, color?: number, alpha?: number, alignment?: number, native?: boolean): void {
		let width: number;
		if (typeof options === 'number') {
			this.strokeGraphics.lineStyle(width = options, color, alpha, alignment, native);
		} else {
			this.strokeGraphics.lineStyle(options);
			width = options?.width ?? 0;
		}
		this.strokeGraphicsGraphics.lineStyle(width + this.strokeGraphicsThickness * 2, 0xbbbbbb);
	}
	moveTo(x: number, y: number, x2 = x, y2 = y) {
		this.strokeGraphics.moveTo(x, y);
		this.strokeGraphicsGraphics.moveTo(x2, y2);
	}
	lineTo(x: number, y: number) {
		this.strokeGraphics.lineTo(x, y);
		this.strokeGraphicsGraphics.lineTo(x, y);
	}
}
class Alignment {
	static fixedLength(n: number) {
		return n > 500 ? 0 : n > 50 ? 1 : 2;
	}
	static spaceBetweenHeight(height: number, ...children: { y: number; height: number }[]) {
		let sum = 0;
		for (const child of children) {
			sum += child.height;
		}
		const space = (height - sum) / (children.length - 1);
		let offset = 0;
		for (const child of children) {
			child.y = Math.round(offset);
			offset += child.height + space;
		}
	}
	static rightAlign(width: number | { width: number }, ...children: { x: number; width: number }[]) {
		if (typeof width !== 'number') {
			for (const child of children) {
				child.x = 0;
			}
			width = width.width;
		}
		for (const child of children) {
			child.x = width - child.width;
		}
	}
	static bottomAlign(height: number, ...children: { y: number; height: number }[]) {
		for (const child of children) {
			child.y = height - child.height;
		}
	}
	static stackVertical(...children: (number | { y: number; height: number })[]) {
		let y = 0;
		for (const child of children) {
			if (typeof child === 'number') {
				y += child;
			} else {
				child.y = y;
				y += child.height;
			}
		}
	}
	static roundChart({ a, o, h, l, c, v, t }: ChartObject, interval = 5 * 60_000) {
		const length = t.length;
		const chart = {
			a: [] as number[],
			o: [] as number[],
			h: [] as number[],
			l: [] as number[],
			c: [] as number[],
			v: [] as number[],
			t: [] as number[]
		};
		let high = h[0],
			low = l[0];
		for (let index = 0; index < length;) {
			const t0 = t[index];
			let h0 = h[index],
				l0 = l[index],
				vSum = v[index],
				aSum = a[index] * vSum;
			let i = index + 1;
			if (i < length) {
				for (; t[i] - t0 < interval; i++) {
					if (h[i] > h0) {
						h0 = h[i];
					}
					if (l[i] < l0) {
						l0 = l[i];
					}
					aSum += a[i] * v[i];
					vSum += v[i];
				}
			}
			chart.a.push(aSum / vSum);
			chart.o.push(o[index]);
			chart.h.push(h0);
			chart.l.push(l0);
			chart.c.push(c[i - 1]);
			chart.v.push(vSum);
			chart.t.push(t0);
			if (h0 > high) {
				high = h0;
			}
			if (l0 < low) {
				low = l0;
			}
			index = i;
		}
		return { high, low, chart };
	}
	static stackBlock(width: number, children: ChartBlockContainer[], updateCallback: (block: ChartBlockContainer) => void) {
		const blockHeight = 200,
			growBlockWidth = 380,
			maxBlockWidth = 600;
		const colCount = Math.floor(width / growBlockWidth),
			colWidth = Math.min(maxBlockWidth, width / colCount),
			endColCount = children.length % colCount,
			endColWidth = Math.min(maxBlockWidth, width / endColCount),
			endIndex = children.length - endColCount;
		let x = 0,
			y = 0;
		for (let index = 0; index < endIndex; index++) {
			const child = children[index];
			child.x = x;
			child.y = y;
			child.blockHeight = blockHeight;
			if (child.blockWidth !== colWidth) {
				child.blockWidth = colWidth;
				if (typeof updateCallback === 'function') {
					updateCallback(child);
				}
			}
			x += colWidth;
			if ((index + 1) % colCount === 0) {
				x = 0;
				y += blockHeight;
			}
		}
		for (let index = endIndex; index < children.length; index++) {
			const child = children[index];
			child.x = x;
			child.y = y;
			child.blockHeight = blockHeight;
			if (child.blockWidth !== endColWidth) {
				child.blockWidth = endColWidth;
				if (typeof updateCallback === 'function') {
					updateCallback(child);
				}
			}
			x += endColWidth;
		}
		return endColCount > 0 ? y + blockHeight : y;
	}
}
let draggingTarget: DisplayObject | null = null,
	draggingTargetIndex = 0;
class DraggableContainer extends PixiContainer {
	draggableTarget: DisplayObject = this;
	dropped = false;
	constructor(draggableTarget?: DisplayObject) {
		super();
		if (draggableTarget) {
			this.draggableTarget = draggableTarget;
		}
		let targetLocalPoint = new PIXI.Point,
			targetGlobalPoint = new PIXI.Point,
			offsetPoint = new PIXI.Point;
		function pointerMove({ x, y }: FederatedPointerEvent) {
			if (draggingTarget !== null) {
				const pointerLocalPoint = new PIXI.Point(x - targetGlobalPoint.x, y - targetGlobalPoint.y);
				draggingTarget.x = pointerLocalPoint.x - offsetPoint.x;
				draggingTarget.y = pointerLocalPoint.y - offsetPoint.y;
				draggingTarget.alpha = 0.6;
			}
		}
		this.draggableTarget.on('pointerdown', ({ x, y }: FederatedPointerEvent) => {
			draggingTarget = this.draggableTarget;
			const { parent } = this.draggableTarget;
			draggingTargetIndex = parent.getChildIndex(this.draggableTarget);
			targetLocalPoint.x = this.draggableTarget.x;
			targetLocalPoint.y = this.draggableTarget.y;
			this.draggableTarget.getGlobalPosition(targetGlobalPoint);
			const pointerLocalPoint = new PIXI.Point(x - targetGlobalPoint.x, y - targetGlobalPoint.y);
			offsetPoint.x = pointerLocalPoint.x - targetLocalPoint.x;
			offsetPoint.y = pointerLocalPoint.y - targetLocalPoint.y;
			parent.setChildIndex(this.draggableTarget, 0);
			parent.interactive = true;
			parent.hitArea = parent.getLocalBounds();
			parent.on('pointermove', pointerMove);
		});
		function pointerUp() {
			if (draggingTarget === this.draggableTarget) {
				this.draggableTarget.parent.interactive = false;
				this.draggableTarget.parent.hitArea = null;
				this.draggableTarget.parent.off('pointermove', pointerMove);
				if (this.dropped === false) {
					this.draggableTarget.x = targetLocalPoint.x;
					this.draggableTarget.y = targetLocalPoint.y;
					this.draggableTarget.parent.setChildIndex(this.draggableTarget, draggingTargetIndex);
				}
				this.draggableTarget.alpha = 1;
				this.dropped = false;
				draggingTarget = null;
				draggingTargetIndex = 0;
			} else if (draggingTarget instanceof ChartBlockContainer) {
				this.drop();
				draggingTarget.dropped = true;
			}
		}
		this.draggableTarget.on('pointerup', pointerUp);
		this.draggableTarget.on('pointerupoutside', pointerUp);
		this.draggableTarget.on('pointerenter', () => {
			if (
				draggingTarget !== null &&
				draggingTarget !== this.draggableTarget &&
				draggingTarget instanceof ChartBlockContainer
			) {
				this.dragEnter();
			}
		});
		this.draggableTarget.on('pointerleave', () => {
			if (
				draggingTarget !== null &&
				draggingTarget !== this.draggableTarget &&
				draggingTarget instanceof ChartBlockContainer
			) {
				this.dragLeave();
			}
		});
	}
	dragEnter() {
		this.draggableTarget.alpha = 0.2;
	}
	dragLeave() {
		this.draggableTarget.alpha = 1;
	}
	drop() {
		const { parent } = this;
		if (parent !== draggingTarget?.parent) { return; }
		const thisIndex = parent.getChildIndex(this);
		parent.setChildIndex(draggingTarget, draggingTargetIndex >= thisIndex ? thisIndex - 1 : thisIndex);
		resizeChartApp();
		this.draggableTarget.alpha = 1;
	}
}
class ChartBlockContainer extends DraggableContainer {
	boundingRectGraphics = new PIXI.Graphics;
	yAxisContainer = new PixiContainer;
	highPriceText = new PIXI.Text('11.00', { fill: 0xeedddd, fontSize: 14 });
	avgPriceText = new PIXI.Text('10.00', { fill: 0xdddddd, fontSize: 14 });
	lowPriceText = new PIXI.Text('9.00', { fill: 0xddeedd, fontSize: 14 });
	chartContainer = new PixiContainer;
	gridGraphics = new PIXI.Graphics;
	kChartGraphicsContainer = new PixiContainer;
	kChartVolGraphics = new PIXI.Graphics;
	volSumGraphics = new PIXI.Graphics;
	avgPriceGraphicsContainer = new StrokeGraphicsContainer;
	metaContainer = new PixiContainer;
	symbolIdContainer = new PixiContainer;
	symbolIdText = new PIXI.Text('2884', { fill: 0xeeeeee, fontSize: 16, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 4 });
	symbolIdTextText = new PIXI.Text('2884', { fill: 0xeeeeee, fontSize: 16, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	highLimitText = new PIXI.Text('11.00', { fill: 0xffaaaa, fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	referPriceText = new PIXI.Text('10.00', { fill: 0xe8e8e8, fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	lowLimitText = new PIXI.Text('9.00', { fill: 0x99ff99, fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	amplitudeText = new PIXI.Text('0%', { fill: 0xe8e8e8, fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	kDetailBoxContainer = new PixiContainer;
	kDetailBoxBgGraphics = new PIXI.Graphics;
	kHighText = new PIXI.Text('11.00', { fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	kUpText = new PIXI.Text('10.00', { fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	kDownText = new PIXI.Text('9.00', { fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	kLowText = new PIXI.Text('8.00', { fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	kVolText = new PIXI.Text('1', { fontSize: 14, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 });
	kInspectLineGraphics = new PIXI.Graphics;
	timerInterval = 60000;
	timer = setInterval(() => { this.updateTimer(); }, this.timerInterval);
	updateTimer() {
		if (document.visibilityState === 'hidden') {
			clearInterval(this.timer);
			requestAnimationFrame(() => {
				this.updateTimer();
				this.timer = setInterval(() => { this.updateTimer(); }, this.timerInterval);
			});
		} else {
			this.update();
		}
	}
	controller = new AbortController;
	blockWidth = 400;
	blockHeight = 200;
	symbolIdCode = '';
	symbolIdName = '';
	setSymbolIdName(name: string) {
		this.symbolIdName = name;
		this.symbolIdText.text = this.symbolIdTextText.text = this.symbolIdCode + ' ' + name;
	}
	set symbolId(symbolId) {
		this.symbolIdCode = symbolId;
		this.symbolIdText.text = this.symbolIdTextText.text = symbolId + ' ' + this.symbolIdName;
	}
	get symbolId() {
		return this.symbolIdCode;
	}
	chartHeight = 0;
	constructor(symbolId: string) {
		super();
		if (!symbolId) {
			symbolId = '2884';
		}
		this.symbolId = symbolId;
		this.addChild(
			this.boundingRectGraphics,
			this.yAxisContainer.addChild(
				this.highPriceText,
				this.avgPriceText,
				this.lowPriceText
			),
			this.chartContainer.addChild(
				this.gridGraphics,
				this.kChartGraphicsContainer,
				this.avgPriceGraphicsContainer,
				this.kChartVolGraphics,
				this.volSumGraphics,
				this.kInspectLineGraphics,
				this.metaContainer.addChild(
					this.highLimitText,
					this.referPriceText,
					this.lowLimitText,
					this.amplitudeText
				),
				this.kDetailBoxContainer.addChild(
					this.kDetailBoxBgGraphics,
					this.kHighText,
					this.kUpText,
					this.kDownText,
					this.kLowText,
					this.kVolText
				),
				this.symbolIdContainer.addChild(
					this.symbolIdText,
					this.symbolIdTextText
				)
			)
		);
		this.symbolIdText.blendMode = PIXI.BLEND_MODES.ADD;
		this.symbolIdText.alpha = 0.8;
		this.symbolIdTextText.alpha = 0.6;
		this.kInspectLineGraphics.visible = false;
		this.kInspectLineGraphics.blendMode = PIXI.BLEND_MODES.DIFFERENCE;
		this.kChartVolGraphics.alpha = 0.5;
		this.volSumGraphics.alpha = 0.6;
		this.avgPriceGraphicsContainer.strokeGraphics.blendMode = PIXI.BLEND_MODES.ADD;
		this.avgPriceGraphicsContainer.alpha = 0.8;
		this.metaContainer.interactive = true;
		this.metaContainer.hitArea = this.metaContainer.getLocalBounds();
		const moveDetailBox = () => {
			if (this.metaContainer.y > 2) {
				this.metaContainer.y = 1;
				this.kDetailBoxContainer.y = 3;
			} else {
				Alignment.bottomAlign(this.chartHeight, this.metaContainer);
				Alignment.bottomAlign(this.chartHeight, this.kDetailBoxContainer);
			}
			this.metaContainer.hitArea = this.metaContainer.getLocalBounds();
		};
		this.metaContainer.on('pointerenter', moveDetailBox);
		this.metaContainer.y = 3;
		this.kDetailBoxContainer.interactive = true;
		this.kDetailBoxContainer.hitArea = this.metaContainer.getLocalBounds();
		this.kDetailBoxContainer.on('pointerenter', moveDetailBox);
		this.interactive = true;
		this.addEventListener('click', ({ detail }: FederatedPointerEvent) => {
			if (detail === 2) {
				this.destroy();
			}
		});
		this.init();
	}
	async init() {
		const { data: { meta: { nameZhTw, priceReference, priceHighLimit, priceLowLimit } } } = await FugleApi.meta(this.symbolId);
		this.setSymbolIdName(nameZhTw);
		const fixedLength = Alignment.fixedLength(priceLowLimit ?? priceReference);
		this.highLimitText.text = priceHighLimit ? priceHighLimit.toFixed(fixedLength) : '';
		this.referPriceText.text = priceReference.toFixed(fixedLength);
		this.lowLimitText.text = priceLowLimit ? priceLowLimit.toFixed(fixedLength) : '';
		Alignment.stackVertical(this.highLimitText, this.referPriceText, this.lowLimitText, this.amplitudeText);
		Alignment.stackVertical(this.kHighText, this.kUpText, this.kDownText, this.kLowText, this.kVolText);
		this.kDetailBoxContainer.visible = false;
	}
	scheduledAnimationFrame = false;
	async update() {
		if (
			this.scheduledAnimationFrame === false &&
			document.visibilityState === 'hidden'
		) {
			this.scheduledAnimationFrame = true;
			requestAnimationFrame(() => {
				this.scheduledAnimationFrame = false;
				this.update();
			});
			return;
		}

		this.controller.abort();
		this.controller = new AbortController;
		const signal = this.controller.signal;

		const { data: { info: { lastUpdatedAt }, chart } } = await FugleApi.chart(this.symbolId, { signal }),
			referPrice = parseFloat(this.referPriceText.text),
			{ high = referPrice, low = referPrice, chart: { a, o, h, l, c, v, t } } = Alignment.roundChart(chart, 5 * 60_000),
			fixedLength = Alignment.fixedLength(low),
			fixedHigh = high.toFixed(fixedLength),
			fixedLow = low.toFixed(fixedLength);

		function getTextColor(price: number): number {
			return price > referPrice ? 0xffbbbb : price < referPrice ? 0x99ff99 : 0xdddddd;
		}

		this.symbolIdContainer.x = 2;
		this.symbolIdContainer.y = 2;
		this.yAxisContainer.x = 4;
		this.yAxisContainer.y = 4;
		this.chartContainer.y = 8;
		this.highPriceText.text = fixedHigh;
		this.highPriceText.style.fill = getTextColor(high);
		const avg = (high + low) / 2;
		this.avgPriceText.text = avg.toFixed(fixedLength);
		this.avgPriceText.style.fill = getTextColor(avg);
		this.lowPriceText.text = fixedLow;
		this.lowPriceText.style.fill = getTextColor(low);
		this.amplitudeText.text = Math.round((high - low) / avg * 100) + '%';

		Alignment.rightAlign(this.yAxisContainer.width, this.highPriceText, this.avgPriceText, this.lowPriceText);
		Alignment.rightAlign(this.metaContainer, this.referPriceText, this.lowLimitText, this.amplitudeText, this.amplitudeText);
		Alignment.spaceBetweenHeight(this.blockHeight - 8, this.highPriceText, this.avgPriceText, this.lowPriceText);

		this.chartContainer.x = this.yAxisContainer.width + 8;
		const chartWidth = this.blockWidth - this.yAxisContainer.width - 16;
		Alignment.rightAlign(chartWidth - 2, this.metaContainer);
		Alignment.rightAlign(chartWidth + 2, this.kDetailBoxContainer);
		const chartHeight = this.blockHeight - 2 * this.chartContainer.y;
		this.chartHeight = chartHeight;
		if (this.metaContainer.y > 2) {
			this.metaContainer.calculateBounds();
			Alignment.bottomAlign(chartHeight, this.metaContainer);
		}
		this.gridGraphics.clear();
		this.gridGraphics.lineStyle(2, 0x999999);
		this.gridGraphics.moveTo(0, 0);
		this.gridGraphics.lineTo(chartWidth, 0);
		this.gridGraphics.lineStyle(1, 0xbbbbbb, 0.8);
		const halfChartHeight = chartHeight / 2;
		this.gridGraphics.moveTo(0, halfChartHeight);
		this.gridGraphics.lineTo(chartWidth, halfChartHeight);
		this.gridGraphics.lineStyle(2, 0x999999);
		this.gridGraphics.moveTo(0, chartHeight);
		this.gridGraphics.lineTo(chartWidth, chartHeight);
		this.gridGraphics.lineStyle(1, 0x888888, 0.8);
		this.gridGraphics.moveTo(0, 0);
		this.gridGraphics.lineTo(0, chartHeight);
		this.gridGraphics.moveTo(chartWidth, 0);
		this.gridGraphics.lineTo(chartWidth, chartHeight);

		this.kInspectLineGraphics.lineStyle(1, 0xbbbbbb);
		this.kInspectLineGraphics.moveTo(0, 0);
		this.kInspectLineGraphics.lineTo(0, chartHeight);

		const stickWidth = chartWidth / t.length,
			thickWidth = Math.max(2, stickWidth - 2),
			thinWidth = Math.max(2, thickWidth / 5),
			stickXOffset = thickWidth / 2,
			stickYScale = chartHeight / (high - low),
			maxVol = Math.max(...v),
			volYScale = maxVol > halfChartHeight ? halfChartHeight / maxVol : 1,
			halfVolStickWidth = Math.max(1, thickWidth / 4);
		this.kChartGraphicsContainer.removeChildren();
		this.kChartVolGraphics.clear();
		this.volSumGraphics.clear();
		let totalVol = 0;
		for (const vol of v) {
			totalVol += vol;
		}
		const volSumYScale = chartHeight / totalVol;
		this.volSumGraphics.moveTo(stickXOffset, chartHeight - v[0] * volSumYScale);
		this.volSumGraphics.lineStyle(1, 0x888888);
		let volSum = 0;
		this.avgPriceGraphicsContainer.clear();
		let avgPrice0 = a[0];
		this.avgPriceGraphicsContainer.moveTo(stickXOffset, chartHeight - (avgPrice0 - low) * stickYScale);//console.log(chart.t.length, t.length)
		for (let i = 0; i < t.length; i++) {
			const kChartGraphics = new PIXI.Graphics;
			const color = c[i] > o[i] ? 0xfe8888 : c[i] < o[i] ? 0x88fe88 : 0xfefefe,
				x = i * stickWidth + stickXOffset;
			kChartGraphics.lineStyle(thinWidth, color);
			kChartGraphics.moveTo(x, chartHeight - (l[i] - low) * stickYScale);
			kChartGraphics.lineTo(x, chartHeight - (h[i] - low) * stickYScale);
			kChartGraphics.lineStyle(thickWidth, color);
			let y1 = chartHeight - (c[i] - low) * stickYScale,
				y2 = chartHeight - (o[i] - low) * stickYScale;
			if (Math.abs(y1 - y2) < 1) {
				const quadThinWidth = Math.max(thinWidth / 4, 1);
				y1 -= quadThinWidth;
				y2 += quadThinWidth;
			}
			kChartGraphics.moveTo(x, y1);
			kChartGraphics.lineTo(x, y2);
			kChartGraphics.interactive = true;
			kChartGraphics.hitArea = new PIXI.Rectangle(x - stickXOffset, 0, stickWidth, chartHeight);
			kChartGraphics.on('pointerenter', () => {
				this.kInspectLineGraphics.x = x;
				if (this.kInspectLineGraphics.geometry.graphicsData.length === 1) {
					this.kInspectLineGraphics.geometry.graphicsData[0].lineStyle.color = (color & 0xff0000) * 3 / 4 >> 16 << 16 | (color & 0x00ff00) * 3 / 4 >> 8 << 8 | (color & 0x0000ff) * 3 / 4 >> 0;
					const geometry = this.kInspectLineGraphics.geometry as GraphicsGeometry & { invalidate(): void };
					geometry.invalidate();
				}
				this.kInspectLineGraphics.visible = true;
				this.kDetailBoxContainer.visible = true;
				const fixedLength = Alignment.fixedLength(l[i]);
				this.kHighText.text = h[i].toFixed(fixedLength);
				this.kHighText.style.fill = getTextColor(h[i]);
				let up = o[i],
					down = c[i];
				if (up < down) {
					up = c[i],
						down = o[i];
				}
				this.kUpText.text = up.toFixed(fixedLength);
				this.kUpText.style.fill = getTextColor(up);
				this.kDownText.text = down.toFixed(fixedLength);
				this.kDownText.style.fill = getTextColor(down);
				this.kLowText.text = l[i].toFixed(fixedLength);
				this.kLowText.style.fill = getTextColor(l[i]);
				this.kVolText.text = v[i] + '';
				this.kVolText.style.fill = volumeDifference > 0 ? 0xffbbbb : volumeDifference < 0 ? 0x99ff99 : 0xdddddd;
				this.kDetailBoxBgGraphics.clear();
				Alignment.rightAlign(this.kDetailBoxContainer, this.kHighText, this.kUpText, this.kDownText, this.kLowText, this.kVolText);
				const averagePriceDifference = i > 0 ? a[i] - a[i - 1] : a[i + 1] - a[i];
				this.kDetailBoxBgGraphics.beginFill(averagePriceDifference > 0 ? 0x662222 : averagePriceDifference < 0 ? 0x225522 : 0x000000, 0.6);
				this.kDetailBoxBgGraphics.drawRect(-4, -1, this.kDetailBoxContainer.width + 7, this.kDetailBoxContainer.height);
				this.kDetailBoxBgGraphics.endFill();
				Alignment.rightAlign(chartWidth + 2, this.kDetailBoxContainer);
				if (this.metaContainer.y > 2) {
					Alignment.bottomAlign(chartHeight, this.kDetailBoxContainer);
				}
				this.kDetailBoxContainer.hitArea = this.kDetailBoxContainer.getLocalBounds();
				this.metaContainer.visible = false;
				if (x < this.symbolIdContainer.x + this.symbolIdContainer.width) {
					this.symbolIdContainer.alpha = 0.2;
				}
			});
			kChartGraphics.on('pointerleave', () => {
				this.kInspectLineGraphics.visible = false;
				this.kDetailBoxContainer.visible = false;
				this.metaContainer.visible = true;
				this.symbolIdContainer.alpha = 1;
			});
			this.kChartGraphicsContainer.addChild(kChartGraphics);

			this.kChartVolGraphics.moveTo(x - halfVolStickWidth, halfChartHeight);
			const volumeDifference = i > 0 ? v[i] - v[i - 1] : v[i + 1] - v[i],
				volumeDifferenceColor = volumeDifference > 0 ? 0xff5050 : volumeDifference < 0 ? 0x00ff00 : 0xdddddd;
			this.kChartVolGraphics.lineStyle(v[i] * volYScale, volumeDifferenceColor);
			this.kChartVolGraphics.lineTo(x + halfVolStickWidth, halfChartHeight);

			volSum += v[i];
			this.volSumGraphics.lineStyle(1, volumeDifferenceColor);
			this.volSumGraphics.lineTo(x, chartHeight - volSum * volSumYScale);

			const avgPrice = a[i];
			this.avgPriceGraphicsContainer.lineStyle(2, avgPrice > avgPrice0 ? 0xfe2222 : avgPrice < avgPrice0 ? 0x00fe00 : 0xffffff);
			this.avgPriceGraphicsContainer.lineTo(x, chartHeight - (avgPrice - low) * stickYScale);
			avgPrice0 = avgPrice;
		}
	}
	override destroy() {
		clearInterval(this.timer);
		super.destroy();
		resizeChartApp();
	}
}
class ChartApp extends PIXI.Application {
	constructor(options?: IApplicationOptions) {
		super(options);
		if (!('events' in this.renderer)) {
			this.renderer.addSystem(PIXI.EventSystem, 'events');
		}
	}
	addChart(symbolId: string) {
		this.stage.addChild(new ChartBlockContainer(symbolId));
		resizeChartApp();
	}
}
declare const mainDiv: HTMLDivElement;
const chartApp = new ChartApp({ resizeTo: mainDiv, sharedTicker: true, sharedLoader: true });
mainDiv.appendChild(chartApp.view);
function updateChartBlockContainerBounds(chartBlockContainer: ChartBlockContainer) {
	if (chartBlockContainer instanceof ChartBlockContainer) {
		chartBlockContainer.boundingRectGraphics.clear();
		chartBlockContainer.boundingRectGraphics.lineStyle(2);
		chartBlockContainer.boundingRectGraphics.drawRect(0, 0, chartBlockContainer.blockWidth, chartBlockContainer.blockHeight);
		chartBlockContainer.hitArea = new PIXI.Rectangle(0, 0, chartBlockContainer.blockWidth, chartBlockContainer.blockHeight);
		chartBlockContainer.update();
	}
}
function resizeChartApp() {
	const children = chartApp.stage.children as ChartBlockContainer[],
		{ offsetHeight } = mainDiv;
	let height = Alignment.stackBlock(mainDiv.offsetWidth, children, updateChartBlockContainerBounds);
	if (height !== offsetHeight) {
		height = Alignment.stackBlock(mainDiv.offsetWidth, children, updateChartBlockContainerBounds);
	}
	mainDiv.style.height = height + 'px';
	chartApp.resize();
}
addChartButton.onclick = () => {
	chartApp.addChart(symbolIdInput.value);
};
onresize = resizeChartApp;
