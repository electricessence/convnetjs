import {Type} from "typescript-dotnet-umd/System/Types";
import {ArgumentException} from "typescript-dotnet-umd/System/Exceptions/ArgumentException";
import {updateRange, copyTo, applyTo} from "typescript-dotnet-umd/System/Collections/Array/Utility";
import {Random} from "../utility/Random";
import {JsonSerializable} from "../JsonSerializable";


/**
 * Vol is the basic building block of all data in a net.
 * it is essentially just a 3D volume of numbers, with a
 * width (sx), height (sy), and depth (depth).
 * it is used to hold data for all filters, all volumes,
 * all weights, and also stores all gradients w.r.t.
 * the data. c is optionally a value to initialize the volume
 * with. If c is missing, fills the Vol with random numbers.
 */
export class Vol implements Vol.JSON, JsonSerializable<Vol.JSON>
{

	public sx:number;
	public sy:number;
	public w:Float64Array;
	public dw:Float64Array;

	public depth:number;

	constructor(sx:ArrayLike<number>, sy?:null|undefined, depth?:number)
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

	toJSON():Vol.JSON
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

	fromJSON(json:Vol.JSON):this
	{
		this.from(json.sx, json.sy, json.depth, json.w);
		return this;
	}

}

export module Vol {

	/**
		 Volume utilities
		 intended for use with data augmentation
		 crop is the size of output
		 dx,dy are offset wrt incoming volume, of the shift
		 fliplr is boolean on whether we also want to flip left<->right
	 * @param V
	 * @param crop
	 * @param dx
	 * @param dy
	 * @param fliplr
	 * @returns {any}
	 */
	export function augment(V:Vol, crop,
		dx = Random.integer(0, V.sx - crop),
		dy = Random.integer(0, V.sy - crop),
		fliplr = false):Vol		// note assumes square outputs of size crop x crop

	{

		// randomly sample a crop in the input volume
		let d:number, x:number, y:number, W:Vol;
		if(crop!==V.sx || dx!==0 || dy!==0)
		{
			W = new Vol(crop, crop, V.depth, 0.0);
			for(x = 0; x<crop; x++)
			{
				for(y = 0; y<crop; y++)
				{
					if(x + dx<0 || x + dx>=V.sx || y + dy<0 || y + dy>=V.sy) continue; // oob
					for(d = 0; d<V.depth; d++)
					{
						W.set(x, y, d, V.get(x + dx, y + dy, d)); // copy data over
					}
				}
			}
		}
		else
		{
			W = V;
		}

		if(fliplr)
		{
			// flip volume horizontally
			const W2 = W.cloneAndZero();
			for(x = 0; x<W.sx; x++)
			{
				for(y = 0; y<W.sy; y++)
				{
					for(d = 0; d<W.depth; d++)
					{
						W2.set(x, y, d, W.get(W.sx - x - 1, y, d)); // copy data over
					}
				}
			}
			W = W2; //swap
		}
		return W;
	}

	// img is a DOM element that contains a loaded image
	// returns a Vol of size (W, H, 4). 4 is for RGBA
	export function img_to_vol(img:HTMLImageElement, convert_grayscale = false):Vol|false
	{

		const canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext("2d");
		if(!ctx)
			throw "Cannot find 2d.";

		// due to a Firefox bug
		try
		{
			ctx.drawImage(img, 0, 0);
		}
		catch(e)
		{
			if(e.name==="NS_ERROR_NOT_AVAILABLE")
			{
				// sometimes happens, lets just abort
				return false;
			}
			else
			{
				throw e;
			}
		}

		let img_data:ImageData;
		try
		{
			img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		}
		catch(e)
		{
			if(e.name==='IndexSizeError')
			{
				return false; // not sure what causes this sometimes but okay abort
			}
			else
			{
				throw e;
			}
		}

		// prepare the input: get pixels and normalize them
		const p = img_data.data;
		const W = img.width;
		const H = img.height;
		const pv:Float64Array = new Float64Array(p.length);
		let i:number;

		for(i = 0; i<p.length; i++)
		{
			pv[i] = p[i]/255.0 - 0.5; // normalize image pixels to [-0.5, 0.5]
		}
		let x = new Vol(W, H, 4, 0.0); //input volume (image)
		x.w = pv;

		if(convert_grayscale)
		{
			// flatten into depth=1 array
			const x1 = new Vol(W, H, 1, 0.0);
			for(i = 0; i<W; i++)
			{
				for(let j = 0; j<H; j++)
				{
					x1.set(i, j, 0, x.get(i, j, 0));
				}
			}
			x = x1;
		}

		return x;
	}

}

export module Vol {
	export interface JSON
	{
		sx:number;
		sy:number;
		depth:number;
		w:Float64Array;
	}
}

export default Vol;