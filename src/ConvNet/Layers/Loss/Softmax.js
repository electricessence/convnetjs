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
        define(["require", "exports", "./LossBase", "typescript-dotnet-umd/System/Integer", "../../Vol", "../../LayerType"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LossBase_1 = require("./LossBase");
    var Integer_1 = require("typescript-dotnet-umd/System/Integer");
    var Vol_1 = require("../../Vol");
    var LayerType_1 = require("../../LayerType");
    /*
        Layers that implement a loss. Currently these are the layers that
        can initiate a backward() pass. In future we probably want a more
        flexible system that can accommodate multiple losses to do multi-task
        learning, and stuff like that. But for now, one of the layers in this
        file must be the final layer in a Net.
    */
    /**
     * This is a classifier, with N discrete classes from 0 to N-1
     * it gets a stream of N incoming numbers and computes the softmax
     * function (exponentiate and normalize to sum to 1 as probabilities should)
     */
    var SoftmaxLayer = (function (_super) {
        __extends(SoftmaxLayer, _super);
        function SoftmaxLayer(opt) {
            if (opt === void 0) { opt = {}; }
            _super.call(this, LayerType_1.LayerType.Softmax, opt);
        }
        SoftmaxLayer.prototype.forward = function (V) {
            this.in_act = V;
            var A = new Vol_1.Vol(1, 1, this.out_depth, 0.0);
            // compute max activation
            var as = V.w;
            var amax = V.w[0];
            var i;
            for (i = 1; i < this.out_depth; i++) {
                if (as[i] > amax)
                    amax = as[i];
            }
            // compute exponentials (carefully to not blow up)
            var es = new Float64Array(this.out_depth);
            var esum = 0.0;
            for (i = 0; i < this.out_depth; i++) {
                var e = Math.exp(as[i] - amax);
                esum += e;
                es[i] = e;
            }
            // normalize and output to sum to one
            for (i = 0; i < this.out_depth; i++) {
                es[i] /= esum;
                A.w[i] = es[i];
            }
            this.es = es; // save these for back-prop
            this.out_act = A;
            return this.out_act;
        };
        SoftmaxLayer.prototype.backward = function (y) {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            if (y == void 0)
                throw "Must provide y value.";
            Integer_1.Integer.assert(y);
            // compute and accumulate gradient wrt weights and bias of this layer
            var x = this.in_act;
            x.dw = new Float64Array(x.w.length); // zero out the gradient of input Vol
            for (var i = 0; i < this.out_depth; i++) {
                var indicator = i === y ? 1.0 : 0.0;
                x.dw[i] = -(indicator - this.es[i]);
            }
            // loss is the class negative log likelihood
            return -Math.log(this.es[y]);
        };
        return SoftmaxLayer;
    }(LossBase_1.LossBase));
    exports.SoftmaxLayer = SoftmaxLayer;
});
//# sourceMappingURL=Softmax.js.map