(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    /**
     * returns string representation of float
     * but truncated to length of d digits
     * @param x
     * @param digits
     * @returns {string}
     */
    function f2t(x, digits) {
        if (digits === void 0) { digits = 5; }
        var dd = Math.pow(10, digits);
        return '' + Math.floor(x * dd) / dd;
    }
    exports.f2t = f2t;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = f2t;
});
//# sourceMappingURL=f2t.js.map