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
import hadamard from '@assets/images/hadamard.svg';
import pauli_x from '@assets/images/pauli_x.svg';
import pauli_y from '@assets/images/pauli_y.svg';
import pauli_z from '@assets/images/pauli_z.svg';
import cnot from '@assets/images/cnot.svg';
import swap from '@assets/images/swap.svg';

export function StablizerEvolutionSimulator() {
    const [numQubits, setNumQubits] = useState<number>(3);
    const [tableauResult, setTableauResult] = useState<any>(null);
    const [initialTableau, setInitialTableau] = useState<any>(null);

    const gateImages: Record<string, string> = {
        'hadamard': hadamard,
        'pauli_x': pauli_x,
        'pauli_y': pauli_y,
        'pauli_z': pauli_z,
        'cnot': cnot,
        'swap': swap
    };

    const nodeTypes = {
	'qubitNode': QubitNode,
	'measurementNode': MeasurementNode,
	'singleQubitGateNode': SingleQubitGateNode,
	'twoQubitGateNode': TwoQubitGateNode
    };

    const createQubitNodes = (count: number) => {
        const qubitNodes = Array(count).fill(null).map((_, i) => ({
            id: `qubit-${i}`,
            type: 'qubitNode',
            position: { x: 50, y: 100 + i * 80 },
            data: { value: '|0⟩', label: `Q${i}` }
        }));
        
        const measurementNodes = Array(count).fill(null).map((_, i) => ({
            id: `measurement-${i}`,
            type: 'measurementNode',
            position: { x: 300, y: 100 + i * 80 },
            data: {}
        }));
        
        return [...qubitNodes, ...measurementNodes];
    };

    const [nodes, setNodes] = useState<any[]>(createQubitNodes(numQubits));
    const [edges, setEdges] = useState<any[]>([]);

    // Update ReactFlow nodes when numQubits changes
    useEffect(() => {
        setNodes(prevNodes => {
            const newNodes = createQubitNodes(numQubits);
            const gateNodes = prevNodes.filter(node => node.type !== 'qubitNode' && node.type !== 'measurementNode');
            return [...newNodes, ...gateNodes];
        });
        setEdges([]);
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
	const qubitNodes = nodes.filter(node => node.type === 'qubitNode').sort((node1, node2) => node1.position.y - node2.position.y);
	const qubitIdToIndex = new Map(qubitNodes.map((node, idx) => [node.id, idx]));

	const nodesData = Object.fromEntries(
	    nodes.map(node => [node.id, {
		type: node.type,
		data: node.data,
		inputs: node.type === 'singleQubitGateNode' ? [undefined] : [undefined, undefined]
	    }])
	);

	const graph = Object.fromEntries(Object.keys(nodesData).map(id => [id, []]));
	edges.forEach(edge => {
	    graph[edge.source].push({
		target: edge.target,
		targetHandle: edge.targetHandle,
		sourceHandle: edge.sourceHandle
	    });
	});

	const operations = [];
	const nodeQueue = qubitNodes.map(node => ({
	    ...node,
	    type: 'qubitNode',
	    inputs: [node.id]
	}));

	while (nodeQueue.length > 0) {
	    const node = nodeQueue.pop();
	    const id = node.id;
	    const inputs = node.inputs;
	    const operation = node.operation;

	    if (node.type !== 'qubitNode') {
		const qubitIndices = inputs.map(input => qubitIdToIndex.get(input));
		operations.push({
		    operation: operation,
		    inputs: qubitIndices
		});
	    }

	    for (const edge of graph[id]) {
		const target = edge.target;
		let input = inputs[0];

		if (node.type === 'twoQubitGateNode') {
		    input = edge.sourceHandle === 'output1' ? inputs[0] : inputs[1];
		}

		if (nodesData[target].type === 'singleQubitGateNode') {
		    nodeQueue.push({
			id: target,
			type: nodesData[target].type,
			inputs: [input],
			operation: nodesData[target].data.operation,
		    });
		} else if (nodesData[target].type === 'twoQubitGateNode') {
		    if (edge.targetHandle === 'input1') {
			nodesData[target].inputs[0] = input;
		    } else if (edge.targetHandle === 'input2') {
			nodesData[target].inputs[1] = input;
		    }

		    if (nodesData[target].inputs[0] !== undefined && nodesData[target].inputs[1] !== undefined) {
			nodeQueue.push({
			    id: target,
			    type: nodesData[target].type,
			    inputs: nodesData[target].inputs,
			    operation: nodesData[target].data.operation
			});
		    }
		} else if (nodesData[target].type === 'measurementNode') {
		    nodeQueue.push({
			id: target,
			type: nodesData[target].type,
			inputs: [input],
			operation: "measurement"
		    });
		}
	    }
	}

	const data = {
	    numQubits: numQubits,
	    operations: operations.filter(op => op.operation !== 'measurement'),
	    initialTableau: initialTableau
	};

	fetch('/quantum/stabilizer/simulate', {
	    method: 'POST',
	    headers: {
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(data => {
	    if (data.x && data.z && data.r) {
		setTableauResult(data);
	    }
	})
	.catch(err => console.error('backend call failed:', err));
    }
    return (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '20px'}}>
	    <div style={{ display: 'flex', gap: '30px'}}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '10px'}}>
		    <Pallete onNodesChange={onNodesChange} />
		    <TableauInput numQubits={numQubits} onNumQubitsChange={setNumQubits} onTableauChange={setInitialTableau} />
		    <button className="compile-button" onClick={() => simulateCircuit()}>Compile Circuit and Run</button>
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
	    {tableauResult && tableauResult.evolution && (
		<div style={{ 
		    padding: '25px', 
		    border: '2px solid #667eea', 
		    borderRadius: '12px', 
		    backgroundColor: '#ffffff', 
		    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
		    overflowX: 'auto' 
		}}>
		    <h3 style={{ margin: '0 0 20px 0', color: '#667eea', fontWeight: '700', fontSize: '1.3em' }}>Stabilizer Evolution</h3>
		    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px' }}>
			{tableauResult.evolution.map((step: any, stepIdx: number) => (
			    <div key={stepIdx} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px' }}>
				    {stepIdx === 0 && (
					<div style={{ fontSize: '1em', color: '#667eea', marginBottom: '10px', fontWeight: '700', textAlign: 'center' }}>
					    Initial
					</div>
				    )}
				    <div style={{ 
					padding: '16px', 
					backgroundColor: '#f8f9ff', 
					borderRadius: '8px', 
					border: '2px solid #e0e5ff',
					boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
				    }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '1em', fontWeight: '500' }}>
					    {step.x.slice(0, tableauResult.numQubits).map((xRow: number[], i: number) => {
						const zRow = step.z[i];
						const phase = step.r[i];
						const pauliString = xRow.map((x: number, j: number) => {
						    const z = zRow[j];
						    if (x === 0 && z === 0) return 'I';
						    if (x === 1 && z === 0) return 'X';
						    if (x === 0 && z === 1) return 'Z';
						    if (x === 1 && z === 1) return 'Y';
						    return '?';
						}).join('');
						
						let phaseSymbol = '+';
						if (phase === 0) phaseSymbol = '+';
						else if (phase === 1) phaseSymbol = '-';
						else if (phase === 2) phaseSymbol = '+i';
						else if (phase === 3) phaseSymbol = '-i';
						
						return (
						    <div key={i} style={{ display: 'flex', gap: '8px' }}>
							<span style={{ minWidth: '25px', textAlign: 'right', color: '#764ba2' }}>{phaseSymbol}</span>
							<span style={{ color: '#333' }}>{pauliString}</span>
						    </div>
						);
					    })}
					</div>
				    </div>
				</div>
				{stepIdx < tableauResult.evolution.length - 1 && (
				    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
					<img 
					    src={gateImages[tableauResult.evolution[stepIdx + 1].operation]} 
					    alt={tableauResult.evolution[stepIdx + 1].operation}
					    style={{ width: '45px', height: '45px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
					/>
					<div style={{ fontSize: '1.8em', color: '#667eea', fontWeight: 'bold' }}>→</div>
				    </div>
				)}
			    </div>
			))}
		    </div>
		</div>
	    )}
	</div>
    );
}
