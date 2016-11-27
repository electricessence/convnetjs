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
        define(["require", "exports", "../../src/ConvNet/index", "../../src/ConvNet/Vol", "./npgmain"], factory);
    }
})(function (require, exports) {
    "use strict";
    ///<reference types="jquery"/>
    ///<reference types="jqueryui"/>
    var ConvNet = require("../../src/ConvNet/index");
    var Vol_1 = require("../../src/ConvNet/Vol");
    var npgmain_1 = require("./npgmain");
    //noinspection JSUnusedLocalSymbols
    var C = ConvNet;
    var t = "\nlayer_defs = [];\nlayer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});\nlayer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\nlayer_defs.push({type:'fc', num_neurons:20, activation:'sigmoid'});\nlayer_defs.push({type:'regression', num_neurons:1});\n\nnet = new ConvNet.Net();\nnet.makeLayers(layer_defs);\n\ntrainer = new ConvNet.Trainer(net, {learning_rate:0.01, momentum:0.0, batch_size:1, l2_decay:0.001});\n";
    var ss = 30.0; // scale for drawing
    var N;
    var layer_defs;
    var net;
    var trainer;
    var Regression = (function (_super) {
        __extends(Regression, _super);
        function Regression() {
            _super.apply(this, arguments);
            // create neural net
            this.lix = 2; // layer id of layer we'd like to draw outputs of
        }
        //noinspection JSMethodCanBeStatic
        Regression.prototype.reload = function () {
            eval($("#layerdef").val());
            // refresh buttons
            var t = '';
            for (var i = 1; i < net.layers.length - 1; i++) {
                var butid = "button" + i;
                var onClick = 'R.updateLix(' + i + ')';
                t
                    += "<input id=\"" + butid + "\" value=\"" + net.layers[i].layer_type + "\" type=\"submit\" onclick=\"" + onClick + "\" style=\"width:80px; height: 30px; margin:5px;\"/>";
            }
            $("#layer_ixes").html(t);
            $("#button" + this.lix).css('background-color', '#FFA');
        };
        //noinspection JSUnusedGlobalSymbols
        Regression.prototype.updateLix = function (newlix) {
            $("#button" + this.lix).css('background-color', ''); // erase highlight
            $("#button" + newlix).css('background-color', '#FFA');
            this.lix = newlix;
        };
        Regression.prototype.regen_data = function () {
            N = parseInt($("#num_data").val());
            this.data = [];
            this.labels = [];
            for (var i = 0; i < N; i++) {
                var x = Math.random() * 10 - 5;
                var y = x * Math.sin(x);
                this.data.push([x]);
                this.labels.push([y]);
            }
        };
        Regression.prototype.init = function () {
            this.regen_data();
            $("#layerdef").val(t);
            this.reload();
        };
        Regression.prototype.update = function () {
            // forward prop the data
            var netx = new Vol_1.Vol(1, 1, 1);
            var avloss = 0.0;
            var iters;
            for (iters = 0; iters < 50; iters++) {
                for (var ix = 0; ix < N; ix++) {
                    netx.w = this.data[ix];
                    var stats = trainer.train(netx, this.labels[ix]);
                    avloss += stats.loss;
                }
            }
            avloss /= N * iters;
            this.avloss = avloss;
        };
        Regression.prototype.draw = function () {
            var x;
            var ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.fillStyle = "black";
            var netx = new Vol_1.Vol(1, 1, 1);
            // draw decisions in the grid
            var density = 5.0;
            var draw_neuron_outputs = $("#layer_outs").is(':checked');
            // draw final decision
            var neurons = [];
            ctx.beginPath();
            for (x = 0.0; x <= this.width; x += density) {
                netx.w[0] = (x - this.width / 2) / ss;
                var a = net.forward(netx);
                var y = a.w[0];
                if (draw_neuron_outputs) {
                    neurons.push(net.layers[this.lix].out_act.w); // back these up
                }
                if (x === 0)
                    ctx.moveTo(x, -y * ss + this.height / 2);
                else
                    ctx.lineTo(x, -y * ss + this.height / 2);
            }
            ctx.stroke();
            // draw individual neurons on first layer
            if (draw_neuron_outputs) {
                var NL = neurons.length;
                ctx.strokeStyle = 'rgb(250,50,50)';
                for (var k = 0; k < NL; k++) {
                    ctx.beginPath();
                    var n = 0;
                    for (x = 0.0; x <= this.width; x += density) {
                        if (x === 0)
                            ctx.moveTo(x, -neurons[n][k] * ss + this.height / 2);
                        else
                            ctx.lineTo(x, -neurons[n][k] * ss + this.height / 2);
                        n++;
                    }
                    ctx.stroke();
                }
            }
            // draw axes
            ctx.beginPath();
            ctx.strokeStyle = 'rgb(50,50,50)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(this.width, this.height / 2);
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(this.width / 2, this.height);
            ctx.stroke();
            // draw data-points. Draw support vectors larger
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 1;
            for (var i = 0; i < N; i++) {
                this.drawCircle(this.data[i] * ss + this.width / 2, -this.labels[i] * ss + this.height / 2, 5.0);
            }
            ctx.fillStyle = "blue";
            ctx.font = "bold 16px Arial";
            ctx.fillText("average loss: " + this.avloss, 20, 20);
        };
        //noinspection JSUnusedGlobalSymbols
        Regression.prototype.mouseClick = function (x, y) {
            // add data-point at location of click
            this.data.push([(x - this.width / 2) / ss]);
            this.labels.push([-(y - this.height / 2) / ss]);
            N += 1;
        };
        Regression.prototype.keyDown = function () {
        };
        Regression.prototype.keyUp = function () {
        };
        return Regression;
    }(npgmain_1.NPGMain));
    exports.Regression = Regression;
    function init(fps) {
        return new Regression(fps);
    }
    exports.init = init;
});
//# sourceMappingURL=regression.js.map