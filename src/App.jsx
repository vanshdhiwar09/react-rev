// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";

// 1. IMPORT THE LOADERS ALONGSIDE THE COMPONENTS
import Cases, { casesLoader } from "./pages/Cases"; 
import Users, { usersLoader } from "./pages/Users"; 

import "./App.css";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />, // The Layout wraps everything
        children: [
            { 
                index: true, // This makes Home the default page at "/"
                element: <Home /> 
            }, 
            { 
                path: "about", 
                element: <About /> 
            },
            { 
                path: "features", 
                element: <Features /> 
            },
            { 
                path: "cases", 
                element: <Cases />,
                loader: casesLoader // 2. ATTACH THE CASES LOADER HERE
            },
            { 
                path: "users", 
                element: <Users />,
                loader: usersLoader // 3. ATTACH THE USERS LOADER HERE
            },
        ]
    }
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;