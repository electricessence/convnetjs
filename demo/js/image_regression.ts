///<reference types="jquery"/>
///<reference types="jqueryui"/>
import {Vol} from "../../src/ConvNet/Vol";
import {Random} from "../../src/utility/Random";
import * as ConvNet from "../../src/ConvNet/index";
//noinspection JSUnusedLocalSymbols
const C = ConvNet;

let layer_defs, net, trainer;

// create neural net
const t = "layer_defs = [];\n\
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2}); // 2 inputs: x, y \n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'regression', num_neurons:3}); // 3 outputs: r,g,b \n\
\n\
net = new ConvNet.Net();\n\
net.makeLayers(layer_defs);\n\
\n\
trainer = new ConvNet.Trainer(net, {learning_rate:0.01, momentum:0.9, batch_size:5, l2_decay:0.0});\n\
";

const batches_per_iteration = 100;
const mod_skip_draw = 100;
let smooth_loss = -1;

let nn_canvas;
let oridata;
let counter;
function update()
{
	// forward prop the data
	const W = nn_canvas.width;
	const H = nn_canvas.height;

	const p = oridata.data;

	const v = new Vol(1, 1, 2);
	let loss = 0;
	let lossi = 0;
	for(let iters = 0; iters<trainer.batch_size; iters++)
	{
		for(let i = 0; i<batches_per_iteration; i++)
		{
			// sample a coordinate
			const x = Random.integer(0, W);
			const y = Random.integer(0, H);
			const ix = ((W*y) + x)*4;
			const r = [p[ix]/255.0, p[ix + 1]/255.0, p[ix + 2]/255.0]; // r g b
			v.w[0] = (x - W/2)/W;
			v.w[1] = (y - H/2)/H;
			const stats = trainer.train(v, r);
			loss += stats.loss;
			lossi += 1;
		}
	}
	loss /= lossi;

	if(counter===0) smooth_loss = loss;
	else smooth_loss = 0.99*smooth_loss + 0.01*loss;

	let t = '';
	t += 'loss: ' + smooth_loss;
	t += '<br>';
	t += 'iteration: ' + counter;
	$("#report").html(t);
}

let nn_ctx;
function draw()
{
	if(counter%mod_skip_draw!==0) return;

	// iterate over all pixels in the target array, evaluate them
	// and draw
	const W = nn_canvas.width;
	const H = nn_canvas.height;

	const g = nn_ctx.getImageData(0, 0, W, H);
	const v = new Vol(1, 1, 2);
	for(let x = 0; x<W; x++)
	{
		v.w[0] = (x - W/2)/W;
		for(let y = 0; y<H; y++)
		{
			v.w[1] = (y - H/2)/H;

			const ix = ((W*y) + x)*4;
			const r = net.forward(v);
			g.data[ix] = Math.floor(255*r.w[0]);
			g.data[ix + 1] = Math.floor(255*r.w[1]);
			g.data[ix + 2] = Math.floor(255*r.w[2]);
			g.data[ix + 3] = 255; // alpha...
		}
	}
	nn_ctx.putImageData(g, 0, 0);
}

function tick()
{
	update();
	draw();
	counter += 1;
}

export function reload()
{
	counter = 0;
	eval($("#layerdef").val());
	//$("#slider").slider("value", Math.log(trainer.learning_rate) / Math.LN10);
	//$("#lr").html('Learning rate: ' + trainer.learning_rate);
}
function refreshSwatch()
{
	const lr = $("#slider").slider("value");
	trainer.learning_rate = Math.pow(10, lr);
	$("#lr").html('Learning rate: ' + trainer.learning_rate);
}

let ori_canvas, ori_ctx;
const sz = 200; // size of our drawing area
counter = 0;
$(function()
{
	// dynamically load lena image into original image canvas
	const image = new Image();
	//image.src = "lena.png";
	image.onload = function()
	{

		ori_canvas = document.getElementById('canv_original');
		nn_canvas = document.getElementById('canv_net');
		ori_canvas.width = sz;
		ori_canvas.height = sz;
		nn_canvas.width = sz;
		nn_canvas.height = sz;

		ori_ctx = ori_canvas.getContext("2d");
		nn_ctx = nn_canvas.getContext("2d");
		ori_ctx.drawImage(image, 0, 0, sz, sz);
		oridata = ori_ctx.getImageData(0, 0, sz, sz); // grab the data pointer. Our data-set.

		// start the regression!
		setInterval(tick, 1);
	};
	image.src = "images/cat.jpg";

	// init put text into text-area
	$("#layerdef").val(t);

	// load the net
	reload();

	// set up slider for learning rate
	$("#slider").slider({
		orientation: "horizontal",
		min: -4,
		max: -1,
		step: 0.05,
		value: Math.log(trainer.learning_rate)/Math.LN10,
		slide: refreshSwatch,
		change: refreshSwatch
	});
	$("#lr").html('Learning rate: ' + trainer.learning_rate);

	$("#f").on('change', function(ev)
	{
		const f = (<any>ev.target).files[0];
		const fr = new FileReader();
		fr.onload = function(ev2)
		{
			const image = new Image();
			image.onload = ()=>
			{
				ori_ctx.drawImage(image, 0, 0, sz, sz);
				oridata = ori_ctx.getImageData(0, 0, sz, sz);
				reload();
			};
			image.src = (<any>ev2.target).result;
		};
		fr.readAsDataURL(f);
	});

	$('.ci').click(function()
	{
		let src = $(this).attr('src');
		ori_ctx.drawImage(this, 0, 0, sz, sz);
		oridata = ori_ctx.getImageData(0, 0, sz, sz);
		reload();
	});
});
