import {LayerBase} from "./LayerBase";
import {LayerProperties, LayerIn} from "./Layer";
import {initialize} from "typescript-dotnet-umd/System/Collections/Array/Utility";
import {Vol} from "../Vol";
import {IMap} from "typescript-dotnet-umd/IMap";
import {LayerTypeValue} from "../LayerTypeValue";


/**
 * An inefficient dropout layer
 * Note this is not most efficient implementation since the layer before
 * computed all these activations and now we're just going to drop them :(
 * same goes for backward pass. Also, if we wanted to be efficient at test time
 * we could equivalently be clever and upscale during train and copy pointers during test
 * todo: make more efficient.
 */
export class DropoutLayer extends LayerBase<DropoutLayer.JSON>
{
	readonly layer_type:LayerTypeValue.Dropout;
	drop_prob:number;
	dropped:boolean[];

	constructor(opt:DropoutLayer.Options = <any>{})
	{
		let {in_sx, in_sy, in_depth} = opt;
		super('dropout', in_sx, in_sy, in_depth);

		this.drop_prob = typeof opt.drop_prob!=='undefined' ? opt.drop_prob : 0.5;
		this.dropped = initialize<boolean>(in_sx*in_sy*in_depth);
	}

	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;
		const V2 = V.clone();
		const N = V.w.length;

		let i;
		if(is_training)
		{
			// do dropout
			for(i = 0; i<N; i++)
			{
				if(Math.random()<this.drop_prob)
				{
					V2.w[i] = 0;
					this.dropped[i] = true;
				} // drop!
				else
				{this.dropped[i] = false;}
			}
		}
		else
		{
			// scale the activations during prediction
			for(i = 0; i<N; i++)
			{ V2.w[i] *= this.drop_prob; }
		}
		this.out_act = V2;
		return this.out_act; // dummy identity function for now
	}

	backward():void
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		const V = this.in_act; // we need to set dw of this
		const chain_grad = this.out_act;
		const N = V.w.length;
		V.dw = new Float64Array(N);
		for(let i = 0; i<N; i++)
		{
			if(!(this.dropped[i]))
			{
				V.dw[i] = chain_grad.dw[i]; // copy over the gradient
			}
		}
	}

	toJSON():DropoutLayer.JSON
	toJSON<T extends IMap<any>>(json:T):T & DropoutLayer.JSON
	toJSON(json:any = {}):any & DropoutLayer.JSON
	{
		json.drop_prob = this.drop_prob;
		return super.toJSON(json);
	}

	fromJSON(json:DropoutLayer.JSON):this
	{
		super.fromJSON(json);
		this.drop_prob = json.drop_prob;

		return this;
	}
}

export module DropoutLayer
{

	export interface Unique
	{
		drop_prob:number;
	}

	export interface Options extends LayerIn, Unique
	{
	}
	export interface JSON extends LayerProperties, Unique
	{
	}
}