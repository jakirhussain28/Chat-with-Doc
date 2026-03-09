import LeftPane from './components/LeftPane'
import ChatArea from './components/ChatArea'
import RightPane from './components/RightPane'
import './index.css'

function App() {
  return (
    <div className="flex h-screen w-screen bg-slate-950 p-3 gap-3 font-mono overflow-hidden">
      <LeftPane />
      <ChatArea />
      <RightPane />
    </div>
  )
}

export default App