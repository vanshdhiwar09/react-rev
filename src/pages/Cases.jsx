import React, { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import { MdOutlineRocketLaunch, MdFileDownloadDone } from "react-icons/md";
import { FaBoxArchive } from "react-icons/fa6";
import { TbAlertSquare } from "react-icons/tb";
//loader function
// NEW BULLETPROOF LOADER (Cases.jsx)
export const casesLoader = async () => {
    // Keep useLoaderData available, but allow immediate route rendering.
    return [];
};
function Cases() {
    
    
    // 1. Core Data State (Powered by React Router Loader)
    const initialCases = useLoaderData();
    const [tableData, setTableData] = useState(initialCases || []);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        let active = true;
        const apiUrl = import.meta.env.VITE_API_URL;
        const apiKey = import.meta.env.VITE_API_KEY;

        const fetchCases = async () => {
            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Cases API returned ${response.status}`);
                }

                const jsonResponse = await response.json();
                let items = [];
                if (Array.isArray(jsonResponse)) {
                    items = jsonResponse;
                } else if (Array.isArray(jsonResponse.case_details)) {
                    items = jsonResponse.case_details;
                } else if (Array.isArray(jsonResponse.data)) {
                    items = jsonResponse.data;
                } else if (Array.isArray(jsonResponse.cases)) {
                    items = jsonResponse.cases;
                } else if (Array.isArray(jsonResponse.result)) {
                    items = jsonResponse.result;
                } else {
                    console.warn("Unexpected cases API response shape:", jsonResponse);
                }

                if (active) {
                    setTableData(items);
                    setLoadError(null);
                }
            } catch (error) {
                if (active) {
                    setLoadError(error.message || "Unable to load cases");
                }
                console.error("Cases loader error:", error);
            } finally {
                if (active) setIsLoading(false);
            }
        };

        fetchCases();
        return () => {
            active = false;
        };
    }, []);

    
    // 2. DRAFT Filter States (What the dropdowns show)
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedPriority, setSelectedPriority] = useState("ALL");

    // 3. APPLIED Filter States (What actually filters the table)
    const [appliedStatus, setAppliedStatus] = useState("ALL");
    const [appliedType, setAppliedType] = useState("ALL");
    const [appliedPriority, setAppliedPriority] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // 4. Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

   
    // THE BUTTON HANDLER: Syncs the Draft state to the Applied state
    const handleApplyFilters = () => {
        setAppliedStatus(selectedStatus);
        setAppliedType(selectedType);
        setAppliedPriority(selectedPriority);
        // Important: Always reset to page 1 when new filters are applied!
        setCurrentPage(1); 
    };

    // SAFETY NET: Ensure validData is always an array
    const validData = Array.isArray(tableData) ? tableData : [];
    
    // FILTER LOGIC: Now uses the APPLIED states, not the selected states!
    // FILTER LOGIC
    const filteredData = validData.filter((caseItem) => {
        const normalizeString = (str) => {
            if (!str) return "";
            return str.toString().toUpperCase().replace(/_/g, ' ').replace(/['"]/g, '').trim();
        };

        // THE ULTIMATE FIX: We manually build the date string so the browser can't mess with the slashes
        const getFormattedDate = (dateString) => {
            if (!dateString) return "";
            const d = new Date(dateString);
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Forces 2 digits (e.g. '10')
            const day = String(d.getDate()).padStart(2, '0');       // Forces 2 digits (e.g. '03')
            const year = d.getFullYear();                           // '2025'
            
            return `${month}/${day}/${year}`; // Guarantees "10/03/2025"
        };

        const matchesStatus = appliedStatus === "ALL" || normalizeString(caseItem.status) === normalizeString(appliedStatus);
        const matchesPriority = appliedPriority === "ALL" || normalizeString(caseItem.priority) === normalizeString(appliedPriority);
        const matchesType = appliedType === "ALL" || normalizeString(caseItem.type) === normalizeString(appliedType);

        const cleanSearch = normalizeString(searchQuery);
        const safeDateString = getFormattedDate(caseItem.creation_date_time);

        const matchesSearch = cleanSearch === "" || 
            normalizeString(caseItem.case_Id).includes(cleanSearch) ||
            normalizeString(caseItem.name).includes(cleanSearch) ||
            normalizeString(caseItem.case_number).includes(cleanSearch) ||
            normalizeString(caseItem.location).includes(cleanSearch) ||
            normalizeString(caseItem.assigned_investigator?.join(' ')).includes(cleanSearch) ||
            safeDateString.includes(cleanSearch); // Now securely checking "10/03/2025"

        return matchesStatus && matchesPriority && matchesType && matchesSearch; 
    });


    // PAGINATION LOGIC: Slice the filtered data to only show 10 items
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTableData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Stats based on FULL data
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
                <div className="table-section">
                    
                    {/* Filters */}
                    {/* Filters */}
                    <div className="filters-bar">
                        <div className="filter-group">
                            <span className="filter-label">FILTER BY:</span>
                            
                            <select 
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="ALL">All Case Types</option>
                                <option value="CRIMINAL">Criminal</option>
                                <option value="INTELLIGENCE_GATHERING">Intelligence Gathering</option>
                                <option value="survelliance">survelliance</option>
                                <option value="OTHER">Other</option>
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="CLOSED">Closed</option>
                            </select>

                            <select 
                                value={selectedPriority}
                                onChange={(e)=> setSelectedPriority(e.target.value)}
                            >
                                <option value="ALL">All Priorities</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>

                            {/* THE FIX: Moved the Apply button here and removed Advanced Filters */}
                            <button className="btn-apply" onClick={handleApplyFilters}>
                                Apply
                            </button>
                        </div>
                        {/* RIGHT SIDE: Instant Search Bar */}
                        <div className="search-container">
                            <input 
                                type="text" 
                                className="search-input"
                                placeholder="Search ID , Name    " 
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1); // <-- Instantly snaps to page 1 while typing
                                }}
                            />
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
                               {/* NEW CLEANED UP TABLE RENDERER */}
                                {currentTableData.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>No cases found.</td></tr>
                                ) : (
                                    /* MAPPING OVER currentTableData (the sliced 10 items) instead of filteredData */
                                    currentTableData.map((row, index) => {
                                        // THE FIX: Added 'en-GB' here so the table explicitly uses slashes too
                                        const d = new Date(row.creation_date_time);
                                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                                        const dd = String(d.getDate()).padStart(2, '0');
                                        const cleanDate = `${mm}/${dd}/${d.getFullYear()}`;
                                        
                                        const investigatorText = row.assigned_investigator && row.assigned_investigator.length > 0 
                                            ? row.assigned_investigator.join(', ') 
                                            : "Unassigned";
                                        return (
                                            <tr key={index}>
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

                    {/* Dynamic Pagination */}
                    <div className="pagination-bar">
                        <span className="showing-text">
                            Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
                        </span>
                        
                        {/* Only show controls if we have more than 1 page */}
                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button 
                                    className="page-btn" 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    &lt;
                                </button>
                                
                                {/* Generate page number buttons dynamically */}
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button 
                                        key={i + 1} 
                                        className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button 
                                    className="page-btn" 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
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