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

export class FullyConnLayer
extends ConvLayerBase<FullyConnLayer.JSON>
implements FullyConnLayer.Unique
{
	readonly layer_type:LayerTypeValue.FC;

	num_inputs:number;

	in_depth:number;
	in_sx:number;
	in_sy:number;

	sx:number;
	sy:number;
	stride:number;
	pad:number;

	constructor(options:FullyConnLayer.Options = <any>{})
	{
		let {in_sx, in_sy, in_depth, num_neurons, filters} = options;

		// note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
		// volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
		// final application.
		super(LayerType.FC, 1, 1,
			typeof num_neurons !== 'undefined' ? num_neurons : filters,
			options);

		this.in_depth = in_depth;
		this.in_sx = in_sx;
		this.in_sy = in_sy;

		// computed
		const ni = in_sx * in_sy * in_depth;
		this.num_inputs = ni;

		// initializations
		for(let i =0; i<this.out_depth ; i++)
		{ this.filters.push(new Vol(1, 1, ni)); }

	}

	forward(V:Vol):Vol
	{
		this.in_act = V;
		const A = new Vol(1, 1, this.out_depth, 0.0);
		const Vw = V.w;
		for(let i =0; i<this.out_depth; i++) {
			let a = 0.0;
			const wi = this.filters[i].w;
			for(let d =0; d<this.num_inputs; d++) {
				a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
			}
			a += this.biases.w[i];
			A.w[i] = a;
		}
		this.out_act = A;
		return this.out_act;
	}

	backward():void
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		const V = this.in_act;
		V.dw = new Float64Array(V.w.length); // zero out the gradient in input Vol

		// compute gradient wrt weights and data
		for(let i =0; i<this.out_depth; i++) {
			const tfi = this.filters[i];
			const chain_grad = this.out_act.dw[i];
			for(let d =0; d<this.num_inputs; d++) {
				V.dw[d] += tfi.w[d]*chain_grad; // grad wrt input data
				tfi.dw[d] += V.w[d]*chain_grad; // grad wrt params
			}
			this.biases.dw[i] += chain_grad;
		}
	}

	toJSON():FullyConnLayer.JSON
	toJSON<T extends IMap<any>>(json:T):T & FullyConnLayer.JSON
	toJSON(json:any = {}):any & FullyConnLayer.JSON
	{
		json.num_inputs = this.num_inputs;

		return super.toJSON(json);
	}

	fromJSON(json:FullyConnLayer.JSON):this
	{
		super.fromJSON(json);

		this.num_inputs = json.num_inputs;

		return this;
	}

}



export module FullyConnLayer
{

	export interface Unique
	{
		num_inputs:number;
	}

	export interface Options extends ConvLayerBase.Options, LayerIn, Unique
	{
		num_neurons?:number;
	}

	export interface JSON extends ConvLayerBase.JSON, LayerIn, Unique
	{
	}
}

