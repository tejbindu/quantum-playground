import { useState } from "react";
import TableauInput from "../stabilizer-evolution/tableau-input/TableauInput";
import { InstructionsSidebar } from '../basic/InstructionsSidebar';

export function QECSimulator() {
    const [codeType, setCodeType] = useState<string>("bit_flip");
    const [numQubits, setNumQubits] = useState<number>(3);
    const [initialTableau, setInitialTableau] = useState<any>(null);
    const [errors, setErrors] = useState<Array<{type: string, qubit: number}>>([]);
    const [result, setResult] = useState<any>(null);

    const codeInfo: Record<string, {name: string, qubits: number, description: string}> = {
        "bit_flip": { name: "3-Qubit Bit-Flip Code", qubits: 3, description: "Corrects single X errors" },
        "phase_flip": { name: "3-Qubit Phase-Flip Code", qubits: 3, description: "Corrects single Z errors" },
        "steane": { name: "Steane 7-Qubit Code", qubits: 7, description: "Corrects any single-qubit error" }
    };

    const addError = (type: string, qubit: number) => {
        setErrors([...errors, { type, qubit }]);
    };

    const removeError = (index: number) => {
        setErrors(errors.filter((_, i) => i !== index));
    };

    const simulateQEC = () => {
        const data = {
            codeType: codeType,
            errors: errors
        };

        fetch('/quantum/qec/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            if (data.initial && data.afterErrors) {
                setResult(data);
            }
        })
        .catch(err => console.error('QEC simulation failed:', err));
    };

    const renderStabilizers = (state: any) => {
        if (!state) return null;
        
        return state.x.slice(0, numQubits).map((xRow: number[], i: number) => {
            const zRow = state.z[i];
            const phase = state.r[i];
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
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: '#fff', borderRadius: '4px' }}>
                    <span style={{ minWidth: '25px', textAlign: 'right', color: '#764ba2', fontWeight: 'bold' }}>{phaseSymbol}</span>
                    <span style={{ fontFamily: 'monospace' }}>{pauliString}</span>
                </div>
            );
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <InstructionsSidebar 
                title="Error Correction"
                steps={[
                    "Select a pre-built QEC code from the dropdown (bit-flip, phase-flip, or Steane)",
                    "Read the code description to understand what errors it corrects",
                    "Inject errors by selecting error type (X, Y, or Z) and qubit number",
                    "Multiple errors can be added - they appear as colored tags",
                    "Click 'Measure Syndrome & Correct' to run error correction",
                    "View the syndrome (measurement results) for each state",
                    "See the recovery operation needed to fix the error",
                    "Verify the state is corrected back to the original"
                ]}
            />
            <h2 style={{ color: '#667eea', fontWeight: '700' }}>Quantum Error Correction</h2>
            
            <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '350px' }}>
                    <div style={{ padding: '15px', border: '2px solid #667eea', borderRadius: '8px', backgroundColor: '#f8f9ff' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em', color: '#667eea' }}>Select QEC Code</h3>
                        <select 
                            value={codeType} 
                            onChange={(e) => { setCodeType(e.target.value); setErrors([]); setResult(null); }}
                            style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #667eea' }}
                        >
                            {Object.entries(codeInfo).map(([key, info]) => (
                                <option key={key} value={key}>{info.name}</option>
                            ))}
                        </select>
                        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                            <strong>Qubits:</strong> {codeInfo[codeType].qubits}<br/>
                            <strong>Capability:</strong> {codeInfo[codeType].description}
                        </div>
                    </div>
                    
                    <div style={{ padding: '15px', border: '2px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em' }}>Inject Errors</h3>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            {['X', 'Y', 'Z'].map(errorType => (
                                <div key={errorType} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{errorType}:</label>
                                    <select onChange={(e) => { addError(errorType, parseInt(e.target.value)); e.target.value = ""; }} defaultValue="">
                                        <option value="" disabled>Qubit</option>
                                        {Array(codeInfo[codeType].qubits).fill(0).map((_, i) => (
                                            <option key={i} value={i}>{i}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <strong>Injected Errors:</strong>
                            {errors.length === 0 ? ' None' : ''}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                {errors.map((err, idx) => (
                                    <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#ffe0e6', borderRadius: '4px', border: '1px solid #f5576c' }}>
                                        <strong>{err.type}</strong> on Q{err.qubit}
                                        <button onClick={() => removeError(idx)} style={{ marginLeft: '8px', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2em' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button className="compile-button" onClick={simulateQEC}>Measure Syndrome & Correct</button>
                </div>

                {result && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '20px', border: '2px solid #667eea', borderRadius: '8px', backgroundColor: '#f8f9ff' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Initial State (No Errors)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {renderStabilizers(result.initial)}
                            </div>
                            <div style={{ marginTop: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                Syndrome: [{result.initial.syndrome.join(', ')}] ✅
                            </div>
                        </div>

                        <div style={{ padding: '20px', border: `2px solid ${result.hasError ? '#f5576c' : '#23d5ab'}`, borderRadius: '8px', backgroundColor: result.hasError ? '#fff5f7' : '#f0fff4' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: result.hasError ? '#f5576c' : '#23d5ab' }}>After Errors</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {renderStabilizers(result.afterErrors)}
                            </div>
                            <div style={{ marginTop: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                Syndrome: [{result.afterErrors.syndrome.join(', ')}] {result.hasError ? '❌' : '✅'}
                            </div>
                        </div>

                        {result.recovery && (
                            <>
                                <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px', textAlign: 'center' }}>
                                    <strong style={{ fontSize: '1.1em' }}>🔧 Recovery Operation:</strong>
                                    <div style={{ fontSize: '1.3em', marginTop: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: '#856404' }}>
                                        Apply {result.recovery.type} on Qubit {result.recovery.qubit}
                                    </div>
                                </div>

                                {result.afterRecovery && (
                                    <div style={{ padding: '20px', border: '2px solid #23d5ab', borderRadius: '8px', backgroundColor: '#f0fff4' }}>
                                        <h3 style={{ margin: '0 0 10px 0', color: '#23d5ab' }}>After Recovery ✅</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {renderStabilizers(result.afterRecovery)}
                                        </div>
                                        <div style={{ marginTop: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                            Syndrome: [{result.afterRecovery.syndrome.join(', ')}] ✅
                                        </div>
                                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4f4dd', borderRadius: '4px', fontWeight: 'bold', textAlign: 'center', fontSize: '1.1em' }}>
                                            🎉 Error Successfully Corrected!
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {!result.recovery && result.hasError && (
                            <div style={{ padding: '15px', backgroundColor: '#ffe0e6', border: '2px solid #f5576c', borderRadius: '8px', textAlign: 'center' }}>
                                <strong style={{ fontSize: '1.1em', color: '#c41e3a' }}>⚠️ Error Cannot Be Corrected</strong>
                                <div style={{ marginTop: '8px', fontSize: '0.95em' }}>
                                    The syndrome does not match any correctable single-qubit error pattern.
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
