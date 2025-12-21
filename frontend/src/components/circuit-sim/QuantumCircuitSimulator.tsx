import { useCallback, useEffect, useState } from "react";
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { QubitNode } from "./ui/nodes/QubitNode";
import { MeasurementNode } from "./ui/nodes/MeasurementNode";
import { Pallete } from "./ui/pallete/Pallete";
import { SingleQubitGateNode } from './ui/nodes/SingleQubitGateNode'
import { TwoQubitGateNode } from './ui/nodes/TwoQubitGateNode'
import { useNodes } from '@xyflow/react';
import { InstructionsSidebar } from '../basic/InstructionsSidebar';

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

    const [probabilities, setProbabilities] = useState<number[]>([]);

    const onNodesChange = useCallback(
	(changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)), []
    );
    const onEdgesChange = useCallback(
	(changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)), []
    );
    const onConnect = useCallback(
	(params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)), []
    );

    const simulateCircuit = () => {

	// Validation checks
	const qubitNodes = nodes.filter(node => node.type === 'qubitNode');
	const gateNodes = nodes.filter(node => node.type === 'singleQubitGateNode' || node.type === 'twoQubitGateNode');
	const measurementNodes = nodes.filter(node => node.type === 'measurementNode');

	// Check 1: Circuit must have at least one qubit
	if (qubitNodes.length === 0) {
	    alert('Invalid circuit: No qubits found. Add at least one qubit.');
	    return;
	}

	// Check 2: All qubits must be measured
	if (measurementNodes.length !== qubitNodes.length) {
	    alert(`Invalid circuit: ${qubitNodes.length} qubit(s) but only ${measurementNodes.length} measurement(s). Each qubit must be measured.`);
	    return;
	}

	// Check 3: All nodes must have proper connections
	const nodeConnections = new Map();
	nodes.forEach(node => nodeConnections.set(node.id, { incoming: 0, outgoing: 0 }));

	edges.forEach(edge => {
	    nodeConnections.get(edge.source).outgoing++;
	    nodeConnections.get(edge.target).incoming++;
	});

	// Qubits must have exactly 1 outgoing connection
	for (const qubit of qubitNodes) {
	    const conn = nodeConnections.get(qubit.id);
	    if (conn.outgoing === 0) {
		alert(`Invalid circuit: Qubit is not connected to anything.`);
		return;
	    }
	}

	// Single qubit gates must have 1 input and 1 output
	for (const gate of nodes.filter(n => n.type === 'singleQubitGateNode')) {
	    const conn = nodeConnections.get(gate.id);
	    if (conn.incoming !== 1) {
		alert(`Invalid circuit: Single qubit gate (${gate.data.operation}) must have exactly 1 input wire.`);
		return;
	    }
	    if (conn.outgoing !== 1) {
		alert(`Invalid circuit: Single qubit gate (${gate.data.operation}) must have exactly 1 output wire.`);
		return;
	    }
	}

	// Two qubit gates must have 2 inputs and 2 outputs
	for (const gate of nodes.filter(n => n.type === 'twoQubitGateNode')) {
	    const conn = nodeConnections.get(gate.id);
	    if (conn.incoming !== 2) {
		alert(`Invalid circuit: Two qubit gate (${gate.data.operation}) must have exactly 2 input wires.`);
		return;
	    }
	    if (conn.outgoing !== 2) {
		alert(`Invalid circuit: Two qubit gate (${gate.data.operation}) must have exactly 2 output wires.`);
		return;
	    }
	}

	// Measurement nodes must have exactly 1 input
	for (const measurement of measurementNodes) {
	    const conn = nodeConnections.get(measurement.id);
	    if (conn.incoming !== 1) {
		alert(`Invalid circuit: Measurement node must have exactly 1 input wire.`);
		return;
	    }
	}

	// Check 4: No disconnected nodes
	for (const node of nodes) {
	    const conn = nodeConnections.get(node.id);
	    if (node.type !== 'qubitNode' && node.type !== 'measurementNode' && conn.incoming === 0 && conn.outgoing === 0) {
		alert(`Invalid circuit: Gate (${node.data.operation}) is not connected to the circuit.`);
		return;
	    }
	}

	const nodesData = Object.fromEntries(
	    nodes.map(node => [node.id, {
		type: node.type,
		data: node.data,
		inputs: node.type === 'singleQubitGateNode' ? [undefined] : [undefined, undefined]
	    }])
	)

	const sortedQubitNodes = qubitNodes.sort((node1, node2) =>node1.position.y - node2.position.y).map(node => ({
	    id: node.id,
	    value: node.data.value
	}))

	const graph = Object.fromEntries(
	    Object.keys(nodesData).map(id => [id, []])
	)
	for (const edge of edges) {
	    const source = edge.source
	    const target = edge.target
	    const targetHandle = edge.targetHandle
	    const sourceHandle = edge.sourceHandle
	    graph[source].push({"target": target, "targetHandle": targetHandle, "sourceHandle": sourceHandle})
	}

	const operations = []

	const nodeQueue = sortedQubitNodes.map(
	    node => ({
		...node,
		type: 'qubitNode',
		"inputs": [node.id]
	    })
	)

	while (nodeQueue.length > 0) {

	    const node = nodeQueue.pop()
	    const id = node.id
	    const inputs = node.inputs
	    const operation = node.operation

	    if (!(node.type === 'qubitNode')) {
		operations.push({
		    "operation": operation,
		    "inputs": inputs
		})
	    }

	    for (const edge of graph[id]) {
		
		const target = edge.target
		let input = inputs[0]

		if (node.type === 'singleQubitGateNode') {
		    input = inputs[0]
		} else if (node.type === 'twoQubitGateNode') {
		    input = edge.sourceHandle === 'output1'? inputs[0] : inputs[1]
		}

		if (nodesData[target].type === 'singleQubitGateNode') {
		    nodeQueue.push({
			"id": target,
			"type": nodesData[target].type,
			"inputs": [input],
			"operation": nodesData[target].data.operation,
		    })
		} else if (nodesData[target].type === 'twoQubitGateNode') {
		    if (edge.targetHandle === 'input1') {
			nodesData[target].inputs[0] = input
		    } else if (edge.targetHandle === 'input2') {
			nodesData[target].inputs[1] = input
		    }

		    if (nodesData[target].inputs[0] != undefined && nodesData[target].inputs[1] != undefined) {
			nodeQueue.push({
			    "id": target,
			    "type": nodesData[target].type,
			    "inputs": nodesData[target].inputs,
			    "operation": nodesData[target].data.operation
			})
		    }
		} else if (nodesData[target].type === 'measurementNode') {
		    nodeQueue.push({
			"id": target,
			"type": nodesData[target].type,
			"inputs": [input],
			"operation": "measurement"
		    })
		}
	    }
	}

	const data = {
	    "qubitNodes": sortedQubitNodes,
	    "operations": operations
	}
	fetch('/quantum/circuit/simulate', {
	    method: 'POST',
	    headers: {
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(data)
	})
	.then(res => {
	    if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`)
	    }
	    return res.text()
	})
	.then(text => {
	    const data = JSON.parse(text)
	    if (data.probabilities) {
		setProbabilities(data.probabilities)
	    }
	})
	.catch(err => console.error('backend call failed:', err))
    }
    return (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '20px'}}>
	    <InstructionsSidebar 
		title="Circuit Simulation"
		steps={[
		    "Click on qubit nodes (|0⟩ or |1⟩) in the palette to add them to the canvas",
		    "Drag qubits vertically to arrange them in order",
		    "Click on gate nodes (H, X, Y, Z, CNOT, etc.) to add gates",
		    "Connect nodes by dragging from output handles to input handles",
		    "Each qubit must connect through gates to a measurement node",
		    "Click 'Compile Circuit and Run' to simulate",
		    "View probability distribution for each basis state below"
		]}
	    />
	    <div style={{ display: 'flex', gap: '30px'}}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '10px'}}>
		    <Pallete onNodesChange={onNodesChange} />
		    <button className="compile-button" onClick={() => simulateCircuit()}>Compile Circuit and Run</button>
		    <button className="clear-button" onClick={() => { setNodes([]); setEdges([]); setProbabilities([]); }}>Clear Circuit</button>
		</div>
		<div style= {{ height: '60vh', width: '80vw', border:'2px solid gray'}}>
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
	    {probabilities.length > 0 && (
		<div style={{ padding: '20px', border: '2px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
		    <h3 style={{ margin: '0 0 15px 0', color: '#333', fontWeight: '600' }}>Measurement Probabilities</h3>
		    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
			{probabilities.map((prob, idx) => (
			    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
				<div style={{ minWidth: '60px', fontSize: '0.95em', color: '#555', fontWeight: '500' }}>
				    |{idx.toString(2).padStart(Math.log2(probabilities.length), '0')}⟩
				</div>
				<div style={{ flex: 1, height: '30px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: '1px solid #e0e0e0' }}>
				    <div style={{ 
					height: '100%', 
					width: `${prob * 100}%`, 
					background: 'linear-gradient(90deg, #667eea, #764ba2)',
					transition: 'width 0.5s ease'
				    }} />
				</div>
				<div style={{ minWidth: '70px', fontSize: '1em', fontWeight: 'bold', color: '#333', textAlign: 'right' }}>
				    {(prob * 100).toFixed(2)}%
				</div>
			    </div>
			))}
		    </div>
		</div>
	    )}
	</div>
    );
}
