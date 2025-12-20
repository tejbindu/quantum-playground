

import hadamard from '@assets/images/hadamard.svg';
import pauli_x from '@assets/images/pauli_x.svg';
import pauli_y from '@assets/images/pauli_y.svg';
import pauli_z from '@assets/images/pauli_z.svg';
import phase from '@assets/images/phase.svg';
import t from '@assets/images/t.svg';
import { Position, Handle } from '@xyflow/react';
 
export function SingleQubitGateNode(props) {

    const operation = props.data.operation
    let gateImageSrc = undefined

    switch (operation) {
	case 'hadamard':
	    gateImageSrc = hadamard;
	    break;
	case 'pauli_x':
	    gateImageSrc = pauli_x;
	    break;
	case 'pauli_y':
	    gateImageSrc = pauli_y;
	    break;
	case 'pauli_z':
	    gateImageSrc = pauli_z;
	    break;
	case 'phase':
	    gateImageSrc = phase;
	    break;
	case 't':
	    gateImageSrc = t;
	    break;
    }


    return (
	<div>
	<img src={gateImageSrc} alt='icon'/>
	<Handle type="target" position={Position.Left} />
	<Handle type="source" position={Position.Right} />
	</div>
    )
}
