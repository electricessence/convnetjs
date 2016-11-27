// This file contains all layers that do dot products with input,
// but usually in a different connectivity pattern and weight sharing
// schemes:
// - FullyConn is fully connected dot products
// - ConvLayer does convolutions (so weight sharing spatially)
// putting them together in one file because they are very similar
import {LayerProperties} from "../Layer";
import {LayerTypeValue} from "../../LayerTypeValue";
import {LayerBase} from "../LayerBase";
import {Vol} from "../../Vol";
import {IMap} from "typescript-dotnet-umd/IMap";
import {ParamsAndGrads} from "../ParamsAndGrads";

export abstract class ConvLayerBase<TJson extends ConvLayerBase.JSON>
extends LayerBase<TJson> implements ConvLayerBase.Unique
{
	l1_decay_mul:number;
	l2_decay_mul:number;

	filters:Vol[];
	biases:Vol;


	constructor(
		layer_type:LayerTypeValue.Any,
		out_sx:number,
		out_sy:number,
		out_depth:number,
		options:ConvLayerBase.Options = <any>{})
	{
		let {l1_decay_mul, l2_decay_mul, bias_pref} = options;

		// note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
		// volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
		// final application.
		super(layer_type,
			out_sx,
			out_sy,
			out_depth);

		// optional
		this.l1_decay_mul = typeof l1_decay_mul!=='undefined' ? l1_decay_mul : 0.0;
		this.l2_decay_mul = typeof l2_decay_mul!=='undefined' ? l2_decay_mul : 1.0;

		// initializations
		const bias = typeof bias_pref!=='undefined' ? bias_pref : 0.0;
		this.filters = [];
		this.biases = new Vol(1, 1, out_depth, bias);

	}

	getParamsAndGrads():ParamsAndGrads[]
	{
		const response:ParamsAndGrads[] = [];
		for(let i = 0; i<this.out_depth; i++)
		{
			response.push({
				params: this.filters[i].w,
				grads: this.filters[i].dw,
				l2_decay_mul: this.l2_decay_mul,
				l1_decay_mul: this.l1_decay_mul
			});
		}
		response.push({
			params: this.biases.w,
			grads: this.biases.dw,
			l1_decay_mul: 0.0,
			l2_decay_mul: 0.0
		});
		return response;
	}

	toJSON():TJson
	toJSON<T extends IMap<any>>(json:T):T & TJson
	toJSON(json:any = {}):any & TJson
	{
		json.l1_decay_mul = this.l1_decay_mul;
		json.l2_decay_mul = this.l2_decay_mul;
		json.filters = [];
		for(let i = 0; i<this.filters.length; i++)
		{
			json.filters.push(this.filters[i].toJSON());
		}
		json.biases = this.biases.toJSON();

		return super.toJSON(json);
	}

	fromJSON(json:TJson):this
	{
		super.fromJSON(json);

		this.l1_decay_mul = typeof json.l1_decay_mul!=='undefined' ? json.l1_decay_mul : 1.0; // Is this 0.0?  Or 1.0?
		this.l2_decay_mul = typeof json.l2_decay_mul!=='undefined' ? json.l2_decay_mul : 1.0;

		let f:Vol[] = [];
		this.filters = f;
		for(let i = 0; i<json.filters.length; i++)
		{
			const v = new Vol(0, 0, 0, 0);
			v.fromJSON(json.filters[i]);
			f.push(v);
		}
		this.biases = new Vol(0, 0, 0, 0);
		this.biases.fromJSON(json.biases);

		return this;
	}
}


export module ConvLayerBase
{

	export interface Unique
	{
		l1_decay_mul?:number;
		l2_decay_mul?:number;
		biases?:Vol;
	}

	export interface Options extends Unique
	{
		filters:number;
		bias_pref?:number;
	}

	export interface JSON extends LayerProperties, Unique
	{
		filters:Vol[];
		biases:Vol;
	}
}

export default ConvLayerBase;