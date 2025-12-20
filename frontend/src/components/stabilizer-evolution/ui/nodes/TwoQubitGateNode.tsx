

import cnot from '@assets/images/cnot.svg';
import swap from '@assets/images/swap.svg';
import cphase from '@assets/images/cphase.svg';
import { Position, Handle } from '@xyflow/react';
 
export function TwoQubitGateNode(props) {

    const operation = props.data.operation
    let gateImageSrc = undefined

    switch (operation) {
	case 'cnot':
	    gateImageSrc = cnot;
	    break;
	case 'swap':
	    gateImageSrc = swap;
	    break;
	case 'cphase':
	    gateImageSrc = cphase;
	    break;
    }


    return (
	<div>
	<img src={gateImageSrc} alt='icon'/>
	<Handle type="target" id="input1" position={Position.Left} style={{ top: '20px' }} />
	<Handle type="target" id="input2" position={Position.Left} style={{ top: '55px' }} />
	<Handle type="source" id="output1" position={Position.Right} style={{ top: '20px' }} />
	<Handle type="source" id="output2" position={Position.Right} style={{ top: '55px' }} />
	</div>
    )
}
