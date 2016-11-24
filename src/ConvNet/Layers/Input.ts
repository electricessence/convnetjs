import {getDefault} from "../../utility/getDefault";
import {Vol} from "../Vol";
import {LayerBase} from "./LayerBase";
import {Layer, LayerOut} from "../Layer";
import * as LayerType from "../LayerTypes";


export class InputLayer extends LayerBase<Layer>
{
	readonly layer_type:LayerType.Input;
	in_act:Vol;
	out_act:Vol;

	constructor(options:LayerOut = <any>{})
	{
		super(
			'input',
			// optional: default these dimensions to 1
			getDefault(options, ['out_sx', 'sx', 'width'], 1),
			getDefault(options, ['out_sy', 'sy', 'height'], 1),
			// required: depth
			getDefault(options, ['out_depth', 'depth'], 0)
		);
	}

	forward(V:Vol):Vol
	{
		this.in_act = V;
		this.out_act = V;
		return V; // simply identity function for now
	}

	backward() { }

}
