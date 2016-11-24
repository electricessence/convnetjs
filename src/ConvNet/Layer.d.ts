import {LayerTypeValue} from "./LayerTypes";
import {IMap} from "typescript-dotnet-umd/IMap";


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

export interface Layer extends LayerOut {
	layer_type:LayerTypeValue;
}

export interface LayerDefinition
{
	type:LayerTypeValue;
	activation?:LayerTypeValue;
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