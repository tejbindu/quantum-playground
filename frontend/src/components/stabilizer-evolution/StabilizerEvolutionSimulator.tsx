import { useCallback, useEffect, useState } from "react";
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { QubitNode } from "./ui/nodes/QubitNode";
import { MeasurementNode } from "./ui/nodes/MeasurementNode";
import { Pallete } from "./ui/pallete/Pallete";
import { SingleQubitGateNode } from './ui/nodes/SingleQubitGateNode'
import { TwoQubitGateNode } from './ui/nodes/TwoQubitGateNode'
import { useNodes } from '@xyflow/react';
import TableauInput from "./tableau-input/TableauInput";

export function StablizerEvolutionSimulator() {
    const [numQubits, setNumQubits] = useState<number>(3);

    const nodeTypes = {
	'qubitNode': QubitNode,
	'measurementNode': MeasurementNode,
	'singleQubitGateNode': SingleQubitGateNode,
	'twoQubitGateNode': TwoQubitGateNode
    };

    const createQubitNodes = (count: number) => {
        return Array(count).fill(null).map((_, i) => ({
            id: `qubit-${i}`,
            type: 'qubitNode',
            position: { x: 50, y: 100 + i * 80 },
            data: { value: '|0⟩', label: `Q${i}` }
        }));
    };

    const [nodes, setNodes] = useState<any[]>(createQubitNodes(numQubits));
    const [edges, setEdges] = useState<any[]>([]);

    // Update ReactFlow nodes when numQubits changes
    useEffect(() => {
        setNodes(prevNodes => {
            const qubitNodes = createQubitNodes(numQubits);
            const nonQubitNodes = prevNodes.filter(node => node.type !== 'qubitNode');
            return [...qubitNodes, ...nonQubitNodes];
        });
    }, [numQubits]);

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

	const nodesData = Object.fromEntries(
	    nodes.map(node => [node.id, {
		type: node.type,
		data: node.data,
		inputs: node.type === 'singleQubitGateNode' ? [undefined] : [undefined, undefined]
	    }])
	)

	const qubitNodes = nodes.filter(node => node.type === 'qubitNode').sort((node1, node2) =>node1.position.y - node2.position.y).map(node => ({
	    id: node.id,
	    value: node.data.value
	}))
	const gateNodes = nodes.filter(node => node.type === 'singleQubitGateNode' || node.type === 'twoQubitGateNode').map(node => ({
	    id: node.id,
	    operation: node.data.operation
	}))
	const measurementNodes = nodes.filter(node => node.type === 'measurementNode').map(node => ({
	    id: node.id
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

	const nodeQueue = qubitNodes.map(
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

	    console.log(node)

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
	console.log("moow")
	console.log(graph)
	console.log(qubitNodes)
	console.log(gateNodes)
	console.log(edges)
	console.log("poow")
	console.log(operations)

	const data = {
	    "qubitNodes": qubitNodes,
	    "operations": operations
	}
	fetch('/circuit/simulate', {
	    method: 'POST',
	    headers: {
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(data => console.log(data))
	.catch(err => console.error('backend call failed:', err))
    }
    return (
	<div style={{ display: 'flex', gap: '30px'}}>
	    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px'}}>
		<Pallete onNodesChange={onNodesChange} />
		<button onClick={() => simulateCircuit()}>Compile Circuit and Run</button>
		<TableauInput numQubits={numQubits} onNumQubitsChange={setNumQubits} />
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
