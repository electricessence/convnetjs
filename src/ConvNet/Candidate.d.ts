import {Trainer} from "./Trainer";
import {Net} from "./Net";
import {LayerDefinition} from "./Layers/Layer";
export interface Candidate {
	acc?: number[]|Float64Array,
	accv?: number // this will maintained as sum(acc) for convenience
	layer_defs?: LayerDefinition[],
	trainer_def?: Trainer.Options,
	net: Net,
	trainer?: Trainer,
}