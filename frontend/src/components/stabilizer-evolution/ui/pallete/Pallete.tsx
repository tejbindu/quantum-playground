
import hadamard from '@assets/images/hadamard.svg';
import pauli_x from '@assets/images/pauli_x.svg';
import pauli_y from '@assets/images/pauli_y.svg';
import pauli_z from '@assets/images/pauli_z.svg';
import cnot from '@assets/images/cnot.svg';
import swap from '@assets/images/swap.svg';
import './index.css'
import { useState } from "react"

export function Pallete(props) {

    const [nodeId, setNodeId] = useState(1000)

    const onNodesChange = props.onNodesChange

    const handleClick = (nodeType, nodeData) => {

	const nodeAddChange = {
	    item: {
		id: `gate-${nodeId}`,
		type: nodeType,
		position: { x: 150, y: 150 },
		data: nodeData,
	    },
	    type: "add"
	}

	onNodesChange([nodeAddChange])
	setNodeId(nodeId+1)

    };

    return (
	<div className='pallete'>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'hadamard' })}><img src={hadamard} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'pauli_x' })}><img src={pauli_x} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'pauli_y' })}><img src={pauli_y} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'pauli_z' })}><img src={pauli_z} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('twoQubitGateNode', { operation: 'cnot' })}><img src={cnot} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('twoQubitGateNode', { operation: 'swap' })}><img src={swap} alt='icon'/></button>
	</div>
    );
}
