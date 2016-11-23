/**
 * returns string representation of float
 * but truncated to length of d digits
 * @param x
 * @param digits
 * @returns {string}
 */
export function f2t(x:number, digits:number = 5):string
{
	const dd = Math.pow(10, digits);
	return '' + Math.floor(x*dd)/dd;
}

export default f2t;