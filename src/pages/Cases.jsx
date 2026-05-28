import React, { useState, useEffect } from 'react';
import { MdOutlineRocketLaunch, MdFileDownloadDone } from "react-icons/md";
import { FaBoxArchive } from "react-icons/fa6";
import { TbAlertSquare } from "react-icons/tb";

function Cases() {
    // 1. Set up State for real data
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Fetch Data when the component loads
    useEffect(() => {
        const fetchCases = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const apiKey = import.meta.env.VITE_API_KEY;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}` 
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch cases from the server.');
                }

                const data = await response.json();
                
                // EXTRACT THE ARRAY: Point exactly to the 'case_details' array in the response
                setTableData(data.case_details || []); 
                
            } catch (err) {
                console.error("API Error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCases();
    }, []);

    // SAFETY NET: Ensure validData is always an array to prevent .length crashes
    const validData = Array.isArray(tableData) ? tableData : [];

    // 3. Dynamically calculate stats based on the valid data
    const stats = [
        { 
            title: "TOTAL CASES", 
            number: validData.length.toString().padStart(2, '0'), 
            description: "All registered folders", 
            icon: FaBoxArchive, 
            color: "" 
        },
        { 
            title: "ACTIVE INVESTIGATIONS", 
            // Look for 'OPEN' to match your API's status terminology
            number: validData.filter(c => c.status?.toUpperCase() === 'OPEN').length.toString().padStart(2, '0'), 
            description: "Under active review", 
            icon: MdOutlineRocketLaunch, 
            color: "red" 
        },
        { 
            title: "RECENTLY CLOSED (24H)", 
            number: validData.filter(c => c.status?.toUpperCase() === 'CLOSED').length.toString().padStart(2, '0'), 
            description: "Finalized in the last cycle", 
            icon: MdFileDownloadDone, 
            color: "" 
        },
        { 
            title: "HIGH PRIORITY TASKS", 
            number: validData.filter(c => c.priority?.toUpperCase() === 'HIGH').length.toString().padStart(2, '0'), 
            description: "Immediate attention required", 
            icon: TbAlertSquare, 
            color: "" 
        }
    ];

    // Keep Activity Feed as mock data for now
    const activityFeed = [
        { id: 1, text: "Officer Miller updated Case #EV-2024-00124", time: "15 minutes ago" },
        { id: 2, text: "Lab Report attached to Case #EV-2024-00125", time: "2 hours ago" },
        { id: 3, text: "Access Log recorded for Case #2024-TR99", time: "5 hours ago" }
    ];

    return (
        <div className="cases-dashboard">
            {/* Header Section */}
            <div className="cases-header">
                <div className="cases-title-section">
                    <h1>Cases Management</h1>
                    <p>Centralized tracking of investigative workflows and criminal proceedings.</p>
                </div>
                <button className="btn-create">+ CREATE NEW CASE</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={index} className="stat-card">
                            <div className="stat-header">
                                <h3 className="stat-title">{stat.title}</h3>
                                <span className="stat-icon" style={{ color: stat.color }}>
                                    <IconComponent />
                                </span>
                            </div>
                            <div className="stat-number">{stat.number}</div>
                            <p className="stat-description">{stat.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="main-content">
                
                {/* Left Side: Table & Filters */}
                <div className="table-section">
                    
                    {/* Filters */}
                    <div className="filters-bar">
                        <div className="filter-group">
                            <span className="filter-label">FILTER BY:</span>
                            <select><option>All Case Types</option></select>
                            <select><option>All Statuses</option></select>
                            <select><option>Date Range</option></select>
                        </div>
                        <div className="filter-actions">
                            <button className="btn-text">Advanced Filters</button>
                            <button className="btn-apply">Apply Filters</button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>CASE ID</th>
                                    <th>CASE NAME</th>
                                    <th>STATUS</th>
                                    <th>ASSIGNED LEAD</th>
                                    <th>PRIORITY</th>
                                    <th>DATE CREATED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Conditional Rendering based on fetch state */}
                                {isLoading ? (
                                    <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>Loading data...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan="6" style={{textAlign: "center", padding: "20px", color: "red"}}>Error: {error}</td></tr>
                                ) : validData.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>No cases found.</td></tr>
                                ) : (
                                    validData.map((row, index) => {
                                        // 1. Clean up the date string
                                        const cleanDate = new Date(row.creation_date_time).toLocaleDateString();
                                        
                                        // 2. Format the assigned investigator array
                                        const investigatorText = row.assigned_investigator && row.assigned_investigator.length > 0 
                                            ? row.assigned_investigator.join(', ') 
                                            : "Unassigned";

                                        return (
                                            <tr key={index}>
                                                {/* Use your exact API keys here */}
                                                <td className="monospace">{row.case_Id}</td>
                                                <td className="fw-500">{row.name}</td>
                                                <td>
                                                    <span className={`status-badge ${row.status?.toLowerCase()}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td>{investigatorText}</td>
                                                <td>
                                                    <span className="priority">
                                                        <span className={`priority-dot ${row.priority?.toLowerCase()}`}></span>
                                                        {row.priority}
                                                    </span>
                                                </td>
                                                <td>{cleanDate}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination-bar">
                        <span className="showing-text">
                            Showing {validData.length > 0 ? 1 : 0}-{Math.min(10, validData.length)} of {validData.length} results
                        </span>
                        <div className="pagination-controls">
                            <button className="page-btn">&lt;</button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <button className="page-btn">&gt;</button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Activity Feed */}
                <div className="cases-activity-column">
                    <div className="activity-feed-card">
                        <div className="activity-header">
                            <h3>Activity Feed</h3>
                            <button className="btn-text small">See All</button>
                        </div>
                        <ul className="activity-list">
                            {activityFeed.map((activity) => (
                                <li key={activity.id} className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="activity-content">
                                        <p>{activity.text}</p>
                                        <span className="activity-time">{activity.time}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Cases;