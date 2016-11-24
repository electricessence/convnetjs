import {Vol} from "../../Vol";
import {LayerIn} from "../../Layer";
import {BasicLayerBase} from "../LayerBase";
import * as LayerType from "../../LayerTypes";

/**
 * Implements Sigmoid non-linearity element-wise
 * x -> 1/(1+e^(-x))
 * so the output is between 0 and 1.
 */
export class SigmoidLayer extends BasicLayerBase
{
	readonly layer_type:LayerType.Sigmoid;

	constructor(options:LayerIn = <any>{})
	{
		super('sigmoid', options);
	}

	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;
		const V2 = V.cloneAndZero();
		const N = V.w.length;
		const V2w = V2.w;
		const Vw = V.w;
		for(let i = 0; i<N; i++)
		{
			V2w[i] = 1.0/(1.0 + Math.exp(-Vw[i]));
		}
		this.out_act = V2;
		return this.out_act;
	}

	backward():void
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		const V = this.in_act; // we need to set dw of this
		const V2 = this.out_act;
		const N = V.w.length;
		V.dw = new Float64Array(N); // zero out gradient wrt data
		for(let i = 0; i<N; i++)
		{
			const v2wi = V2.w[i];
			V.dw[i] = v2wi*(1.0 - v2wi)*V2.dw[i];
		}
	}
}