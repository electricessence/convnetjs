import {BasicLayerBase} from "../LayerBase";
import {LayerIn} from "../../Layer";
import {Vol} from "../../Vol";
import {LayerTypeValue} from "../../LayerTypeValue";
import {LayerType} from "../../LayerType";


/**
 * Implements ReLU non-linearity element-wise
 * x -> max(0, x)
 * the output is in [0, inf)
 */
export class ReluLayer extends BasicLayerBase
{
	readonly layer_type:LayerTypeValue.Relu;

	constructor(options:LayerIn = <any>{})
	{
		super(LayerType.Relu, options);
	}

	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;
		const V2 = V.clone();
		const N = V.w.length;
		const V2w = V2.w;
		for(let i = 0; i<N; i++)
		{
			if(V2w[i]<0) V2w[i] = 0; // threshold at 0
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
			if(V2.w[i]<=0) V.dw[i] = 0; // threshold
			else V.dw[i] = V2.dw[i];
		}
	}
}

