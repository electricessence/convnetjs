export module LayerTypeValue
{
	export type Softmax = 'softmax';
	export type SVM = 'svm';
	export type Regression = 'regression';
	export type FC = 'fc';
	export type Conv = 'conv';
	export type Relu = 'relu';
	export type Sigmoid = 'sigmoid';
	export type Tanh = 'tanh';
	export type Maxout = 'maxout';
	export type Dropout = 'dropout';
	export type Input = 'input';
	export type Pool = 'pool';
	export type LocalResponseNormalization = 'lrn';

	export type Any
		= Softmax
		| LocalResponseNormalization
		| SVM
		| Regression
		| FC
		| Conv
		| Relu
		| Sigmoid
		| Tanh
		| Maxout
		| Dropout
		| Input
		| Pool;
}

export default LayerTypeValue;