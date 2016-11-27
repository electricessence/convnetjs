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
        define(["require", "exports", "../LayerBase", "../../Vol"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("../LayerBase");
    var Vol_1 = require("../../Vol");
    var ConvLayerBase = (function (_super) {
        __extends(ConvLayerBase, _super);
        function ConvLayerBase(layer_type, out_sx, out_sy, out_depth, options) {
            if (options === void 0) { options = {}; }
            var l1_decay_mul = options.l1_decay_mul, l2_decay_mul = options.l2_decay_mul, bias_pref = options.bias_pref;
            // note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
            // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
            // final application.
            _super.call(this, layer_type, out_sx, out_sy, out_depth);
            // optional
            this.l1_decay_mul = typeof l1_decay_mul !== 'undefined' ? l1_decay_mul : 0.0;
            this.l2_decay_mul = typeof l2_decay_mul !== 'undefined' ? l2_decay_mul : 1.0;
            // initializations
            var bias = typeof bias_pref !== 'undefined' ? bias_pref : 0.0;
            this.filters = [];
            this.biases = new Vol_1.Vol(1, 1, out_depth, bias);
        }
        ConvLayerBase.prototype.getParamsAndGrads = function () {
            var response = [];
            for (var i = 0; i < this.out_depth; i++) {
                response.push({
                    params: this.filters[i].w,
                    grads: this.filters[i].dw,
                    l2_decay_mul: this.l2_decay_mul,
                    l1_decay_mul: this.l1_decay_mul
                });
            }
            response.push({
                params: this.biases.w,
                grads: this.biases.dw,
                l1_decay_mul: 0.0,
                l2_decay_mul: 0.0
            });
            return response;
        };
        ConvLayerBase.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.l1_decay_mul = this.l1_decay_mul;
            json.l2_decay_mul = this.l2_decay_mul;
            json.filters = [];
            for (var i = 0; i < this.filters.length; i++) {
                json.filters.push(this.filters[i].toJSON());
            }
            json.biases = this.biases.toJSON();
            return _super.prototype.toJSON.call(this, json);
        };
        ConvLayerBase.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.l1_decay_mul = typeof json.l1_decay_mul !== 'undefined' ? json.l1_decay_mul : 1.0; // Is this 0.0?  Or 1.0?
            this.l2_decay_mul = typeof json.l2_decay_mul !== 'undefined' ? json.l2_decay_mul : 1.0;
            var f = [];
            this.filters = f;
            for (var i = 0; i < json.filters.length; i++) {
                var v = new Vol_1.Vol(0, 0, 0, 0);
                v.fromJSON(json.filters[i]);
                f.push(v);
            }
            this.biases = new Vol_1.Vol(0, 0, 0, 0);
            this.biases.fromJSON(json.biases);
            return this;
        };
        return ConvLayerBase;
    }(LayerBase_1.LayerBase));
    exports.ConvLayerBase = ConvLayerBase;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ConvLayerBase;
});
//# sourceMappingURL=ConvLayerBase.js.map