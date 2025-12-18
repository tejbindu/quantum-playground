
import qubit0 from '@assets/images/qubit0.svg'
import qubit1 from '@assets/images/qubit1.svg'
import zmeasurement from '@assets/images/zmeasurement.svg'
import hadamard from '@assets/images/hadamard.svg';
import pauli_x from '@assets/images/pauli_x.svg';
import pauli_y from '@assets/images/pauli_y.svg';
import pauli_z from '@assets/images/pauli_z.svg';
import phase from '@assets/images/phase.svg';
import t from '@assets/images/t.svg';
import cnot from '@assets/images/cnot.svg';
import swap from '@assets/images/swap.svg';
import cphase from '@assets/images/cphase.svg';
import './index.css'
import { useState } from "react"

export function Pallete(props) {

    const [nodeId, setNodeId] = useState(0)

    const [positionYValue, setPositionYValue] = useState(100)
    const [positionXValue, setPositionXValue] = useState(0)

    const onNodesChange = props.onNodesChange

    const handleClick = (nodeType, nodeData) => {

	const positionX = positionXValue - 500

	const nodeAddChange = {
	    item: {
		id: String(nodeId),
		type: nodeType,
		position: { x: positionXValue - 500, y: 200 },
		data: nodeData,
	    },
	    type: "add"
	}

	onNodesChange([nodeAddChange])
	setNodeId(nodeId+1)
	setPositionXValue((positionXValue+40)%500)

    };

    return (
	<div className='pallete'>
	<button className='button' onClick={() => handleClick('qubitNode', { value: 0 })}><img src={qubit0} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('qubitNode', { value: 1 })}><img src={qubit1} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('measurementNode', { })}><img src={zmeasurement} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'hadamard' })}><img src={hadamard} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'pauli_x' })}><img src={pauli_x} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'pauli_y' })}><img src={pauli_y} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'pauli_z' })}><img src={pauli_z} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 'phase' })}><img src={phase} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('singleQubitGateNode', { operation: 't' })}><img src={t} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('twoQubitGateNode', { operation: 'cnot' })}><img src={cnot} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('twoQubitGateNode', { operation: 'swap' })}><img src={swap} alt='icon'/></button>
	<button className='button' onClick={() => handleClick('twoQubitGateNode', { operation: 'cphase' })}><img src={cphase} alt='icon'/></button>
	</div>
    );
}
