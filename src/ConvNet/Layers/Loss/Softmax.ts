import {LayerTypeValue} from "../../LayerTypeValue";
import {LossBase} from "./LossBase";
import {Integer} from "typescript-dotnet-umd/System/Integer";
import {Vol} from "../../Vol";
import {LayerType} from "../../LayerType";


/*
	Layers that implement a loss. Currently these are the layers that
	can initiate a backward() pass. In future we probably want a more
	flexible system that can accommodate multiple losses to do multi-task
	learning, and stuff like that. But for now, one of the layers in this
	file must be the final layer in a Net.
*/


/**
 * This is a classifier, with N discrete classes from 0 to N-1
 * it gets a stream of N incoming numbers and computes the softmax
 * function (exponentiate and normalize to sum to 1 as probabilities should)
 */
export class SoftmaxLayer extends LossBase
{
	readonly layer_type:LayerTypeValue.Softmax;

	protected es:Float64Array;

	constructor(opt:LossBase.Options = <any>{})
	{
		super(LayerType.Softmax,opt);
	}

	forward(V:Vol):Vol
	{
		this.in_act = V;

		const A = new Vol(1, 1, this.out_depth, 0.0);

		// compute max activation
		const as = V.w;
		let amax = V.w[0];

		let i:number;
		for(i = 1; i<this.out_depth; i++) {
			if(as[i] > amax) amax = as[i];
		}

		// compute exponentials (carefully to not blow up)
		const es = new Float64Array(this.out_depth);
		let esum = 0.0;
		for(i = 0; i<this.out_depth; i++) {
			const e = Math.exp(as[i] - amax);
			esum += e;
			es[i] = e;
		}

		// normalize and output to sum to one
		for(i = 0; i<this.out_depth; i++) {
			es[i] /= esum;
			A.w[i] = es[i];
		}

		this.es = es; // save these for back-prop
		this.out_act = A;
		return this.out_act;
	}

	backward():never
	backward(y:number):number
	backward(y?:number):number|never
	{
		if(!this.in_act || !this.out_act)
			throw "Propagating in wrong order.";

		if(y==void 0)
			throw "Must provide y value.";

		Integer.assert(y);
		// compute and accumulate gradient wrt weights and bias of this layer
		const x = this.in_act;
		x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol

		for(let i =0; i<this.out_depth; i++) {
			const indicator = i===y ? 1.0 : 0.0;
			x.dw[i] = -(indicator - this.es[i]);
		}

		// loss is the class negative log likelihood
		return -Math.log(this.es[y]);
	}


}