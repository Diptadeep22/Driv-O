import React from 'react'
import { Link } from 'react-router-dom'
import UploadModal from './UploadModal'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const showUpload = () =>{
      navigate('/upload')
  }
  return (
    <div>
      <aside className="sidebar">
        <div className="logo">☁ Drive</div>

        <nav>
        <Link to='/home'>
          <div  className="nav-item active" style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"left"}}>
            <img src="Home_icon.svg" className='home_icon'></img>
            <p style={{fontSize:"medium",paddingLeft:"5px"}}>Home</p>
          </div>
        </Link>
        
        <Link to='/mydrive'>
          <div className="nav-item" style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"left"}}>
            <img src="my_drive.svg" className='my_drive'></img>
            <p style={{fontSize:"medium",paddingLeft:"5px"}}>My Drive</p>
          </div>
        </Link>
        <br></br>
        <br></br>
        <Link to='/shared'><div className="nav-item">Shared</div></Link>
        <Link to='/recent'><div className="nav-item">Recent</div></Link>
        <br></br>
        <Link to='/trash'>
          <div className="nav-item" style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"left"}}>
            <img src="Dustbin.svg" className='Dustbin' ></img>
            <p style={{fontSize:"medium",paddingLeft:"5px"}}>Trash</p>
          </div>
        </Link>
        <div>
          <button onClick={showUpload} className='create'><img src="plus.svg" className='Plus'></img><p style={{paddingLeft:"5px",fontSize:"larger"}}>Create</p></button> 
        </div>
        
        </nav>

    </aside>
    </div>
  )
}

export default Navbar
