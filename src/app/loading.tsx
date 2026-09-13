export default function Loading() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid rgba(59, 130, 246, 0.3)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#60a5fa', fontSize: '1.125rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          Initializing Quantum Engine...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
