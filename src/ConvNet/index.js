(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./Brain", "./Trainer", "./MagicNet", "./Net", "./Vol", "./Window", "./LayerType", "./Layers/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Brain_1 = require("./Brain");
    exports.Brain = Brain_1.Brain;
    var Trainer_1 = require("./Trainer");
    exports.Trainer = Trainer_1.Trainer;
    var MagicNet_1 = require("./MagicNet");
    exports.MagicNet = MagicNet_1.MagicNet;
    var Net_1 = require("./Net");
    exports.Net = Net_1.Net;
    var Vol_1 = require("./Vol");
    exports.Vol = Vol_1.Vol;
    var Window_1 = require("./Window");
    exports.Window = Window_1.Window;
    var LayerType_1 = require("./LayerType");
    exports.LayerType = LayerType_1.LayerType;
    var Layers = require("./Layers/index");
    exports.Layers = Layers;
    //noinspection JSUnusedGlobalSymbols
    exports.REVISION = 'TS-1.0.0';
});
//# sourceMappingURL=index.js.map