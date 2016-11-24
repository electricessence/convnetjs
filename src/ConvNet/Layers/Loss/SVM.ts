import {LossBase} from "./LossBase";
import * as LayerType from "../../LayerTypes";
import {Integer} from "typescript-dotnet-umd/System/Integer";


export class SVMLayer extends LossBase
{
	readonly layer_type:LayerType.SVM;

	constructor(opt:LossBase.Options = <any>{})
	{
		super('svm', opt);
	}

	backward():never
	backward(y:number):number
	backward(y?:number):number|never
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		if(!y)
			throw "Must provide y value.";

		Integer.assert(y);

		// compute and accumulate gradient wrt weights and bias of this layer
		const x = this.in_act;
		x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol

		// we're using structured loss here, which means that the score
		// of the ground truth should be higher than the score of any other
		// class, by a margin
		let yScore = x.w[y!]; // score of ground truth
		const margin = 1.0;
		let loss = 0.0;
		for(let i = 0; i<this.out_depth; i++)
		{
			if(y===i)
			{ continue; }
			const yDiff = -yScore + x.w[i] + margin;
			if(yDiff>0)
			{
				// violating dimension, apply loss
				x.dw[i] += 1;
				x.dw[y!] -= 1;
				loss += yDiff;
			}
		}

		return loss;
	}

}
