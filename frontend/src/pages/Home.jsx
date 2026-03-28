
import React, { useRef } from "react";

import Header from "../components/Header";
import Doctors from "../components/Doctors"; 
import Footer from "../components/Footer";
import Features from "../components/Features";
import Feedback from "../components/Feedback"; 
import OurImpact from "../components/OurImpact";


 
function Home() {
    const sectionRef = useRef(null);
    const scroll = () => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    return (
        <>
            <div>
                <div className=''>
                    {/* header */}
                    <Header onExploreClick={scroll} />

                    {/* main-content */}

                    {/* features cards*/}
                    <Features sectionRef={sectionRef} />

                    {/* Doctors profile */}
                    <Doctors />

                    {/* Feedback */}
                    <Feedback/>

                    {/* impact data */}
                    <OurImpact/>

                    {/* footer */}
                    <Footer />
                   
                </div>
            </div>

        </>
    )
}

export default Home
