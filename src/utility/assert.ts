export function assert(condition:false, message:string):never
export function assert(condition:true, message:string):void
export function assert(condition:boolean, message:string):void|never
export function assert(condition:boolean, message:string):void|never
{
	if(!condition)
	{
		message = message || "Assertion failed";
		if(typeof Error!=="undefined")
		{
			throw new Error(message);
		}
		throw message; // Fallback
	}
}
