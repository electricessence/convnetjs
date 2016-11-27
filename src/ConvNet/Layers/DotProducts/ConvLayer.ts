// This file contains all layers that do dot products with input,
// but usually in a different connectivity pattern and weight sharing
// schemes:
// - FullyConn is fully connected dot products
// - ConvLayer does convolutions (so weight sharing spatially)
// putting them together in one file because they are very similar
import {LayerIn} from "../Layer";
import {LayerTypeValue} from "../../LayerTypeValue";
import {Vol} from "../../Vol";
import {IMap} from "typescript-dotnet-umd/IMap";
import {LayerType} from "../../LayerType";
import {ConvLayerBase} from "./ConvLayerBase";

export class ConvLayer
extends ConvLayerBase<ConvLayer.JSON>
implements ConvLayer.Unique, LayerIn
{
	readonly layer_type:LayerTypeValue.Conv;

	in_depth:number;
	in_sx:number;
	in_sy:number;

	sx:number;
	sy:number;
	stride:number;
	pad:number;

	constructor(options:ConvLayer.Options = <any>{})
	{
		let {in_sx, in_sy, in_depth, sx, sy, stride} = options;

		let pad = typeof options.pad!=='undefined' ? options.pad : 0; // amount of 0 padding to add around borders of input volume

		// note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
		// volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
		// final application.
		super(LayerType.Conv,
			Math.floor((in_sx + pad*2 - sx)/stride + 1),
			Math.floor((in_sy + pad*2 - sy)/stride + 1),
			options.filters,
			options);

		this.in_depth = in_depth;
		this.in_sx = in_sx;
		this.in_sy = in_sy;
		this.sx = sx; // filter size. Should be odd if possible, it's cleaner.

		// optional
		this.sy = sy = typeof sy!=='undefined' ? sy : sx;
		this.stride = typeof stride!=='undefined' ? stride : 1; // stride at which we apply filters to input volume
		this.pad = pad;

		for(let i = 0; i<this.out_depth; i++)
		{ this.filters.push(new Vol(sx, sy, in_depth)); }

	}

	forward(V:Vol):Vol
	{
		// optimized code by @mdda that achieves 2x speedup over previous version

		this.in_act = V;
		const A = new Vol(this.out_sx | 0, this.out_sy | 0, this.out_depth | 0, 0.0);

		const V_sx = V.sx | 0;
		const V_sy = V.sy | 0;
		const xy_stride = this.stride | 0;

		for(let d = 0; d<this.out_depth; d++)
		{
			const f = this.filters[d];
			let x = -this.pad | 0;
			let y = -this.pad | 0;
			for(let ay = 0; ay<this.out_sy; y += xy_stride, ay++)
			{  // xy_stride
				x = -this.pad | 0;
				for(let ax = 0; ax<this.out_sx; x += xy_stride, ax++)
				{  // xy_stride

					// convolve centered at this particular location
					let a = 0.0;
					for(let fy = 0; fy<f.sy; fy++)
					{
						const oy = y + fy; // coordinates in the original input array coordinates
						for(let fx = 0; fx<f.sx; fx++)
						{
							const ox = x + fx;
							if(oy>=0 && oy<V_sy && ox>=0 && ox<V_sx)
							{
								for(let fd = 0; fd<f.depth; fd++)
								{
									// avoid function call overhead (x2) for efficiency, compromise modularity :(
									a
										+= f.w[((f.sx*fy) + fx)*f.depth + fd]*V.w[((V_sx*oy) + ox)*V.depth + fd];
								}
							}
						}
					}
					a += this.biases.w[d];
					A.set(ax, ay, d, a);
				}
			}
		}
		this.out_act = A;
		return this.out_act;
	}

	backward():void
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		const V = this.in_act;
		V.dw = new Float64Array(V.w.length); // zero out gradient wrt bottom data, we're about to fill it

		const V_sx = V.sx | 0;
		const V_sy = V.sy | 0;
		const xy_stride = this.stride | 0;

		for(let d = 0; d<this.out_depth; d++)
		{
			const f = this.filters[d];
			let x = -this.pad | 0;
			let y = -this.pad | 0;
			for(let ay = 0; ay<this.out_sy; y += xy_stride, ay++)
			{  // xy_stride
				x = -this.pad | 0;
				for(let ax = 0; ax<this.out_sx; x += xy_stride, ax++)
				{  // xy_stride

					// convolve centered at this particular location
					const chain_grad = this.out_act.get_grad(ax, ay, d); // gradient from above, from chain rule
					for(let fy = 0; fy<f.sy; fy++)
					{
						const oy = y + fy; // coordinates in the original input array coordinates
						for(let fx = 0; fx<f.sx; fx++)
						{
							const ox = x + fx;
							if(oy>=0 && oy<V_sy && ox>=0 && ox<V_sx)
							{
								for(let fd = 0; fd<f.depth; fd++)
								{
									// avoid function call overhead (x2) for efficiency, compromise modularity :(
									const ix1 = ((V_sx*oy) + ox)*V.depth + fd;
									const ix2 = ((f.sx*fy) + fx)*f.depth + fd;
									f.dw[ix2] += V.w[ix1]*chain_grad;
									V.dw[ix1] += f.w[ix2]*chain_grad;
								}
							}
						}
					}
					this.biases.dw[d] += chain_grad;
				}
			}
		}
	}


	toJSON():ConvLayer.JSON
	toJSON<T extends IMap<any>>(json:T):T & ConvLayer.JSON
	toJSON(json:any = {}):any & ConvLayer.JSON
	{
		json.sx = this.sx; // filter size in x, y dims
		json.sy = this.sy;
		json.in_depth = this.in_depth;
		json.stride = this.stride;
		json.pad = this.pad;

		return super.toJSON(json);
	}

	fromJSON(json:ConvLayer.JSON):this
	{
		super.fromJSON(json);

		this.sx = json.sx; // filter size in x, y dims
		this.sy = json.sy;
		this.in_depth = json.in_depth; // depth of input volume
		this.stride = json.stride;
		this.pad = typeof json.pad!=='undefined' ? json.pad : 0;

		return this;
	}
}



export module ConvLayer
{

	export interface Unique
	{
		sx:number; // filter size in x, y dims
		sy?:number;
		stride:number;
		pad:number;
	}

	export interface Options extends ConvLayerBase.Options, LayerIn, Unique
	{
	}

	export interface JSON extends ConvLayerBase.JSON, LayerIn, Unique
	{
	}
}