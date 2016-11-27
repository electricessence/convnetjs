import {Net} from "./Net";
import {merge, trim, apply} from "typescript-dotnet-umd/System/Collections/MapUtility";
import Stopwatch from "typescript-dotnet-umd/System/Diagnostics/Stopwatch";
import {Vol} from "./Vol";
export class Trainer implements Trainer.Options
{
	learning_rate:number;
	l1_decay:number;
	l2_decay:number;
	method:Trainer.MethodValue.Any;
	momentum:number;
	ro:number;
	eps:number;
	beta1:number;
	beta2:number;

	readonly regression:boolean;
	k:number;
	gsum:Float64Array[];
	xsum:Float64Array[];

	batch_size:number;

	constructor(public readonly net:Net, options:Trainer.Options = <any>{})
	{
		options = merge(Trainer.OptionsDefaults, options);
		trim(options, Trainer.OptionsDefaults);
		apply(this, options);

		this.k = 0; // iteration counter
		this.gsum = []; // last iteration gradients (used for momentum calculations)
		this.xsum = []; // used in adam or adadelta

		// check if regression is expected
		this.regression = this.net.layers[this.net.layers.length - 1].layer_type==="regression";

	}

	train(x:Vol, y:number|ArrayLike<number>|{dim:number,val:number}) // allow type pass-through from return
	{
		const fwd_time = Stopwatch.measure(() =>
		{
			this.net.forward(x, true);
		}).milliseconds;

		let cost_loss = 0; // also set the flag that lets the net know we're just training
		const bwd_time = Stopwatch.measure(() =>
		{
			cost_loss = this.net.backward(y);
		}).milliseconds;


		if(this.regression && (y instanceof Array || y instanceof Float64Array))
			console.log("Warning: a regression net requires an array as training output vector.");

		let i:number;
		let l2_decay_loss = 0.0, l1_decay_loss = 0.0;

		this.k++;
		if(this.k%this.batch_size===0)
		{

			const pglist = this.net.getParamsAndGrads();

			// initialize lists for accumulators. Will only be done once on first iteration
			if(this.gsum.length===0 && (this.method!==Trainer.Method.SGD || this.momentum>0.0))
			{
				// only vanilla sgd doesn't need either lists
				// momentum needs gsum
				// adagrad needs gsum
				// adam and adadelta needs gsum and xsum
				for(i = 0; i<pglist.length; i++)
				{
					this.gsum.push(new Float64Array(pglist[i].params.length));
					if(this.method===Trainer.Method.Adam || this.method===Trainer.Method.ADADelta)
					{
						this.xsum.push(new Float64Array(pglist[i].params.length));
					}
					else
					{
						this.xsum.push(new Float64Array(0)); // conserve memory
					}
				}
			}

			let dx:number;

			// perform an update for all sets of weights
			for(i = 0; i<pglist.length; i++)
			{
				const pg = pglist[i]; // param, gradient, other options in future (custom learning rate etc)
				const p = pg.params;
				const g = pg.grads;

				// learning rate for some parameters.
				const l2_decay_mul = typeof pg.l2_decay_mul!=='undefined' ? pg.l2_decay_mul : 1.0;
				const l1_decay_mul = typeof pg.l1_decay_mul!=='undefined' ? pg.l1_decay_mul : 1.0;
				const l2_decay = this.l2_decay*l2_decay_mul;
				const l1_decay = this.l1_decay*l1_decay_mul;

				for(let j = 0, pLen = p.length; j<pLen; j++)
				{
					l2_decay_loss += l2_decay*p[j]*p[j]/2; // accumulate weight decay loss
					l1_decay_loss += l1_decay*Math.abs(p[j]);
					const l1grad = l1_decay*(p[j]>0 ? 1 : -1);
					const l2grad = l2_decay*(p[j]);

					const gij = (l2grad + l1grad + g[j])/this.batch_size; // raw batch gradient

					const gsumi = this.gsum[i];
					const xsumi = this.xsum[i];
					if(this.method===Trainer.Method.Adam)
					{
						// adam update
						gsumi[j] = gsumi[j]*this.beta1 + (1 - this.beta1)*gij; // update biased first moment estimate
						xsumi[j] = xsumi[j]*this.beta2 + (1 - this.beta2)*gij*gij; // update biased second moment estimate
						const biasCorr1 = gsumi[j]*(1 - Math.pow(this.beta1, this.k)); // correct bias first moment estimate
						const biasCorr2 = xsumi[j]*(1 - Math.pow(this.beta2, this.k)); // correct bias second moment estimate
						dx = -this.learning_rate*biasCorr1/(Math.sqrt(biasCorr2) + this.eps);
						p[j] += dx;
					}
					else if(this.method===Trainer.Method.ADAGrad)
					{
						// adagrad update
						gsumi[j] = gsumi[j] + gij*gij;
						dx = -this.learning_rate/Math.sqrt(gsumi[j] + this.eps)*gij;
						p[j] += dx;
					}
					else if(this.method===Trainer.Method.WindowGrad)
					{
						// this is adagrad but with a moving window weighted average
						// so the gradient is not accumulated over the entire history of the run.
						// it's also referred to as Idea #1 in Zeiler paper on Adadelta. Seems reasonable to me!
						gsumi[j] = this.ro*gsumi[j] + (1 - this.ro)*gij*gij;
						dx = -this.learning_rate/Math.sqrt(gsumi[j] + this.eps)*gij; // eps added for better conditioning
						p[j] += dx;
					}
					else if(this.method===Trainer.Method.ADADelta)
					{
						gsumi[j] = this.ro*gsumi[j] + (1 - this.ro)*gij*gij;
						dx = -Math.sqrt((xsumi[j] + this.eps)/(gsumi[j] + this.eps))*gij;
						xsumi[j] = this.ro*xsumi[j] + (1 - this.ro)*dx*dx; // yes, xsum lags behind gsum by 1.
						p[j] += dx;
					}
					else if(this.method===Trainer.Method.Nesterov)
					{
						dx = gsumi[j];
						gsumi[j] = gsumi[j]*this.momentum + this.learning_rate*gij;
						dx = this.momentum*dx - (1.0 + this.momentum)*gsumi[j];
						p[j] += dx;
					}
					else
					{
						// assume SGD
						if(this.momentum>0.0)
						{
							// momentum update
							dx = this.momentum*gsumi[j] - this.learning_rate*gij; // step
							gsumi[j] = dx; // back this up for next iteration of momentum
							p[j] += dx; // apply corrected gradient
						}
						else
						{
							// vanilla sgd
							p[j] += -this.learning_rate*gij;
						}
					}
					g[j] = 0.0; // zero out gradient so that we can begin accumulating anew
				}
			}
		}

		// appending softmax_loss for backwards compatibility, but from now on we will always use cost_loss
		// in future, TODO: have to completely redo the way loss is done around the network as currently
		// loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
		// and it should all be computed correctly and automatically.
		return {
			fwd_time: fwd_time,
			bwd_time: bwd_time,
			l2_decay_loss: l2_decay_loss,
			l1_decay_loss: l1_decay_loss,
			cost_loss: cost_loss,
			softmax_loss: cost_loss,
			loss: cost_loss + l1_decay_loss + l2_decay_loss
		}
	}
}

export module Trainer
{

	export module MethodValue
	{
		export type ADAM = 'adam';
		export type ADADelta = 'adadelta';
		export type SGD = 'sgd';
		export type ADAGrad = 'adagrad';
		export type WindowGrad = 'windowgrad';
		export type Nesterov = 'nesterov';

		export type Any = ADAM
			| ADADelta
			| ADAGrad
			| WindowGrad
			| Nesterov
			| SGD
	}

	export interface Options
	{
		learning_rate?:number;
		l1_decay?:number;
		l2_decay?:number;
		batch_size?:number;
		method?:MethodValue.Any;
		momentum?:number;
		ro?:number;
		eps?:number;
		beta1?:number;
		beta2?:number;
	}


	export module Method
	{
		export const Adam:MethodValue.ADAM = 'adam';
		export const ADADelta:MethodValue.ADADelta = 'adadelta';
		export const SGD:MethodValue.SGD = 'sgd';
		export const ADAGrad:MethodValue.ADAGrad = 'adagrad';
		export const WindowGrad:MethodValue.WindowGrad = 'windowgrad';
		export const Nesterov:MethodValue.Nesterov = 'nesterov';
	}

	export const OptionsDefaults = Object.freeze(<Options>{
		learning_rate: 0.01,
		l1_decay: 0,
		l2_decay: 0,
		batch_size: 1,
		method: Method.SGD,
		momentum: 0.9,
		ro: 0.95,
		eps: 1e-8,
		beta1: 0.9,
		beta2: 0.999
	});
}

