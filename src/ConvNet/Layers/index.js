(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./Input", "./Dropout", "./Loss/Regression", "./Loss/Softmax", "./Loss/SVM", "./Nonlinearities/Maxout", "./Nonlinearities/Relu", "./Nonlinearities/Sigmoid", "./Nonlinearities/Tanh", "./LocalResponseNormalization", "./DotProducts/ConvLayer", "./DotProducts/FullyConnLayer", "typescript-dotnet-umd/System/Exceptions/ArgumentNullException", "typescript-dotnet-umd/System/Exceptions/ArgumentException", "./Pool"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Input_1 = require("./Input");
    exports.InputLayer = Input_1.InputLayer;
    var Dropout_1 = require("./Dropout");
    exports.DropoutLayer = Dropout_1.DropoutLayer;
    var Regression_1 = require("./Loss/Regression");
    exports.RegressionLayer = Regression_1.RegressionLayer;
    var Softmax_1 = require("./Loss/Softmax");
    exports.SoftmaxLayer = Softmax_1.SoftmaxLayer;
    var SVM_1 = require("./Loss/SVM");
    exports.SVMLayer = SVM_1.SVMLayer;
    var Maxout_1 = require("./Nonlinearities/Maxout");
    exports.MaxoutLayer = Maxout_1.MaxoutLayer;
    var Relu_1 = require("./Nonlinearities/Relu");
    exports.ReluLayer = Relu_1.ReluLayer;
    var Sigmoid_1 = require("./Nonlinearities/Sigmoid");
    exports.SigmoidLayer = Sigmoid_1.SigmoidLayer;
    var Tanh_1 = require("./Nonlinearities/Tanh");
    exports.TanhLayer = Tanh_1.TanhLayer;
    var LocalResponseNormalization_1 = require("./LocalResponseNormalization");
    exports.LocalResponseNormalizationLayer = LocalResponseNormalization_1.LocalResponseNormalizationLayer;
    var ConvLayer_1 = require("./DotProducts/ConvLayer");
    exports.ConvLayer = ConvLayer_1.ConvLayer;
    var FullyConnLayer_1 = require("./DotProducts/FullyConnLayer");
    exports.FullyConnLayer = FullyConnLayer_1.FullyConnLayer;
    var ArgumentNullException_1 = require("typescript-dotnet-umd/System/Exceptions/ArgumentNullException");
    var ArgumentException_1 = require("typescript-dotnet-umd/System/Exceptions/ArgumentException");
    var Pool_1 = require("./Pool");
    exports.PoolLayer = Pool_1.PoolLayer;
    var TypeRegistry = {
        input: Input_1.InputLayer,
        dropout: Dropout_1.DropoutLayer,
        softmax: Softmax_1.SoftmaxLayer,
        regression: Regression_1.RegressionLayer,
        svm: SVM_1.SVMLayer,
        sigmoid: Sigmoid_1.SigmoidLayer,
        maxout: Maxout_1.MaxoutLayer,
        relu: Relu_1.ReluLayer,
        tanh: Tanh_1.TanhLayer,
        lrn: LocalResponseNormalization_1.LocalResponseNormalizationLayer,
        conv: ConvLayer_1.ConvLayer,
        fc: FullyConnLayer_1.FullyConnLayer,
        pool: Pool_1.PoolLayer
    };
    Object.freeze(TypeRegistry);
    function newFromType(type, options) {
        if (!type)
            throw new ArgumentNullException_1.ArgumentNullException('type');
        if (typeof type != "string") {
            if (options)
                throw new ArgumentException_1.ArgumentException('options', "Invalid use of function signature.");
            options = type;
            type = options["type"];
        }
        var con = TypeRegistry[type];
        if (!con)
            throw 'ERROR: UNRECOGNIZED LAYER TYPE: ' + type;
        return new con(options);
    }
    exports.newFromType = newFromType;
});
//# sourceMappingURL=index.js.map