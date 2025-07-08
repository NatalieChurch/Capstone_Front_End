import { useState } from 'react'
import {Routes, Route} from "react-router-dom"
import Home from './components/Home'
import Account from './components/Account'
import Login from './components/Login'
import NavBar from './components/NavBar'
import Game from './components/Game'
import Register from './components/Register'
import Slider from './components/Slider'
import './App.css'

function App() {
  const [token, setToken] = useState(null);

  return (
    <>
      <NavBar token={token} setToken={setToken}/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/account" element={<Account/>}/>
        <Route path="/login" element={<Login setToken={setToken}/>}/>
        <Route path="/register" element={<Register setToken={setToken}/>}/>
        <Route path="/game" element={<Game/>}/>
      </Routes>
    </>
  )
}

export default App
