import {f2t} from "./utility/f2t";

export interface GraphOptions
{
	step_horizon?:number;
	maxy?:number;
	miny?:number;
}

/**
 * can be used to graph loss, or accurate over time
 */
export abstract class GraphBase<T> implements GraphOptions
{
	readonly pts:Array<{step:number, time:number}>;

	constructor(options:GraphOptions = {})
	{
		this.step_horizon = options.step_horizon || 1000;

		this.maxy = -9999;
		this.miny = 9999;

		this.pts = [];
	}

	step_horizon:number;

	maxy:number;
	miny:number;

	/**
	 * canv is the canvas we wish to update with this new data-point
	 * @param step
	 * @param y
	 */
	abstract add(step:number, y:T):void;

	/**
	 * elt is a canvas we wish to draw into
	 * @param canv
	 */
	abstract drawSelf(canv:HTMLCanvasElement):void;

	protected drawBorders(W:number, H:number, ctx:CanvasRenderingContext2D):void {

		const pad = 25;

		ctx.clearRect(0, 0, W, H);
		ctx.font = "10px Georgia";

		// draw guidelines and values
		ctx.strokeStyle = "#999";
		ctx.beginPath();
		const ng = 10;
		for(let i = 0; i<=ng; i++)
		{
			const xPos = i/ng*(W - 2*pad) + pad;
			ctx.moveTo(xPos, pad);
			ctx.lineTo(xPos, H - pad);
			ctx.fillText(f2t(i/ng*this.step_horizon/1000) + 'k', xPos, H - pad + 14);
		}
		for(let i = 0; i<=ng; i++)
		{
			const yPos = i/ng*(H - 2*pad) + pad;
			ctx.moveTo(pad, yPos);
			ctx.lineTo(W - pad, yPos);
			ctx.fillText(f2t((ng - i)/ng*(this.maxy - this.miny) + this.miny), 0, yPos);
		}
		ctx.stroke();
	}
}


export class Graph extends GraphBase<number>
{
	readonly pts:Array<{step:number, time:number, y:number}>;

	/**
	 * canv is the canvas we wish to update with this new data-point
	 * @param step
	 * @param y
	 */
	add(step:number, y:number):void
	{
		const time = new Date().getTime(); // in ms
		if(y>this.maxy*0.99) this.maxy = y*1.05;
		if(y<this.miny*1.01) this.miny = y*0.95;

		this.pts.push({step: step, time: time, y: y});
		if(step>this.step_horizon) this.step_horizon *= 2;
	}

	/**
	 * elt is a canvas we wish to draw into
	 * @param canv
	 */
	drawSelf(canv:HTMLCanvasElement):void
	{

		const pad = 25;
		const H = canv.height;
		const W = canv.width;
		const ctx = canv.getContext('2d')!;

		this.drawBorders(W,H,ctx);

		const N = this.pts.length;
		if(N<2) return;


		ctx.strokeStyle = "red";
		ctx.beginPath();
		for(let i = 0; i<N; i++)
		{
			// draw line from i-1 to i
			const p = this.pts[i];
			const pt = t(p.step, p.y, this);
			if(i===0) ctx.moveTo(pt.tx, pt.ty);
			else ctx.lineTo(pt.tx, pt.ty);
		}
		ctx.stroke();

		// draw the actual curve
		function t(x:number, y:number, s:Graph)
		{
			const tx = x/s.step_horizon*(W - pad*2) + pad;
			const ty = H - ((y - s.miny)/(s.maxy - s.miny)*(H - pad*2) + pad);
			return {tx: tx, ty: ty}
		}
	}

}


/**
 * same as graph but draws multiple lines. For now I'm lazy and duplicating
 * the code, but in future I will merge these two more nicely.
 */
export class MultiGraph extends GraphBase<number[]>
{
	maxy_forced:number;
	miny_forced:number;

	// 17 basic colors: aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, orange, purple, red, silver, teal, white, and yellow
	readonly styles:string[] = [
		"red",
		"blue",
		"green",
		"black",
		"magenta",
		"cyan",
		"purple",
		"aqua",
		"olive",
		"lime",
		"navy"
	];

	readonly numlines:number;

	readonly pts:Array<{step:number, time:number, yl:number[]}>;

	constructor(public readonly legend:any[], options:GraphOptions = {})
	{
		super(options);
		this.pts = [];

		if(typeof options.maxy!=='undefined') this.maxy_forced = options.maxy;
		if(typeof options.miny!=='undefined') this.miny_forced = options.miny;

		this.numlines = legend.length;
		this.legend = legend;

	}

	/**
	 * canv is the canvas we wish to update with this new data-point
	 * @param step
	 * @param yl
	 */
	add(step:number, yl:number[]):void
	{
		const time = new Date().getTime(); // in ms
		const n = yl.length;
		for(let k = 0; k<n; k++)
		{
			const y = yl[k];
			if(y>this.maxy*0.99) this.maxy = y*1.05;
			if(y<this.miny*1.01) this.miny = y*0.95;
		}

		if(typeof this.maxy_forced!=='undefined') this.maxy = this.maxy_forced;
		if(typeof this.miny_forced!=='undefined') this.miny = this.miny_forced;

		this.pts.push({step: step, time: time, yl: yl});
		if(step>this.step_horizon) this.step_horizon *= 2;
	}

	/**
	 * elt is a canvas we wish to draw into
	 * @param canv
	 */
	drawSelf(canv:HTMLCanvasElement):void
	{

		const pad = 25;
		const H = canv.height;
		const W = canv.width;
		const ctx = canv.getContext('2d')!;

		this.drawBorders(H,W,ctx);

		const N = this.pts.length;
		if(N<2) return;

		// draw legend
		for(let k = 0; k<this.numlines; k++)
		{
			ctx.fillStyle = this.styles[k%this.styles.length];
			ctx.fillText(this.legend[k], W - pad - 100, pad + 20 + k*16);
		}
		ctx.fillStyle = "black";

		for(let k = 0; k<this.numlines; k++)
		{

			ctx.strokeStyle = this.styles[k%this.styles.length];
			ctx.beginPath();
			for(let i = 0; i<N; i++)
			{
				// draw line from i-1 to i
				const p = this.pts[i];
				const pt = t(p.step, p.yl[k], this);
				if(i===0) ctx.moveTo(pt.tx, pt.ty);
				else ctx.lineTo(pt.tx, pt.ty);
			}
			ctx.stroke();
		}

		// draw the actual curve
		function t(x:number, y:number, s:MultiGraph)
		{
			const tx = x/s.step_horizon*(W - pad*2) + pad;
			const ty = H - ((y - s.miny)/(s.maxy - s.miny)*(H - pad*2) + pad);
			return {tx: tx, ty: ty}
		}

	}
}
