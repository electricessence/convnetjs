import * as LayerType from "../LayerTypes";
import {LayerTypeValue} from "../LayerTypes";
import {LayerConstructor, Layer, LayerOut, LayerIn} from "../Layer";
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

const TypeRegistry:IMap<LayerConstructor> = {
	input:InputLayer,
	dropout:DropoutLayer,
	softmax:SoftmaxLayer,
	regression:RegressionLayer,
	svm:SVMLayer,
	sigmoid:SigmoidLayer,
	maxout:MaxoutLayer,
	relu:ReluLayer,
	tanh:TanhLayer,
	lrn:LocalResponseNormalizationLayer
};
Object.freeze(TypeRegistry);

export function newFromType(type:LayerType.Input, options?:LayerOut):InputLayer
export function newFromType(type:LayerType.Dropout, options?:DropoutLayer.Options):DropoutLayer
export function newFromType(type:LayerType.Softmax, options?:LossBase.Options):SoftmaxLayer
export function newFromType(type:LayerType.Regression, options?:LossBase.Options):RegressionLayer
export function newFromType(type:LayerType.SVM, options?:LossBase.Options):SVMLayer
export function newFromType(type:LayerType.Sigmoid, options?:LayerIn):SigmoidLayer
export function newFromType(type:LayerType.Maxout, options?:MaxoutLayer.Options):MaxoutLayer
export function newFromType(type:LayerType.Relu, options?:LayerIn):ReluLayer
export function newFromType(type:LayerType.Tanh, options?:LayerIn):TanhLayer
export function newFromType(type:LayerType.LocalResponseNormalization, options?:LocalResponseNormalizationLayer.Options):LocalResponseNormalizationLayer
export function newFromType(type:LayerTypeValue, options?:IMap<any>):Layer {
	return new TypeRegistry[type](options);
}

export {InputLayer, DropoutLayer}