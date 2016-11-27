import {assert} from "../utility/assert";
import {LayerDefinition, LayerProperties, IPropagate, Layer} from "./Layers/Layer";
import {newFromType} from "./Layers/index";
import {ParamsAndGrads} from "./Layers/ParamsAndGrads";
import {Vol} from "./Vol";
import {JsonSerializable} from "../JsonSerializable";
import {IMap} from "typescript-dotnet-umd/IMap";
import {initialize} from "typescript-dotnet-umd/System/Collections/Array/Utility";

/**
 * Net manages a set of layers
 * For now constraints: Simple linear order of layers, first layer input last layer a cost layer
 */
export class Net implements IPropagate, JsonSerializable<Net.JSON>
{
	layers:Layer[];

	constructor()
	{
		this.layers = [];
	}


	// takes a list of layer definitions and creates the network layer objects
	makeLayers(defs:LayerDefinition[])
	{

		// few checks
		assert(defs.length>=2, 'Error! At least one input layer and one loss layer are required.');
		assert(defs[0].type==='input', 'Error! First layer must be the input layer, to declare size of inputs');

		// desugar layer_defs for adding activation, dropout layers etc
		defs = desugar(defs);

		// create the layers
		this.layers = [];
		for(let i = 0; i<defs.length; i++)
		{
			const def = defs[i];
			if(i>0)
			{
				const prev = this.layers[i - 1];
				def.in_sx = prev.out_sx;
				def.in_sy = prev.out_sy;
				def.in_depth = prev.out_depth;
			}

			this.layers.push(newFromType(def));
		}
	}

	getCostLoss(V, y)
	{
		this.forward(V, false);
		const N = this.layers.length;
		return this.layers[N - 1].backward(y);
	}

	// forward prop the network.
	// The trainer class passes is_training = true, but when this function is
	// called from outside (not from the trainer), it defaults to prediction mode
	forward(V:Vol, is_training:boolean = false):Vol
	{
		let act = this.layers[0].forward(V, is_training);
		for(let i = 1; i<this.layers.length; i++)
		{
			act = this.layers[i].forward(act, is_training);
		}
		return act;
	}


	// back-prop: compute gradients wrt all parameters
	backward(y):number
	{
		const N = this.layers.length;
		const loss = this.layers[N - 1].backward(y); // last layer assumed to be loss layer
		for(let i = N - 2; i>=0; i--)
		{ // first layer assumed input
			this.layers[i].backward();
		}
		return loss;
	}

	getParamsAndGrads():ParamsAndGrads[]
	{
		// accumulate parameters and gradients for the entire network
		const response:ParamsAndGrads[] = [];
		for(let layer of this.layers)
		{
			const pg = layer.getParamsAndGrads();
			for(let n of pg)
				response.push(n);
		}
		return response;
	}

	getPrediction():number
	{
		// this is a convenience function for returning the argmax
		// prediction, assuming the last layer of the net is a softmax
		const lastLayer = this.layers[this.layers.length - 1];
		if(!lastLayer)
			throw "Empty entry in layers array.";

		assert(lastLayer.layer_type==='softmax', 'getPrediction function assumes softmax as last layer of the net!');

		if(!lastLayer.out_act)
			throw "out_act is not set.";

		const p = lastLayer.out_act.w;
		let maxv = p[0];
		let maxi = 0;
		for(let i = 1; i<p.length; i++)
		{
			if(p[i]>maxv)
			{
				maxv = p[i];
				maxi = i;
			}
		}
		return maxi; // return index of the class with highest class probability
	}

	toJSON():Net.JSON
	toJSON<T extends IMap<any>>(json:T):T & Net.JSON
	toJSON(json:any = {}):any & Net.JSON
	{
		let layers    = this.layers,
		    newLayers = initialize<LayerProperties>(layers.length);
		json.layers = newLayers;
		for(let i = 0; i<this.layers.length; i++)
		{
			newLayers[i] = layers[i].toJSON();
		}
		return json;
	}

	fromJSON(json:Net.JSON):this
	{
		this.layers = [];
		for(let i = 0; i<json.layers.length; i++)
		{
			const Lj = json.layers[i];
			this.layers.push(newFromType(Lj.layer_type, Lj));
		}
		return this;
	}

}

export module Net
{
	export interface JSON
	{
		layers:LayerProperties[]
	}
}

export default Net;

function desugar(defs:LayerDefinition[])
{
	const new_defs:LayerDefinition[] = [];
	for(let i = 0; i<defs.length; i++)
	{
		const def = defs[i];

		if(def.type==='softmax' || def.type==='svm')
		{
			// add an fc layer here, there is no reason the user should
			// have to worry about this and we almost always want to
			new_defs.push({type: 'fc', num_neurons: def.num_classes});
		}

		if(def.type==='regression')
		{
			// add an fc layer here, there is no reason the user should
			// have to worry about this and we almost always want to
			new_defs.push({type: 'fc', num_neurons: def.num_neurons});
		}

		if((def.type==='fc' || def.type==='conv')
			&& typeof(def.bias_pref)==='undefined')
		{
			def.bias_pref = 0.0;
			if(typeof def.activation!=='undefined' && def.activation==='relu')
			{
				def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
				// otherwise it's technically possible that a relu unit will never turn on (by chance)
				// and will never get any gradient and never contribute any computation. Dead relu.
			}
		}

		new_defs.push(def);

		if(typeof def.activation!=='undefined')
		{
			if(def.activation==='relu')
			{ new_defs.push({type: 'relu'}); }
			else if(def.activation==='sigmoid')
			{ new_defs.push({type: 'sigmoid'}); }
			else if(def.activation==='tanh')
			{ new_defs.push({type: 'tanh'}); }
			else if(def.activation==='maxout')
			{
				// create maxout activation, and pass along group size, if provided
				const gs = typeof def.group_size!=='undefined' ? def.group_size : 2;
				new_defs.push({type: 'maxout', group_size: gs});
			}
			else
			{ console.error('ERROR unsupported activation ' + def.activation); }
		}
		if(typeof def.drop_prob!=='undefined' && def.type!=='dropout')
		{
			new_defs.push({type: 'dropout', drop_prob: def.drop_prob});
		}

	}
	return new_defs;
}