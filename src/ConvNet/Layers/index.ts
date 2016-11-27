import {LayerConstructor, LayerOut, LayerIn, Layer} from "./Layer";
import {IMap} from "typescript-dotnet-umd/IMap";
import {InputLayer} from "./Input";
import {DropoutLayer} from "./Dropout";
import {RegressionLayer} from "./Loss/Regression";
import {SoftmaxLayer} from "./Loss/Softmax";
import {SVMLayer} from "./Loss/SVM";
import {MaxoutLayer} from "./Nonlinearities/Maxout";
import {ReluLayer} from "./Nonlinearities/Relu";
import {SigmoidLayer} from "./Nonlinearities/Sigmoid";
import {TanhLayer} from "./Nonlinearities/Tanh";
import {LossBase} from "./Loss/LossBase";
import {LocalResponseNormalizationLayer} from "./LocalResponseNormalization";
import {LayerTypeValue} from "../LayerTypeValue";
import {ConvLayer} from "./DotProducts/ConvLayer";
import {FullyConnLayer} from "./DotProducts/FullyConnLayer";
import {ArgumentNullException} from "typescript-dotnet-umd/System/Exceptions/ArgumentNullException";
import {ArgumentException} from "typescript-dotnet-umd/System/Exceptions/ArgumentException";
import {PoolLayer} from "./Pool";

const TypeRegistry:IMap<LayerConstructor> = {
	input: InputLayer,
	dropout: DropoutLayer,
	softmax: SoftmaxLayer,
	regression: RegressionLayer,
	svm: SVMLayer,
	sigmoid: SigmoidLayer,
	maxout: MaxoutLayer,
	relu: ReluLayer,
	tanh: TanhLayer,
	lrn: LocalResponseNormalizationLayer,
	conv: ConvLayer,
	fc: FullyConnLayer,
	pool: PoolLayer
};
Object.freeze(TypeRegistry);

export function newFromType(
	type:LayerTypeValue.Input,
	options?:LayerOut):InputLayer
export function newFromType(
	type:LayerTypeValue.Dropout,
	options?:DropoutLayer.Options):DropoutLayer
export function newFromType(
	type:LayerTypeValue.Softmax,
	options?:LossBase.Options):SoftmaxLayer
export function newFromType(
	type:LayerTypeValue.Regression,
	options?:LossBase.Options):RegressionLayer
export function newFromType(
	type:LayerTypeValue.SVM,
	options?:LossBase.Options):SVMLayer
export function newFromType(
	type:LayerTypeValue.Sigmoid,
	options?:LayerIn):SigmoidLayer
export function newFromType(
	type:LayerTypeValue.Maxout,
	options?:MaxoutLayer.Options):MaxoutLayer
export function newFromType(
	type:LayerTypeValue.Relu,
	options?:LayerIn):ReluLayer
export function newFromType(
	type:LayerTypeValue.Tanh, options?:LayerIn):TanhLayer
export function newFromType(
	type:LayerTypeValue.LocalResponseNormalization,
	options?:LocalResponseNormalizationLayer.Options):LocalResponseNormalizationLayer
export function newFromType(
	type:LayerTypeValue.Conv,
	options?:LayerOut):ConvLayer
export function newFromType(
	type:LayerTypeValue.FC,
	options?:LayerOut):FullyConnLayer
export function newFromType(
	type:LayerTypeValue.Pool,
	options?:LayerOut):PoolLayer
export function newFromType(options:IMap<any>):Layer
export function newFromType(
	type:LayerTypeValue.Any,
	options?:IMap<any>):Layer
export function newFromType(
	type:LayerTypeValue.Any|IMap<any>,
	options?:IMap<any>):Layer
{
	if(!type)
		throw new ArgumentNullException('type');

	if(typeof type!="string")
	{
		if(options)
			throw new ArgumentException('options', "Invalid use of function signature.");
		options = type;
		type = options["type"];
	}
	const con = TypeRegistry[<any>type];
	if(!con)
		throw 'ERROR: UNRECOGNIZED LAYER TYPE: ' + type;
	return new con(options);
}

export {
	InputLayer,
	DropoutLayer,
	RegressionLayer,
	SoftmaxLayer,
	SVMLayer,
	MaxoutLayer,
	ReluLayer,
	SigmoidLayer,
	TanhLayer,
	LocalResponseNormalizationLayer,
	ConvLayer,
	FullyConnLayer,
	PoolLayer
}