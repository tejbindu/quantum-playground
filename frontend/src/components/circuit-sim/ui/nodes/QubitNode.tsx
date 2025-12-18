
import './index.css'
import qubit0 from '@assets/images/qubit0.svg'
import qubit1 from '@assets/images/qubit1.svg'
import { Position, Handle } from '@xyflow/react';
 
export function QubitNode(props) {

    const qubitImgSrc = props.data.value == 1 ? qubit1 : qubit0

    return (
	<div>
	<img src={qubitImgSrc} alt='icon'/>
	<Handle type="source" position={Position.Right} />
	</div>
    )
}
