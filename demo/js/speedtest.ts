import {ConvLayer} from "../../src/ConvNet/Layers/DotProducts/ConvLayer";
import {Vol} from "../../src/ConvNet/Vol";

function logEvent(str:string):void {
	console.log(str);
	const d = document.createElement('div');
	d.innerHTML = str;
	document.getElementById('result')!.appendChild(d);
}

let n = 0;
let dtall = 0;
let layer:ConvLayer, x:Vol;
function runExample() {

	const t0 = +new Date();
	layer.forward(x);
	//layer.backward();
	const t1 = +new Date();
	const diff = t1 - t0;
	dtall += diff;
	n++;

	logEvent('ran example ' + n + ' in ' + diff + 'ms, estimated average = ' + (dtall / n).toFixed(3) + 'ms');
}

let run1i:number = 0;
export function start() {

	// Conv LayerDefinition definition used in ConvNet benchmarks
	layer = new ConvLayer({ in_sx:128, in_sy:128, in_depth:3, sx:11, filters:96, stride: 1, pad: 0});
	x = new Vol(128, 128, 3);

	run1i = window.setInterval(runExample, 5); // start
}

export function stop() {
	window.clearInterval(run1i);
}