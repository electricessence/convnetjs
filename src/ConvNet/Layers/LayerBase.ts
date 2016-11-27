import {JsonSerializable} from "../../JsonSerializable";
import {Vol} from "../Vol";
import {LayerProperties, LayerIn, IPropagate} from "./Layer";
import {IMap} from "typescript-dotnet-umd/IMap";
import {LayerTypeValue} from "../LayerTypeValue";
import {ParamsAndGrads} from "./ParamsAndGrads";

export abstract class LayerBase<TJson extends LayerProperties> implements IPropagate, JsonSerializable<TJson>
{
	constructor(
		public readonly layer_type:LayerTypeValue.Any,
		public out_sx:number,
		public out_sy:number,
		public out_depth:number) {

	}

	in_act?:Vol;
	out_act?:Vol;

	toJSON():TJson
	toJSON<T extends IMap<any>>(json:T):T & TJson
	toJSON(json:any = {}):any & TJson
	{
		json.out_depth = this.out_depth;
		json.out_sx = this.out_sx;
		json.out_sy = this.out_sy;
		json.layer_type = this.layer_type;
		return json;
	}

	fromJSON(json:TJson):this
	{
		if(json.layer_type!=this.layer_type)
			throw "You cannot import values from a different layer type.";

		// this.layer_type = json.layer_type;
		this.out_depth = json.out_depth;
		this.out_sx = json.out_sx;
		this.out_sy = json.out_sy;
		return this;
	}

	abstract forward(V:Vol, is_training?:boolean):Vol;

	abstract backward():void;

	//noinspection JSMethodCanBeStatic
	getParamsAndGrads():ParamsAndGrads[]
	{
		return [];
	}

}

export abstract class BasicLayerBase extends LayerBase<LayerProperties>
{
	constructor(layer_type:LayerTypeValue.Any, opt:LayerIn)
	{
		let {in_sx, in_sy, in_depth} = opt;
		super(layer_type, in_sx, in_sy, in_depth);
	}
}

export default LayerBase;