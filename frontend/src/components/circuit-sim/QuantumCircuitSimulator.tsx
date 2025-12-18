import { useCallback, useState } from "react";
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { QubitNode } from "./ui/nodes/QubitNode";
import { MeasurementNode } from "./ui/nodes/MeasurementNode";
import { Pallete } from "./ui/pallete/Pallete";
import { SingleQubitGateNode } from './ui/nodes/SingleQubitGateNode'
import { TwoQubitGateNode } from './ui/nodes/TwoQubitGateNode'
import { useNodes } from '@xyflow/react';
import { transform_graph_to_circuit } from "./compute/QuantumCircuitTransformer";

export function QuantumCircuitSimulator() {

    const nodeTypes = {
	'qubitNode': QubitNode,
	'measurementNode': MeasurementNode,
	'singleQubitGateNode': SingleQubitGateNode,
	'twoQubitGateNode': TwoQubitGateNode
    };

    const initialNodes = [];

    const initialEdges = [];

    const [nodes, setNodes] = useState(initialNodes);

    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = useCallback(
	(changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)), []
    );
    const onEdgesChange = useCallback(
	(changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)), []
    );
    const onConnect = useCallback(
	(params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)), []
    );

    const printEverything = () => {
	console.log(nodes)
	console.log(edges)
	console.log(transform_graph_to_circuit(nodes, edges))
    }
    return (
	<div style={{ display: 'flex', gap: '30px'}}>
	    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px'}}>
		<Pallete onNodesChange={onNodesChange} />
		<button onClick={() => printEverything()}>Compile Circuit and Run</button>
	    </div>
	    <div style= {{ height: '80vh', width: '80vw', border:'2px solid gray'}}>
		<ReactFlow
		nodes={nodes}
		edges={edges}
		nodeTypes={nodeTypes}
		onNodesChange={onNodesChange}
		onEdgesChange={onEdgesChange}
		onConnect={onConnect}
		fitView={true}
		/>
	    </div>
	</div>
    );
}
