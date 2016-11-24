import {IMap} from "typescript-dotnet-umd/IMap";
interface JsonSerializable<TJson> {

	toJSON():TJson
	toJSON<T extends IMap<any>>(json?:T):T & TJson

	fromJSON(source:TJson):this;
}