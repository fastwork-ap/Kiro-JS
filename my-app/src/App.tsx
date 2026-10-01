import './App.css'
import { CascadingIntakeForm } from './components/CascadingIntakeForm'
import { dataSourceName } from './services/provider'

function App() {
  return (
    <div className="app-shell">
      <div className="app-content">
        <p className="data-source-badge">Data source: {dataSourceName}</p>
        <CascadingIntakeForm />
      </div>
    </div>
  )
}

export default App
