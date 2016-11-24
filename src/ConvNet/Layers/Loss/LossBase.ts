import {LayerTypeValue} from "../../LayerTypes";
import {LayerBase} from "../LayerBase";
import {LayerIn, Layer} from "../../Layer";
import {IMap} from "typescript-dotnet-umd/IMap";
import {Vol} from "../../Vol";

export abstract class LossBase extends LayerBase<LossBase.JSON>
{
	num_inputs:number;

	constructor(layer_type:LayerTypeValue, opt:LayerIn)
	{
		let {in_sx, in_sy, in_depth} = opt;
		let depth = in_sx*in_sy*in_depth;
		super(layer_type, in_sx, in_sy, depth);
		this.num_inputs = depth;
	}

	toJSON():LossBase.JSON
	toJSON<T extends IMap<any>>(json:T):T & LossBase.JSON
	toJSON(json:any = {}):any & LossBase.JSON
	{
		json.num_inputs = this.num_inputs;
		return super.toJSON(json);
	}

	fromJSON(json:LossBase.JSON):this
	{
		super.fromJSON(json);

		this.num_inputs = json.num_inputs;

		return this;
	}

	forward(V:Vol, is_training?:boolean):Vol
	{
		this.in_act = V;
		this.out_act = V;
		return V;
	}
}

export module LossBase
{

	export interface Unique
	{
		num_inputs:number;
	}

	export interface Options extends LayerIn, Unique
	{
	}
	export interface JSON extends Layer, Unique
	{
	}
}


