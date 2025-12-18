import "./App.css";
import { TabbedWindows } from "./components/basic/TabbedWindows";
import { QuantumCircuitSimulator } from "./components/circuit-sim/QuantumCircuitSimulator";

function App() {

    const windows: [string, React.JSX.Element][] = [
	['Quantum Circuit Simulation', <QuantumCircuitSimulator />], 
	['Stabilizer Tableu Operations', <div>second</div>]
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
