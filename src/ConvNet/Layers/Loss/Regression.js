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
    /**
     *
     * implements an L2 regression cost layer,
     * so penalizes \sum_i(||x_i - y_i||^2), where x is its input
     * and y is the user-provided array of "correct" values.
     */
    var RegressionLayer = (function (_super) {
        __extends(RegressionLayer, _super);
        function RegressionLayer(opt) {
            if (opt === void 0) { opt = {}; }
            _super.call(this, LayerType_1.LayerType.Regression, opt);
        }
        RegressionLayer.prototype.backward = function (y) {
            var dy;
            var i;
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            if (y == void 0)
                throw "Must provide y value.";
            // compute and accumulate gradient wrt weights and bias of this layer
            var x = this.in_act;
            x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol
            var loss = 0.0;
            if (isArrayLike(y)) {
                for (i = 0; i < this.out_depth; i++) {
                    dy = x.w[i] - y[i];
                    x.dw[i] = dy;
                    loss += 0.5 * dy * dy;
                }
            }
            else if (typeof y === 'number') {
                Integer_1.Integer.assert(y);
                // lets hope that only one number is being regressed
                dy = x.w[0] - y;
                x.dw[0] = dy;
                loss += 0.5 * dy * dy;
            }
            else {
                // assume it is a struct with entries .dim and .val
                // and we pass gradient only along dimension dim to be equal to val
                i = y.dim;
                var yi = y.val;
                dy = x.w[i] - yi;
                x.dw[i] = dy;
                loss += 0.5 * dy * dy;
            }
            return loss;
        };
        return RegressionLayer;
    }(LossBase_1.LossBase));
    exports.RegressionLayer = RegressionLayer;
    function isArrayLike(a) {
        return a instanceof Array || a instanceof Float64Array;
    }
});
//# sourceMappingURL=Regression.js.map