///<reference types="jquery"/>
///<reference types="jqueryui"/>
import * as ConvNet from "../../src/ConvNet/index";
import {Vol} from "../../src/ConvNet/Vol";
import {NPGMain} from "./npgmain";
//noinspection JSUnusedLocalSymbols
const C = ConvNet;

const t = `
layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
layer_defs.push({type:'fc', num_neurons:20, activation:'sigmoid'});
layer_defs.push({type:'regression', num_neurons:1});

net = new ConvNet.Net();
net.makeLayers(layer_defs);

trainer = new ConvNet.Trainer(net, {learning_rate:0.01, momentum:0.0, batch_size:1, l2_decay:0.001});
`;

const ss = 30.0; // scale for drawing
let N:number;
let layer_defs;
let net:ConvNet.Net;
let trainer:ConvNet.Trainer;

export class Regression extends NPGMain
{


	data;
	labels;

	avloss:number;

	// create neural net


	lix:number = 2; // layer id of layer we'd like to draw outputs of

	//noinspection JSMethodCanBeStatic
	reload()
	{
		eval($("#layerdef").val());

		// refresh buttons
		let t = '';
		for(let i = 1; i<net.layers.length - 1; i++)
		{ // ignore input and regression layers (first and last)
			const butid = "button" + i;
			const onClick = 'R.updateLix(' + i + ')';
			t
				+= `<input id="${butid}" value="${net.layers[i].layer_type}" type="submit" onclick="${onClick}" style="width:80px; height: 30px; margin:5px;"/>`;
		}
		$("#layer_ixes").html(t);
		$(`#button${this.lix}`).css('background-color', '#FFA');
	}

	//noinspection JSUnusedGlobalSymbols
	updateLix(newlix:number)
	{
		$(`#button${this.lix}`).css('background-color', ''); // erase highlight
		$(`#button${newlix}`).css('background-color', '#FFA');
		this.lix = newlix;
	}

	regen_data()
	{
		N = parseInt($("#num_data").val());
		this.data = [];
		this.labels = [];
		for(let i = 0; i<N; i++)
		{
			const x = Math.random()*10 - 5;
			const y = x*Math.sin(x);
			this.data.push([x]);
			this.labels.push([y]);
		}
	}

	init()
	{
		this.regen_data();
		$("#layerdef").val(t);
		this.reload();
	}


	update()
	{
// forward prop the data

		const netx = new Vol(1, 1, 1);
		let avloss = 0.0;
		let iters:number;
		for(iters = 0; iters<50; iters++)
		{
			for(let ix = 0; ix<N; ix++)
			{
				netx.w = this.data[ix];
				const stats = trainer.train(netx, this.labels[ix]);
				avloss += stats.loss;
			}
		}
		avloss /= N*iters;
		this.avloss = avloss;

	}

	draw()
	{

		let x;
		const ctx = this.ctx;
		ctx.clearRect(0, 0, this.width, this.height);
		ctx.fillStyle = "black";

		const netx = new Vol(1, 1, 1);

		// draw decisions in the grid
		const density = 5.0;
		const draw_neuron_outputs = $("#layer_outs").is(':checked');

		// draw final decision
		const neurons:Float64Array[] = [];
		ctx.beginPath();
		for(x = 0.0; x<=this.width; x += density)
		{

			netx.w[0] = (x - this.width/2)/ss;
			const a = net.forward(netx);
			let y = a.w[0];

			if(draw_neuron_outputs)
			{
				neurons.push(net.layers[this.lix].out_act!.w); // back these up
			}

			if(x===0) ctx.moveTo(x, -y*ss + this.height/2);
			else ctx.lineTo(x, -y*ss + this.height/2);
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
				for(x = 0.0; x<=this.width; x += density)
				{
					if(x===0) ctx.moveTo(x, -neurons[n][k]*ss + this.height/2);
					else ctx.lineTo(x, -neurons[n][k]*ss + this.height/2);
					n++;
				}
				ctx.stroke();
			}
		}

		// draw axes
		ctx.beginPath();
		ctx.strokeStyle = 'rgb(50,50,50)';
		ctx.lineWidth = 1;
		ctx.moveTo(0, this.height/2);
		ctx.lineTo(this.width, this.height/2);
		ctx.moveTo(this.width/2, 0);
		ctx.lineTo(this.width/2, this.height);
		ctx.stroke();

		// draw data-points. Draw support vectors larger
		ctx.strokeStyle = 'rgb(0,0,0)';
		ctx.lineWidth = 1;
		for(let i = 0; i<N; i++)
		{
			this.drawCircle(this.data[i]*ss + this.width/2, -this.labels[i]*ss + this.height/2, 5.0);
		}

		ctx.fillStyle = "blue";
		ctx.font = "bold 16px Arial";
		ctx.fillText("average loss: " + this.avloss, 20, 20);
	}

	//noinspection JSUnusedGlobalSymbols
	mouseClick(x, y)
	{

		// add data-point at location of click
		this.data.push([(x - this.width/2)/ss]);
		this.labels.push([-(y - this.height/2)/ss]);
		N += 1;

	}

	keyDown(/*key*/)
	{
	}

	keyUp(/*key*/)
	{

	}


}

export function init(fps:number):Regression
{
	return new Regression(fps);
}