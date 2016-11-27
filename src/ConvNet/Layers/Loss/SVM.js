var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./LossBase", "typescript-dotnet-umd/System/Integer", "../../LayerType"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LossBase_1 = require("./LossBase");
    var Integer_1 = require("typescript-dotnet-umd/System/Integer");
    var LayerType_1 = require("../../LayerType");
    var SVMLayer = (function (_super) {
        __extends(SVMLayer, _super);
        function SVMLayer(opt) {
            if (opt === void 0) { opt = {}; }
            _super.call(this, LayerType_1.LayerType.SVM, opt);
        }
        SVMLayer.prototype.backward = function (y) {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            if (y == void 0)
                throw "Must provide y value.";
            Integer_1.Integer.assert(y);
            // compute and accumulate gradient wrt weights and bias of this layer
            var x = this.in_act;
            x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol
            // we're using structured loss here, which means that the score
            // of the ground truth should be higher than the score of any other
            // class, by a margin
            var yScore = x.w[y]; // score of ground truth
            var margin = 1.0;
            var loss = 0.0;
            for (var i = 0; i < this.out_depth; i++) {
                if (y === i) {
                    continue;
                }
                var yDiff = -yScore + x.w[i] + margin;
                if (yDiff > 0) {
                    // violating dimension, apply loss
                    x.dw[i] += 1;
                    x.dw[y] -= 1;
                    loss += yDiff;
                }
            }
            return loss;
        };
        return SVMLayer;
    }(LossBase_1.LossBase));
    exports.SVMLayer = SVMLayer;
});
//# sourceMappingURL=SVM.js.map