(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "typescript-dotnet-umd/System/Collections/Array/Utility"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Utility_1 = require("typescript-dotnet-umd/System/Collections/Array/Utility");
    function zeros(count) {
        if (!count || isNaN(count)) {
            return [];
        }
        if (typeof ArrayBuffer === 'undefined') {
            // lacking browser support
            return Utility_1.repeat(0, count);
        }
        else {
            return new Float64Array(count);
        }
    }
    exports.zeros = zeros;
});
//# sourceMappingURL=zeros.js.map