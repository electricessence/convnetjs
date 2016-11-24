import {LayerTypeValue} from "../LayerTypes";
import {JsonSerializable} from "../../JsonSerializable";
import {Vol} from "../Vol";
import {Layer, LayerIn} from "../Layer";
import {IMap} from "typescript-dotnet-umd/IMap";
export abstract class LayerBase<TJson extends Layer> implements JsonSerializable<TJson>
{
	constructor(
		public readonly layer_type:LayerTypeValue,
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
	getParamsAndGrads():any[]
	{
		return [];
	}

}

export abstract class BasicLayerBase extends LayerBase<Layer>
{
	constructor(layer_type:LayerTypeValue, opt:LayerIn)
	{
		let {in_sx, in_sy, in_depth} = opt;
		super(layer_type, in_sx, in_sy, in_depth);
	}
}

export default LayerBase;