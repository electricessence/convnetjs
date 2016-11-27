(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerType;
    (function (LayerType) {
        LayerType.Softmax = 'softmax', LayerType.SVM = 'svm', LayerType.Regression = 'regression', LayerType.FC = 'fc', LayerType.Conv = 'conv', LayerType.Relu = 'relu', LayerType.Sigmoid = 'sigmoid', LayerType.Tanh = 'tanh', LayerType.Maxout = 'maxout', LayerType.Dropout = 'dropout', LayerType.Input = 'input', LayerType.Pool = 'pool', LayerType.LRN = 'lrn';
    })(LayerType = exports.LayerType || (exports.LayerType = {}));
});
//# sourceMappingURL=LayerType.js.map