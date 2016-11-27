import {IMap} from "typescript-dotnet-umd/IMap";
import {LayerTypeValue} from "../LayerTypeValue";
import {Vol} from "../Vol";
import {JsonSerializable} from "../../JsonSerializable";
import {ParamsAndGrads} from "./ParamsAndGrads";


export interface LayerIn {
	in_sx:number;
	in_sy:number;
	in_depth:number;
}

export interface LayerOut {
	out_sx:number;
	out_sy:number;
	out_depth:number;
}

export interface LayerProperties extends LayerOut {
	layer_type:LayerTypeValue.Any;
}

export interface IPropagate {
	forward(V:Vol, is_training?:boolean):Vol;
	backward<T extends undefined|number>(y?:T):T;
}

export interface Layer extends IPropagate, LayerProperties, JsonSerializable<any> {
	in_act?:Vol;
	out_act?:Vol;

	getParamsAndGrads():ParamsAndGrads[];
}

export interface LayerDefinition
{
	type:LayerTypeValue.Any;
	activation?:LayerTypeValue.Any;
	num_neurons?:number;
	num_classes?:number;
	bias_pref?:number;
	group_size?:number;
	drop_prob?:number;
	in_sx?:number;
	in_sy?:number;
	in_depth?:number;
	out_sx?:number;
	out_sy?:number;
	out_depth?:number;
}

export interface LayerConstructor {
	new (options?:IMap<any>):Layer;
}