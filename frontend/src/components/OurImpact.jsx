import React from 'react'
import ourImpact from '../assets/jsonData/ourimpact.json'

function OurImpact() {
    return (
        <>

            <div className='min-h-screen flex justify-center items-center px-4'>
                <div className='bg-gradient-to-r from-amber-800 via-amber-500 to-amber-300 w-full max-w-4xl p-6 sm:p-10 md:p-16 rounded-2xl'>

                    <h2 className='text-2xl sm:text-3xl md:text-5xl text-center font-medium pb-3 sm:pb-5'>
                        Numbers That Matter
                    </h2>

                    <p className='text-center'>
                        See the difference we're making in the lives of our patients every single day.
                    </p>

                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 pt-8 sm:pt-12 justify-items-center'>
                        {ourImpact.map((data) => (
                            <div key={data.id} className='text-center'>
                                <span className='block text-3xl sm:text-4xl md:text-5xl font-semibold font-serif'>
                                    {data.value}
                                </span>
                                <span className='block text-sm sm:text-base mt-2'>
                                    {data.label}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    )
}

export default OurImpact
