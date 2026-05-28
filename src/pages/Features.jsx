import Card from "../components/Card";
import { FiCode, FiZap, FiShare2 } from "react-icons/fi";

function Features(){
    return (
        <div className="features-page">
            <h1 className="features-title">Features</h1>
            <div className="features-container">
                <Card 
                    icon={<FiCode />}
                    title="Easy to Learn"
                    description="Learn React fundamentals with clear, simple examples and tutorials."
                />
                <Card 
                    icon={<FiZap />}
                    title="High Performance"
                    description="Build fast and efficient applications with optimized rendering."
                />
                <Card 
                    icon={<FiShare2 />}
                    title="Reusable Components"
                    description="Create modular components that can be reused across your application."
                />
            </div>
        </div>
    );
}
export default Features;
