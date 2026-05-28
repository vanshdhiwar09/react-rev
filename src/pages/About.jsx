function About(){
    return (
        <div className="about-page">
            <div className="about-content">
                <div className="about-text">
                    <h1>About Us</h1>
                    <p>React was created by Jordan Walke, a software engineer at Facebook, who developed an early prototype called "FaxJS" in 2011 to address the company's need for a more efficient, dynamic UI—specifically for their News Feed. Inspired by XHP, a PHP component library, Walke sought to bring a similar component-based approach to JavaScript. After being successfully implemented on Instagram in 2012, React was officially open-sourced at JSConf US in May 2013. Despite initial skepticism from developers over its unique JSX syntax and "HTML-in-JS" approach, React revolutionized front-end development by introducing the Virtual DOM and a declarative, component-based architectu</p>
                </div>
                <div className="about-images">
                    <img src="/src/assets/jordan walke.jpg" alt="Main" className="main-image" />
                    <img src="/src/assets/reactimg.png" alt="Overlay" className="overlay-image" />
                </div>
            </div>
        </div>
    );
}
export default About;