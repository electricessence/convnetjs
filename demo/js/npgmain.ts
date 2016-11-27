//Simple game engine
//Author: Andrej Karpathy
//License: BSD
//This function does all the boring canvas stuff. To use it, just create functions:
//update()          gets called every frame
//draw()            gets called every frame
//myinit()          gets called once in beginning
//mouseClick(x, y)  gets called on mouse click
//keyUp(keycode)    gets called when key is released
//keyDown(keycode)  gets called when key is pushed

export abstract class NPGMain
{
	canvas:HTMLCanvasElement;
	ctx:CanvasRenderingContext2D;
	width:number;
	height:number;

	constructor(fps:number)
	{
		//takes frames per second to run at

		let canvas = this.canvas = <any>document.getElementById('NPGcanvas');
		this.ctx = canvas.getContext('2d');
		this.width = canvas.width;
		this.height = canvas.height;
		canvas.addEventListener('click', this.eventClick, false);

		//canvas element cannot get focus by default. Requires to either set
		//tab-index to 1 so that it's focusable, or we need to attach listeners
		//to the document. Here we do the latter
		document.addEventListener('keyup', this.eventKeyUp, true);
		document.addEventListener('keydown', this.eventKeyDown, true);

		this.init();

		setInterval(NPGMain.tick, 1000/fps, this);

	}

	protected abstract init():void;

	protected abstract update():void;

	protected abstract draw():void;

	static tick(main:NPGMain):void
	{
		main.update();
		main.draw();
	}

	drawBubble(x, y, w, h, radius)
	{
		const r = x + w;
		const b = y + h;
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + radius/2, y - 10);
		ctx.lineTo(x + radius*2, y);
		ctx.lineTo(r - radius, y);
		ctx.quadraticCurveTo(r, y, r, y + radius);
		ctx.lineTo(r, y + h - radius);
		ctx.quadraticCurveTo(r, b, r - radius, b);
		ctx.lineTo(x + radius, b);
		ctx.quadraticCurveTo(x, b, x, b - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.stroke();
	}

	drawRect(x, y, w, h)
	{
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	drawCircle(x, y, r)
	{
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}

	eventClick(e)
	{

		//get position of cursor relative to top left of canvas
		let x;
		let y;
		if(e.pageX || e.pageY)
		{
			x = e.pageX;
			y = e.pageY;
		}
		else
		{
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		x -= this.canvas.offsetLeft;
		y -= this.canvas.offsetTop;

		//call user-defined callback
		mouseClick(x, y, e.shiftKey, e.ctrlKey);
	}

	abstract keyUp(keycode:number):void;

	abstract keyDown(keycode:number):void;

	//event codes can be found here:
	//http://www.aspdotnetfaq.com/Faq/What-is-the-list-of-KeyCodes-for-JavaScript-KeyDown-KeyPress-and-KeyUp-events.aspx
	protected eventKeyUp(e)
	{
		const keycode = ('which' in e) ? e.which : e.keyCode;
		this.keyUp(keycode);
	}

	protected eventKeyDown(e)
	{
		const keycode = ('which' in e) ? e.which : e.keyCode;
		this.keyDown(keycode);
	}

}



