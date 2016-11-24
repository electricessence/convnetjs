import {Type} from "typescript-dotnet-umd/System/Types";
import {ArgumentException} from "typescript-dotnet-umd/System/Exceptions/ArgumentException";
import {updateRange, copyTo, applyTo} from "typescript-dotnet-umd/System/Collections/Array/Utility";
import {Random} from "../utility/Random";

export interface VolJSON
{
	sx:number;
	sy:number;
	depth:number;
	w:Float64Array;
}

/**
 * Vol is the basic building block of all data in a net.
 * it is essentially just a 3D volume of numbers, with a
 * width (sx), height (sy), and depth (depth).
 * it is used to hold data for all filters, all volumes,
 * all weights, and also stores all gradients w.r.t.
 * the data. c is optionally a value to initialize the volume
 * with. If c is missing, fills the Vol with random numbers.
 */
export class Vol implements VolJSON
{

	public sx:number;
	public sy:number;
	public w:Float64Array;
	public dw:Float64Array;

	public depth:number;

	constructor(sx:ArrayLike<number>, sy:null|undefined, depth:number)
	constructor(sx:number, sy:number, depth:number, c?:number)
	constructor(sx:number | ArrayLike<number>, sy:number|null|undefined, depth:number, c?:number)
	{
		let w = new Float64Array(depth);
		this.dw = new Float64Array(depth);
		this.w = w;
		let i:number;

		if(Type.isNumber(sx, true))
		{
			if(isNaN(sx))
				throw new ArgumentException("sx", "Is NaN.");

			// we were given dimensions of the vol
			this.sx = sx;
			this.sy = sy!;
			this.depth = depth;
			const n:number = sx*sy*depth;

			if(Type.isNullOrUndefined(c))
			{
				// weight normalization is done to equalize the output
				// variance of every neuron, otherwise neurons with a lot
				// of incoming connections have outputs of larger variance
				const scale = Math.sqrt(1.0/n);
				for(i = 0; i<n; i++)
				{
					this.w[i] = Random.n(0.0, scale);
				}
			}
			else
			{
				this.from(sx, sy!, depth, c);
			}
		}
		else
		{
			// we were given a list in sx, assume 1D volume and fill it up
			this.from(1, 1, sx.length, sx);
		}
	}

	get(x:number, y:number, d:number):number
	{
		const ix = ((this.sx*y) + x)*this.depth + d;
		return this.w[ix];
	}

	set(x:number, y:number, d:number, v:number):void
	{
		const ix = ((this.sx*y) + x)*this.depth + d;
		this.w[ix] = v;
	}

	add(x:number, y:number, d:number, v:number):void
	{
		const ix = ((this.sx*y) + x)*this.depth + d;
		this.w[ix] += v;
	}

	get_grad(x:number, y:number, d:number)
	{
		const ix = ((this.sx*y) + x)*this.depth + d;
		return this.dw[ix];
	}

	set_grad(x:number, y:number, d:number, v:number):void
	{
		const ix = ((this.sx*y) + x)*this.depth + d;
		this.dw[ix] = v;
	}

	add_grad(x:number, y:number, d:number, v:number):void
	{
		const ix = ((this.sx*y) + x)*this.depth + d;
		this.dw[ix] += v;
	}

	cloneAndZero():Vol
	{
		return new Vol(this.sx, this.sy, this.depth, 0.0)
	}

	clone():Vol
	{
		const V = new Vol(this.sx, this.sy, this.depth, 0.0);
		const n = this.w.length;
		for(let i = 0; i<n; i++)
		{ V.w[i] = this.w[i]; }
		return V;
	}

	addFrom(V:Vol):void
	{
		applyTo(this.w, (v, i) => v + V.w[i]);
	}


	addFromScaled(V:Vol, a:number):void
	{
		applyTo(this.w, (v, i) => v + a*V.w[i]);
	}

	setConst(a:number):void
	{
		updateRange(this.w, a);
	}

	toJSON():VolJSON
	{

		return {
			sx: this.sx,
			sy: this.sy,
			depth: this.depth,
			w: this.w
		};
		// we wont back up gradients to save space
	}

	from(sx:number, sy:number, depth:number, w:number | ArrayLike<number>):void
	{
		this.sx = sx;
		this.sy = sy;
		this.depth = depth;

		const n = sx*sy*depth;
		this.w = new Float64Array(n);
		this.dw = new Float64Array(n);

		if(Type.isNumber(w))
		{
			updateRange(this.w, w);
		}
		else
		{
			copyTo(this.w, w);
		}
	}

	fromJSON(json:VolJSON):void
	{
		this.from(json.sx, json.sy, json.depth, json.w);
	}

}

export default Vol;