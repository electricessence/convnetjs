import {LayerIn, Layer} from "../Layer";
import {LayerBase} from "./LayerBase";
import * as LayerType from "../LayerTypes";
import {IMap} from "typescript-dotnet-umd/IMap";
import {Vol} from "../Vol";

/**
 * a bit experimental layer for now. I think it works but I'm not 100%
 * the gradient check is a bit funky. I'll look into this a bit later.
 * Local Response Normalization in window, along depths of volumes
 */
export class LocalResponseNormalizationLayer extends LayerBase<LocalResponseNormalizationLayer.JSON> implements LocalResponseNormalizationLayer.Unique
{
	readonly layer_type:LayerType.LocalResponseNormalization;

	k:number;
	n:number;
	alpha:number;
	beta:number;

	private _cache:Vol;

	constructor(opt:LocalResponseNormalizationLayer.Options)
	{
		let {in_sx, in_sy, in_depth} = opt;
		super('lrn', in_sx, in_sy, in_depth);

		// required
		this.k = opt.k;
		this.n = opt.n;
		this.alpha = opt.alpha;
		this.beta = opt.beta;

		// checks
		if(this.n%2===0)
		{ console.warn('WARNING n should be odd for LRN layer'); }
	}


	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;

		const A = V.cloneAndZero();
		this._cache = V.cloneAndZero();
		const n2 = Math.floor(this.n/2);
		for(let x = 0; x<V.sx; x++)
		{
			for(let y = 0; y<V.sy; y++)
			{
				for(let i = 0; i<V.depth; i++)
				{

					const ai = V.get(x, y, i);

					// normalize in a window of size n
					let den = 0.0;
					for(let j = Math.max(0, i - n2); j<=Math.min(i + n2, V.depth - 1); j++)
					{
						const aa = V.get(x, y, j);
						den += aa*aa;
					}
					den *= this.alpha/this.n;
					den += this.k;
					this._cache.set(x, y, i, den); // will be useful for backprop
					den = Math.pow(den, this.beta);
					A.set(x, y, i, ai/den);
				}
			}
		}

		this.out_act = A;
		return this.out_act; // dummy identity function for now
	}

	backward()
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		// evaluate gradient wrt data
		const V = this.in_act; // we need to set dw of this
		V.dw = new Float64Array(V.w.length); // zero out gradient wrt data
		// let A = this.out_act; // computed in forward pass

		const n2 = Math.floor(this.n/2);
		for(let x = 0; x<V.sx; x++)
		{
			for(let y = 0; y<V.sy; y++)
			{
				for(let i = 0; i<V.depth; i++)
				{

					const chain_grad = this.out_act.get_grad(x, y, i);
					const S = this._cache.get(x, y, i);
					const SB = Math.pow(S, this.beta);
					const SB2 = SB*SB;

					// normalize in a window of size n
					for(let j = Math.max(0, i - n2); j<=Math.min(i + n2, V.depth - 1); j++)
					{
						let aj = V.get(x, y, j);
						let g = -aj*this.beta*Math.pow(S, this.beta - 1)*this.alpha/this.n*2*aj;
						if(j===i) g += SB;
						g /= SB2;
						g *= chain_grad;
						V.add_grad(x, y, j, g);
					}

				}
			}
		}
	}

	toJSON():LocalResponseNormalizationLayer.JSON
	toJSON<T extends IMap<any>>(json:T):T & LocalResponseNormalizationLayer.JSON
	toJSON(json:any = {}):any & LocalResponseNormalizationLayer.JSON
	{
		json.k = this.k;
		json.n = this.n;
		json.alpha = this.alpha;
		json.beta = this.beta;

		return super.toJSON(json);
	}

	fromJSON(json:LocalResponseNormalizationLayer.JSON):this
	{
		super.fromJSON(json);

		this.k = json.k;
		this.n = json.n;
		this.alpha = json.alpha;
		this.beta = json.beta;

		return this;
	}

}

export module LocalResponseNormalizationLayer
{

	export interface Unique
	{
		k:number;
		n:number;
		alpha:number;
		beta:number;
	}

	export interface Options extends LayerIn, Unique
	{
	}
	export interface JSON extends Layer, Unique
	{
	}
}


