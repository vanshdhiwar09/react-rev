// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Cases from "./pages/Cases";
import Users from "./pages/Users";
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
                path: "about", // No need for leading slashes in children
                element: <About /> 
            },
            { 
                path: "features", 
                element: <Features /> 
            },
            { 
                path: "cases", 
                element: <Cases /> 
            },
            { 
                path: "users", 
                element: <Users /> 
            },
        ]
    }
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;

