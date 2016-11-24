import {LossBase} from "./LossBase";
import * as LayerType from "../../LayerTypes";
import {Integer} from "typescript-dotnet-umd/System/Integer";


/**
 *
 * implements an L2 regression cost layer,
 * so penalizes \sum_i(||x_i - y_i||^2), where x is its input
 * and y is the user-provided array of "correct" values.
 */
export class RegressionLayer extends LossBase
{
	readonly layer_type:LayerType.Regression;

	constructor(opt:LossBase.Options = <any>{})
	{
		super('regression', opt);
	}

	backward():never
	backward(y:number|ArrayLike<number>|{dim:number,val:number}):number
	backward(y?:number|ArrayLike<number>|{dim:number,val:number}):number|never
	{
		let dy;
		let i;
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		if(!y)
			throw "Must provide y value.";

		// compute and accumulate gradient wrt weights and bias of this layer
		const x = this.in_act;
		x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol
		let loss = 0.0;
		if(isArrayLike(y))
		{
			for(i = 0; i<this.out_depth; i++)
			{
				dy = x.w[i] - y[i];
				x.dw[i] = dy;
				loss += 0.5*dy*dy;
			}
		}
		else if(typeof y==='number')
		{
			Integer.assert(y);
			// lets hope that only one number is being regressed
			dy = x.w[0] - y;
			x.dw[0] = dy;
			loss += 0.5*dy*dy;
		}
		else
		{
			// assume it is a struct with entries .dim and .val
			// and we pass gradient only along dimension dim to be equal to val
			i = y.dim;
			const yi = y.val;
			dy = x.w[i] - yi;
			x.dw[i] = dy;
			loss += 0.5*dy*dy;
		}
		return loss;
	}


}

function isArrayLike(a:any):a is ArrayLike<any>
{
	return a instanceof Array || a instanceof Float64Array;
}

