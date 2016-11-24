import {BasicLayerBase} from "../LayerBase";
import {LayerIn} from "../../Layer";
import {Vol} from "../../Vol";
import {LayerType} from "../../LayerType";
import {LayerTypeValue} from "../../LayerTypeValue";

/**
 * Implements Tanh non-linearity element-wise
 * x -> tanh(x)
 * so the output is between -1 and 1.
 */
export class TanhLayer extends BasicLayerBase
{
	readonly layer_type:LayerTypeValue.Tanh;

	constructor(options:LayerIn = <any>{})
	{
		super(LayerType.Tanh, options);
	}


	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;
		const V2 = V.cloneAndZero();
		const N = V.w.length;
		for(let i = 0; i<N; i++)
		{
			V2.w[i] = tanh(V.w[i]);
		}
		this.out_act = V2;
		return this.out_act;
	}

	backward()
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
			V.dw[i] = (1.0 - v2wi*v2wi)*V2.dw[i];
		}
	}

}


// a helper function, since tanh is not yet part of ECMAScript. Will be in v6.
function tanh(x)
{
	const y = Math.exp(2*x);
	return (y - 1)/(y + 1);
}