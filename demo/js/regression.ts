///<reference types="jquery"/>
///<reference types="jqueryui"/>
let N, data, labels;
const ss = 30.0; // scale for drawing

let layer_defs, net, trainer;

// create neural net
const t = "layer_defs = [];\n\
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'sigmoid'});\n\
layer_defs.push({type:'regression', num_neurons:1});\n\
\n\
net = new convnetjs.Net();\n\
net.makeLayers(layer_defs);\n\
\n\
trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, momentum:0.0, batch_size:1, l2_decay:0.001});\n\
";

let lix = 2; // layer id of layer we'd like to draw outputs of
function reload()
{
	eval($("#layerdef").val());

	// refresh buttons
	let t = '';
	for(let i = 1; i<net.layers.length - 1; i++)
	{ // ignore input and regression layers (first and last)
		const butid = "button" + i;
		t
			+= "<input id=\"" + butid + "\" value=\"" + net.layers[i].layer_type + "\" type=\"submit\" onclick=\"updateLix(" + i + ")\" style=\"width:80px; height: 30px; margin:5px;\";>";
	}
	$("#layer_ixes").html(t);
	$("#button" + lix).css('background-color', '#FFA');
}
function updateLix(newlix)
{
	$("#button" + lix).css('background-color', ''); // erase highlight
	lix = newlix;
	$("#button" + lix).css('background-color', '#FFA');
}

function regen_data()
{
	N = parseInt($("#num_data").val());
	data = [];
	labels = [];
	for(let i = 0; i<N; i++)
	{
		const x = Math.random()*10 - 5;
		const y = x*Math.sin(x);
		data.push([x]);
		labels.push([y]);
	}
}

function myinit()
{
	regen_data();
	$("#layerdef").val(t);
	reload();
}

function update()
{
// forward prop the data

	const netx = new convnetjs.Vol(1, 1, 1);
	avloss = 0.0;

	for(let iters = 0; iters<50; iters++)
	{
		for(let ix = 0; ix<N; ix++)
		{
			netx.w = data[ix];
			const stats = trainer.train(netx, labels[ix]);
			avloss += stats.loss;
		}
	}
	avloss /= N*iters;

}

function draw()
{

	let x;
	ctx.clearRect(0, 0, WIDTH, HEIGHT);
	ctx.fillStyle = "black";

	const netx = new Vol(1, 1, 1);

	// draw decisions in the grid
	const density = 5.0;
	const draw_neuron_outputs = $("#layer_outs").is(':checked');

	// draw final decision
	const neurons = [];
	ctx.beginPath();
	for(x = 0.0; x<=WIDTH; x += density)
	{

		netx.w[0] = (x - WIDTH/2)/ss;
		const a = net.forward(netx);
		let y = a.w[0];

		if(draw_neuron_outputs)
		{
			neurons.push(net.layers[lix].out_act.w); // back these up
		}

		if(x===0) ctx.moveTo(x, -y*ss + HEIGHT/2);
		else ctx.lineTo(x, -y*ss + HEIGHT/2);
	}
	ctx.stroke();

	// draw individual neurons on first layer
	if(draw_neuron_outputs)
	{
		const NL = neurons.length;
		ctx.strokeStyle = 'rgb(250,50,50)';
		for(let k = 0; k<NL; k++)
		{
			ctx.beginPath();
			let n = 0;
			for(x = 0.0; x<=WIDTH; x += density)
			{
				if(x===0) ctx.moveTo(x, -neurons[n][k]*ss + HEIGHT/2);
				else ctx.lineTo(x, -neurons[n][k]*ss + HEIGHT/2);
				n++;
			}
			ctx.stroke();
		}
	}

	// draw axes
	ctx.beginPath();
	ctx.strokeStyle = 'rgb(50,50,50)';
	ctx.lineWidth = 1;
	ctx.moveTo(0, HEIGHT/2);
	ctx.lineTo(WIDTH, HEIGHT/2);
	ctx.moveTo(WIDTH/2, 0);
	ctx.lineTo(WIDTH/2, HEIGHT);
	ctx.stroke();

	// draw datapoints. Draw support vectors larger
	ctx.strokeStyle = 'rgb(0,0,0)';
	ctx.lineWidth = 1;
	for(let i = 0; i<N; i++)
	{
		drawCircle(data[i]*ss + WIDTH/2, -labels[i]*ss + HEIGHT/2, 5.0);
	}

	ctx.fillStyle = "blue";
	ctx.font = "bold 16px Arial";
	ctx.fillText("average loss: " + avloss, 20, 20);
}

function mouseClick(x, y, shiftPressed)
{

	// add datapoint at location of click
	data.push([(x - WIDTH/2)/ss]);
	labels.push([-(y - HEIGHT/2)/ss]);
	N += 1;

}

function keyDown(key)
{
}

function keyUp(key)
{

}

$(function()
{

});