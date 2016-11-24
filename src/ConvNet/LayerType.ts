import {LayerTypeValue} from "./LayerTypeValue";
export module LayerType
{

	export const

		Softmax:LayerTypeValue.Softmax                = 'softmax',
		SVM:LayerTypeValue.SVM                        = 'svm',
		Regression:LayerTypeValue.Regression          = 'regression',
		FC:LayerTypeValue.FC                          = 'fc',
		Conv:LayerTypeValue.Conv                      = 'conv',
		Relu:LayerTypeValue.Relu                      = 'relu',
		Sigmoid:LayerTypeValue.Sigmoid                = 'sigmoid',
		Tanh:LayerTypeValue.Tanh                      = 'tanh',
		Maxout:LayerTypeValue.Maxout                  = 'maxout',
		Dropout:LayerTypeValue.Dropout                = 'dropout',
		Input:LayerTypeValue.Input                    = 'input',
		Pool:LayerTypeValue.Pool                      = 'pool',
		LRN:LayerTypeValue.LocalResponseNormalization = 'lrn';

}
