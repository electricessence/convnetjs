// This file contains all layers that do dot products with input,
// but usually in a different connectivity pattern and weight sharing
// schemes:
// - FullyConn is fully connected dot products
// - ConvLayer does convolutions (so weight sharing spatially)
// putting them together in one file because they are very similar
import {IMap} from "typescript-dotnet-umd/IMap";
import {LayerBase} from "./LayerBase";
import {LayerIn, Layer} from "../Layer";
import {LayerTypeValue} from "../LayerTypeValue";
import {LayerType} from "../LayerType";
import {Vol} from "../Vol";

export class PoolLayer
extends LayerBase<PoolLayer.JSON>
implements PoolLayer.Unique, LayerIn
{
	readonly layer_type:LayerTypeValue.Pool;

	in_depth:number;
	in_sx:number;
	in_sy:number;

	sx:number;
	sy:number;
	stride:number;
	pad:number;

	switchx:Float64Array;
	switchy:Float64Array;

	constructor(options:PoolLayer.Options = <any>{})
	{
		let {in_sx, in_sy, in_depth, sx, sy, stride} = options;

		let pad = typeof options.pad!=='undefined' ? options.pad : 0; // amount of 0 padding to add around borders of input volume

		// note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
		// volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
		// final application.
		super(LayerType.Pool,
			Math.floor((in_sx + pad*2 - sx)/stride + 1),
			Math.floor((in_sy + pad*2 - sy)/stride + 1),
			in_depth);

		this.in_depth = in_depth;
		this.in_sx = in_sx;
		this.in_sy = in_sy;
		this.sx = sx; // filter size. Should be odd if possible, it's cleaner.

		// optional
		this.sy = typeof sy!=='undefined' ? sy : sx;
		this.stride = typeof stride!=='undefined' ? stride : 2;
		this.pad = pad;

		// store switches for x,y coordinates for where the max comes from, for each output neuron
		this.switchx = new Float64Array(this.out_sx*this.out_sy*this.out_depth);
		this.switchy = new Float64Array(this.out_sx*this.out_sy*this.out_depth);

	}

	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;

		const A = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);

		let n = 0; // a counter for switches
		for(let d =0; d<this.out_depth; d++) {
			let x = -this.pad;
			let y = -this.pad;
			for(let ax =0; ax<this.out_sx; x+=this.stride,ax++) {
				y = -this.pad;
				for(let ay =0; ay<this.out_sy; y+=this.stride,ay++) {

					// convolve centered at this particular location
					let a = -99999; // hopefully small enough ;\
					let winX = -1, winy = -1;
					for(let fx =0; fx<this.sx; fx++) {
						for(let fy =0; fy<this.sy; fy++) {
							const oy = y + fy;
							const ox = x + fx;
							if(oy>=0 && oy<V.sy && ox>=0 && ox<V.sx) {
								const v = V.get(ox, oy, d);
								// perform max pooling and store pointers to where
								// the max came from. This will speed up back-prop
								// and can help make nice visualizations in future
								if(v > a) { a = v; winX=ox; winy=oy;}
							}
						}
					}
					this.switchx[n] = winX;
					this.switchy[n] = winy;
					n++;
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

		// pooling layers have no parameters, so simply compute
		// gradient wrt data here
		const V = this.in_act;
		V.dw = new Float64Array(V.w.length); // zero out gradient wrt data
		let A = this.out_act; // computed in forward pass

		let n = 0;
		for(let d =0; d<this.out_depth; d++) {
			let x = -this.pad;
			let y = -this.pad;
			for(let ax =0; ax<this.out_sx; x+=this.stride,ax++) {
				y = -this.pad;
				for(let ay =0; ay<this.out_sy; y+=this.stride,ay++) {

					const chain_grad = A.get_grad(ax, ay, d);
					V.add_grad(this.switchx[n], this.switchy[n], d, chain_grad);
					n++;

				}
			}
		}
	}


	toJSON():PoolLayer.JSON
	toJSON<T extends IMap<any>>(json:T):T & PoolLayer.JSON
	toJSON(json:any = {}):any & PoolLayer.JSON
	{
		json.sx = this.sx;
		json.sy = this.sy;
		json.stride = this.stride;
		json.in_depth = this.in_depth;
		json.pad = this.pad;

		return super.toJSON(json);
	}

	fromJSON(json:PoolLayer.JSON):this
	{
		super.fromJSON(json);

		this.sx = json.sx;
		this.sy = json.sy;
		this.stride = json.stride;
		this.in_depth = json.in_depth;
		this.pad = typeof json.pad !== 'undefined' ? json.pad : 0; // backwards compatibility

		this.switchx = new Float64Array(this.out_sx*this.out_sy*this.out_depth); // need to re-init these appropriately
		this.switchy = new Float64Array(this.out_sx*this.out_sy*this.out_depth);

		return this;
	}
}



export module PoolLayer
{

	export interface Unique
	{
		sx:number; // filter size in x, y dims
		sy:number;
		stride:number;
		pad:number;

		switchx:Float64Array;
		switchy:Float64Array;
	}

	export interface Options extends LayerIn, Unique
	{
	}

	export interface JSON extends Layer, LayerIn, Unique
	{
	}
}
