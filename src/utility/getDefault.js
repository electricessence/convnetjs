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
     * syntactic sugar function for getting default parameter values
     * @param source
     * @param key
     * @param default_value
     * @returns {any}
     */
    function getDefault(source, key, default_value) {
        if (typeof key === 'string') {
            // case of single string
            return (typeof source[key] !== 'undefined') ? source[key] : default_value;
        }
        else {
            // assume we are given a list of string instead
            var ret = default_value;
            for (var _i = 0, key_1 = key; _i < key_1.length; _i++) {
                var f = key_1[_i];
                if (typeof source[f] !== 'undefined') {
                    ret = source[f]; // overwrite return value
                }
            }
            return ret;
        }
    }
    exports.getDefault = getDefault;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = getDefault;
});
//# sourceMappingURL=getDefault.js.map