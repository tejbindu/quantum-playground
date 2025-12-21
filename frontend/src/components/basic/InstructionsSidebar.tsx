import { useState } from 'react';

interface InstructionsSidebarProps {
    title: string;
    steps: string[];
}

export function InstructionsSidebar({ title, steps }: InstructionsSidebarProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    right: isOpen ? '320px' : '0',
                    top: '120px',
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#667eea',
                    border: 'none',
                    borderRadius: '8px 0 0 8px',
                    color: 'white',
                    fontSize: '1.2em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '-2px 2px 8px rgba(0,0,0,0.2)',
                    transition: 'right 0.3s ease',
                    zIndex: 1001
                }}
            >
                {isOpen ? '→' : '←'}
            </button>

            <div style={{
                position: 'fixed',
                right: isOpen ? '0' : '-320px',
                top: '100px',
                width: '320px',
                maxHeight: '80vh',
                backgroundColor: '#f8f9ff',
                border: '2px solid #667eea',
                borderRight: isOpen ? '2px solid #667eea' : 'none',
                borderRadius: '8px 0 0 8px',
                boxShadow: '-4px 4px 12px rgba(0,0,0,0.1)',
                transition: 'right 0.3s ease',
                zIndex: 1000,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.2em', fontWeight: '700' }}>
                        📖 {title}
                    </h3>
                    <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                        {steps.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: '12px', fontSize: '0.95em', color: '#333' }}>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </>
    );
}
