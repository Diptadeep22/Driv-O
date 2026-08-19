import './App.css'
import Signup from './components/Signup'  
import Home from './components/Home'
import My_Drive from './components/My_Drive'
import Shared from './components/Shared'
import Trash from './components/Trash'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import UploadModal from './components/UploadModal'
import Recent from './components/Recent'
function App() {

  return (
    <>
      <div>
        <Router>
          <Routes>
            <Route exact path ='/' element={<Signup/>}/>
            <Route exact path='/home' element={<Home/>}/>
            <Route exact path='/mydrive' element={<My_Drive/>}/>
            <Route exact path='/shared' element={<Shared/>}/>
            <Route exact path='/trash' element={<Trash/>}/>
            <Route exact path='/upload' element={<UploadModal/>}/>
            <Route exact path='/recent' element={<Recent/>}/>
          </Routes>
        </Router>
      </div>
    </>
  )
}

export default App
