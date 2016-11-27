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
        define(["require", "exports", "../LayerBase"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("../LayerBase");
    var LossBase = (function (_super) {
        __extends(LossBase, _super);
        function LossBase(layer_type, opt) {
            var in_sx = opt.in_sx, in_sy = opt.in_sy, in_depth = opt.in_depth;
            var depth = in_sx * in_sy * in_depth;
            _super.call(this, layer_type, in_sx, in_sy, depth);
            this.num_inputs = depth;
        }
        LossBase.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.num_inputs = this.num_inputs;
            return _super.prototype.toJSON.call(this, json);
        };
        LossBase.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.num_inputs = json.num_inputs;
            return this;
        };
        LossBase.prototype.forward = function (V) {
            this.in_act = V;
            this.out_act = V;
            return V;
        };
        return LossBase;
    }(LayerBase_1.LayerBase));
    exports.LossBase = LossBase;
});
//# sourceMappingURL=LossBase.js.map