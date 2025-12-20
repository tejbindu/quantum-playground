
import './index.css'
import qubit0 from '@assets/images/qubit0.svg'
import qubit1 from '@assets/images/qubit1.svg'
import qubit from '@assets/images/qubit.svg'
import { Position, Handle } from '@xyflow/react';
 
export function QubitNode(props) {

    let qubitImgSrc = undefined

    if (props.data.value == 0) {
	qubitImgSrc = qubit1
    } else if (props.data.value == 1) {
	qubitImgSrc = qubit1
    } else {
	qubitImgSrc = qubit
    }

    return (
	<div>
	<img src={qubitImgSrc} alt='icon'/>
	<Handle type="source" position={Position.Right} />
	</div>
    )
}
