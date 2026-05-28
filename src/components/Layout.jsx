// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout() {
    return (
        <>
            <Navbar />
            <div id="Container">
                <Sidebar />
                <div id="content">
                    {/* The Outlet acts as a placeholder for your page components */}
                    <Outlet /> 
                </div>
            </div>
        </>
    );
}

export default Layout;