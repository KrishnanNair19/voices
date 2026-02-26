import { tokens } from '@voices/core'

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.color.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1
        style={{
          color: tokens.color.primary,
          fontFamily: tokens.fontFamily.sans,
          fontSize: tokens.fontSize.display,
          fontWeight: tokens.fontWeight.bold,
          margin: 0,
        }}
      >
        Voices
      </h1>
    </div>
  )
}

export default App
