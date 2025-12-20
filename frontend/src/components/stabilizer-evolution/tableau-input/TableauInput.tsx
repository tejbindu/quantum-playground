import { useState, useEffect } from 'react';
import './index.css';

interface TableauRow {
  prefix: string;
  [key: string]: string;
}

interface TableauInputProps {
  numQubits?: number;
  onNumQubitsChange?: (count: number) => void;
}

function TableauInput({ numQubits = 3, onNumQubitsChange }: TableauInputProps) {
  const [data, setData] = useState<TableauRow[]>([
    { prefix: '+1', q0: 'I', q1: 'I', q2: 'I' },
    { prefix: '+1', q0: 'I', q1: 'I', q2: 'I' },
    { prefix: '+1', q0: 'I', q1: 'I', q2: 'I' }
  ]);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);

  // Update data when numQubits changes from parent
  useEffect(() => {
    setData(prev => prev.map(row => {
      const newRow: TableauRow = { prefix: row.prefix };
      for (let i = 0; i < numQubits; i++) {
        newRow[`q${i}`] = row[`q${i}`] || 'I';
      }
      return newRow;
    }));
  }, [numQubits]);

  const updateCell = (rowIdx: number, field: string, value: string) => {
    setData(prev => prev.map((row, idx) => 
      idx === rowIdx ? { ...row, [field]: value } : row
    ));
  };

  const addRow = () => {
    const newRow: TableauRow = { prefix: '+1' };
    for (let i = 0; i < numQubits; i++) {
      newRow[`q${i}`] = 'I';
    }
    setData(prev => [...prev, newRow]);
  };

  const removeRow = (rowIdx: number) => {
    setData(prev => prev.filter((_, idx) => idx !== rowIdx));
  };

  const addColumn = () => {
    if (onNumQubitsChange) {
      onNumQubitsChange(numQubits + 1);
    }
  };

  const removeColumn = () => {
    if (numQubits <= 1) return;
    
    if (onNumQubitsChange) {
      onNumQubitsChange(numQubits - 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, rowIdx: number) => {
    setDraggedRow(rowIdx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedRow === null || draggedRow === dropIdx) return;

    setData(prev => {
      const newData = [...prev];
      const [moved] = newData.splice(draggedRow, 1);
      newData.splice(dropIdx, 0, moved);
      return newData;
    });
    setDraggedRow(null);
  };

  const renderQubitColumns = () => 
    Array(numQubits).fill(null).map((_, i) => (
      <th key={i}>
        <div>
          <button onClick={removeColumn} className="tableau-remove-button">×</button>
        </div>
        <div>Q{i}</div>
      </th>
    ));

  const renderQubitCells = (row: TableauRow, rowIdx: number) =>
    Array(numQubits).fill(null).map((_, i) => (
      <td key={i}>
        <select 
          value={row[`q${i}`]} 
          onChange={(e) => updateCell(rowIdx, `q${i}`, e.target.value)}
        >
          <option>I</option>
          <option>X</option>
          <option>Y</option>
          <option>Z</option>
        </select>
      </td>
    ));

  return (
    <div className="tableau-container">
      <div className="tableau-table-container">
        <table className="tableau-table">
          <thead>
            <tr>
              <th className="tableau-remove-column"></th>
              <th>Sign</th>
              {renderQubitColumns()}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr 
                key={rowIdx}
                className={`tableau-row ${draggedRow === rowIdx ? 'tableau-row-dragged' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, rowIdx)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, rowIdx)}
              >
                <td>
                  <button onClick={() => removeRow(rowIdx)}>×</button>
                </td>
                <td>
                  <select 
                    value={row.prefix} 
                    onChange={(e) => updateCell(rowIdx, 'prefix', e.target.value)}
                  >
                    <option>+1</option>
                    <option>-1</option>
                    <option>+i</option>
                    <option>-i</option>
                  </select>
                </td>
                {renderQubitCells(row, rowIdx)}
              </tr>
            ))}
            <tr>
              <td></td>
              <td colSpan={numQubits + 1}>
                <button onClick={addRow} className="tableau-add-generator-button">
                  Add Generator
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="tableau-add-qubit-container">
        <div className="tableau-add-qubit-spacer"></div>
        <div className="tableau-add-qubit-button-container">
          <button 
            onClick={addColumn}
            className="tableau-add-qubit-button"
            style={{ height: `${(data.length + 1) * 40}px` }}
          >
            Add Qubit
          </button>
        </div>
      </div>
    </div>
  );
}

export default TableauInput;
