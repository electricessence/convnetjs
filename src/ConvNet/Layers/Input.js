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
        define(["require", "exports", "../../utility/getDefault", "./LayerBase"], factory);
    }
})(function (require, exports) {
    "use strict";
    var getDefault_1 = require("../../utility/getDefault");
    var LayerBase_1 = require("./LayerBase");
    var InputLayer = (function (_super) {
        __extends(InputLayer, _super);
        function InputLayer(options) {
            if (options === void 0) { options = {}; }
            _super.call(this, 'input', 
            // optional: default these dimensions to 1
            getDefault_1.getDefault(options, ['out_sx', 'sx', 'width'], 1), getDefault_1.getDefault(options, ['out_sy', 'sy', 'height'], 1), 
            // required: depth
            getDefault_1.getDefault(options, ['out_depth', 'depth'], 0));
        }
        InputLayer.prototype.forward = function (V) {
            this.in_act = V;
            this.out_act = V;
            return V; // simply identity function for now
        };
        InputLayer.prototype.backward = function () { };
        return InputLayer;
    }(LayerBase_1.LayerBase));
    exports.InputLayer = InputLayer;
});
//# sourceMappingURL=Input.js.map