
import './index.css'
import zmeasurement from '@assets/images/zmeasurement.svg'
import { Position, Handle } from '@xyflow/react';

export function MeasurementNode(props) {

    const measurementImageSource = zmeasurement

    return (
	<div>
	<img src={measurementImageSource} alt='icon'/>
	<Handle type="target" position={Position.Left} />
	</div>
    )
}
