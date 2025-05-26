import React from 'react'
import './Navbar.css'
import logo from '../../Assets/logo.png'
import navprofileIcon from '../Assets/nav-profile.svg'

const Navbar = () => {
  return (
    <div className='navbar'>
      <img src={logo} alt="logo" />
      <p>ShopNest Admin Panel</p>
    </div>
  )
}

export default Navbar
