import "./App.css";
import { TabbedWindows } from "./components/basic/TabbedWindows";
import { QuantumCircuitSimulator } from "./components/circuit-sim/QuantumCircuitSimulator";
import { StablizerEvolutionSimulator } from "./components/stabilizer-evolution/StabilizerEvolutionSimulator";
import { QECSimulator } from "./components/qec/QECSimulator";

function App() {

    const windows: [string, React.JSX.Element][] = [
	['Quantum Circuit Simulation', <QuantumCircuitSimulator />], 
	// ['Stabilizer Tableu Operations', <StablizerEvolutionSimulator />],
	// ['Quantum Error Correction', <QECSimulator />]
    ]

  return (
      <>
      <div className='root'>
      <div className='title-bar'>Quantum Playground</div>
      <TabbedWindows tabList={windows} />
      </div>
      </>
  );
}

export default App;
