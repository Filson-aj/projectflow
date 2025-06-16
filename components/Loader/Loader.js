import React from 'react'

import classes from './Loader.module.css'

const Loader = () => {
    return (
        <div className='flex justify-center items-center min-h-screen bg-gray-700/40 backdrop-blur-2xl'><span className={classes.Loader}></span></div>
    )
}

export default Loader
