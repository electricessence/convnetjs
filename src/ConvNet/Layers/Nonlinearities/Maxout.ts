import {LayerBase} from "../LayerBase";
import {Layer, LayerIn} from "../../Layer";
import {Vol} from "../../Vol";
import {IMap} from "typescript-dotnet-umd/IMap";
import {LayerTypeValue} from "../../LayerTypeValue";
import {LayerType} from "../../LayerType";



/**
 * Implements Maxout non-linearity that computes
 * x -> max(x)
 * where x is a vector of size group_size. Ideally of course,
 * the input size should be exactly divisible by group_size
 */
export class MaxoutLayer extends LayerBase<MaxoutLayer.JSON> implements MaxoutLayer.Unique
{
	readonly layer_type:LayerTypeValue.Maxout;
	group_size:number;
	switches:Float64Array;

	constructor(opt:MaxoutLayer.Options = <any>{})
	{
		let {in_sx, in_sy, in_depth} = opt;
		let group_size = typeof opt.group_size!=='undefined' ? opt.group_size : 2;
		let depth = Math.floor(in_depth/group_size);
		super(LayerType.Maxout, in_sx, in_sy, depth);

		// required
		this.group_size = group_size;

		this.switches = new Float64Array(in_sx*in_sy*depth); // useful for back-prop
	}

	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;
		const N = this.out_depth;
		const V2 = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
		let i:number, j:number, ix:number, a:number, ai:number, a2:number;

		// optimization branch. If we're operating on 1D arrays we don't have
		// to worry about keeping track of x,y,d coordinates inside
		// input volumes. In conv-nets we do :(
		if(this.out_sx === 1 && this.out_sy === 1) {
			for(i = 0; i<N; i++) {
				ix = i*this.group_size; // base index offset
				a = V.w[ix];
				ai = 0;
				for(j = 1; j<this.group_size; j++) {
					a2 = V.w[ix + j];
					if(a2 > a) {
						a = a2;
						ai = j;
					}
				}
				V2.w[i] = a;
				this.switches[i] = ix + ai;
			}
		} else {
			let n = 0; // counter for switches
			for(let x =0; x<V.sx; x++) {
				for(let y =0; y<V.sy; y++) {
					for(i = 0; i<N; i++) {
						ix = i*this.group_size;
						a = V.get(x, y, ix);
						ai = 0;
						for(j = 1; j<this.group_size; j++) {
							a2 = V.get(x, y, ix + j);
							if(a2 > a) {
								a = a2;
								ai = j;
							}
						}
						V2.set(x,y,i,a);
						this.switches[n] = ix + ai;
						n++;
					}
				}
			}

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
		const N = this.out_depth;
		V.dw = new Float64Array(V.w.length); // zero out gradient wrt data
		let i:number, chain_grad:number;

		// pass the gradient through the appropriate switch
		if(this.out_sx === 1 && this.out_sy === 1) {
			for(i = 0; i<N; i++) {
				chain_grad = V2.dw[i];
				V.dw[this.switches[i]] = chain_grad;
			}
		} else {
			// bleh okay, lets do this the hard way
			let n = 0; // counter for switches
			for(let x =0; x<V2.sx; x++) {
				for(let y =0; y<V2.sy; y++) {
					for(i = 0; i<N; i++) {
						chain_grad = V2.get_grad(x, y, i);
						V.set_grad(x,y,this.switches[n],chain_grad);
						n++;
					}
				}
			}
		}
	}

	toJSON():MaxoutLayer.JSON
	toJSON<T extends IMap<any>>(json:T):T & MaxoutLayer.JSON
	toJSON(json:any = {}):any & MaxoutLayer.JSON
	{
		json.group_size = this.group_size;
		return super.toJSON(json);
	}

	fromJSON(json:MaxoutLayer.JSON):this
	{
		super.fromJSON(json);

		this.group_size = json.group_size;
		this.switches = new Float64Array(this.group_size);

		return this;
	}
}

export module MaxoutLayer
{

	export interface Unique
	{
		group_size:number;
	}

	export interface Options extends LayerIn, Unique
	{
	}
	export interface JSON extends Layer, Unique
	{
	}
}

