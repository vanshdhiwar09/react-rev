import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiEdit2 } from "react-icons/fi";
import {HiOutlineUserGroup,HiOutlineStar, HiOutlineClipboardDocumentCheck, HiOutlineUser} from "react-icons/hi2";

function Users() {
    // 1. Core Data State
    const [usersData, setUsersData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Search & Filter States
  
    const [searchQuery, setSearchQuery] = useState(""); 
    const [selectedStatus, setSelectedStatus] = useState("ALL"); // THE FIX: Changed to Status
    const [appliedStatus, setAppliedStatus] = useState("ALL");   // THE FIX: Changed to Status

    // 3. Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5 ; 
    // ==========================================
    // 4. MODAL & POST API STATE
    // ==========================================
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    // Aligned perfectly with your API Request Body
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        role_id: '2', // Defaulting to 2 (Investigator)
        location: ''
    });
    const [formErrors, setFormErrors] = useState({});
    
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ==========================================
    // CREATE NEW USER (POST API)
    // ==========================================
    const handleSubmitNewUser = async (e) => {
        e.preventDefault();
        
        // 1. INLINE VALIDATION ENGINE
        const errors = {};
        
        if (!formData.name.trim()) errors.name = "Full name is required.";
        if (!formData.username.trim()) errors.username = "User tag is required.";
        
        if (!formData.email.trim()) {
            errors.email = "Official email is required.";
        } else if (!formData.email.includes('@')) {
            errors.email = "Email must contain an '@' symbol.";
        }

        if (!formData.password) {
            errors.password = "Password is required.";
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters long.";
        }

        if (!formData.location.trim()) errors.location = "Base location is required.";

        // If there are errors, update the UI and STOP the submission
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return; 
        }

        // Clear errors if everything is good
        setFormErrors({});

        try {
            const createApiUrl = import.meta.env.VITE_API_URL_CREATE; 
            const apiKey = import.meta.env.VITE_API_KEY;

            const response = await fetch(createApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}` 
                },
                body: JSON.stringify({
                    username: formData.username,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role_id: parseInt(formData.role_id) || 2,
                    location: formData.location
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({})); 
                // If the backend rejects it, apply that error directly to the form
                if (errorPayload.message) {
                    const backendError = typeof errorPayload.message === 'object' 
                        ? Object.values(errorPayload.message)[0] 
                        : errorPayload.message;
                    // Put backend errors at the top of the form
                    setFormErrors({ backend: backendError }); 
                }
                return;
            }

            const responseData = await response.json();
            const newUser = responseData.data || responseData; 

            setUsersData(prevUsers => [...prevUsers, newUser]);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', username: '', password: '', role_id: '2', location: '' });
            setFormErrors({}); // Reset errors on success

        } catch (err) {
            console.error(err);
            setFormErrors({ backend: "Network error. Please try again." });
        }
    };
    // ==========================================
    // API FETCH LOGIC
    // ==========================================
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL_USERS;
                const apiKey = import.meta.env.VITE_API_KEY;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}` 
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user directory from server.');
                }

                const jsonResponse = await response.json();
                
                // Matches your API key path: jsonResponse.data
                setUsersData(jsonResponse.data || []); 
                
            } catch (err) {
                console.error("API Error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // ==========================================
    // FILTER & SEARCH PROCESSING Pipeline
    // ==========================================
  
  
    const handleApplyFilters = () => {
        setAppliedStatus(selectedStatus); // THE FIX: Apply status
        setCurrentPage(1); 
    };

    const validData = Array.isArray(usersData) ? usersData : [];

    // SMART STATUS HELPER: Calculates status if the API doesn't provide it
    // SMART STATUS HELPER: Calculates status safely
    const getUserStatus = (user) => {
        // 1. If status exists AND is a string, make it uppercase
        if (user.status && typeof user.status === 'string') {
            return user.status.toUpperCase();
        }
        
        // 2. Safely check the role (handles if role is null or a number)
        const roleStr = user.role ? String(user.role).toLowerCase() : '';
        if (roleStr === 'admin' || user.role_id === 1) return 'DUTY HEAD';

        // 3. Safely check the location
        const locStr = user.location ? String(user.location).toLowerCase() : '';
        if (locStr.includes('india') || locStr.includes('mumbai')) return 'AVAILABLE';
        if (['cuba', 'peru'].includes(locStr)) return 'ON LEAVE'; 

        // 4. Default fallback
        return 'ACTIVE';
    };

    const filteredUsers = validData.filter((user) => {
        const normalize = (str) => {
            if (!str) return "";
            return str.toString().toUpperCase().replace(/_/g, ' ').replace(/['"]/g, '').trim();
        };

        const currentStatus = getUserStatus(user);

        // 1. Status Check (Controlled via Apply Button)
        const matchesStatus = appliedStatus === "ALL" || 
                              normalize(currentStatus) === normalize(appliedStatus);

        // 2. Instant Text Search Check 
        const cleanSearch = normalize(searchQuery);
        const matchesSearch = cleanSearch === "" || 
            normalize(user.name).includes(cleanSearch) ||
            normalize(user.email).includes(cleanSearch) ||
            normalize(user.username).includes(cleanSearch) ||
            normalize(user.role).includes(cleanSearch) ||
            normalize(user.location).includes(cleanSearch);

        return matchesStatus && matchesSearch;
    });

    // ==========================================
    // PAGINATION GENERATOR
    // ==========================================
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTableData = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // ==========================================
    // DATA DIGEST FOR STATS (Calculated on the fly)
    // ==========================================
   const totalCount = validData.length;
    const adminCount = validData.filter(u => u.role?.toLowerCase() === 'admin').length;
    const investigatorCount = validData.filter(u => u.role?.toLowerCase() === 'investigator').length;
    const availableCount = validData.filter(u => u.location?.toLowerCase() === 'india').length;

    // THE FIX: Safely calculate the percentage of active investigators (preventing division by zero)
    const activeDutyPercentage = totalCount > 0 ? (investigatorCount / totalCount) * 100 : 0;

    const statsConfig = [
        { title: "TOTAL INVESTIGATORS", number: totalCount.toString(), icon: HiOutlineUserGroup, color: "#64748b" },
        { title: "ACTIVE LEADS (ADMINS)", number: adminCount.toString(), icon: HiOutlineStar, color: "#94a3b8" },
        { 
            title: "ON ACTIVE DUTY (FIELD)", 
            number: investigatorCount.toString(), 
            icon: HiOutlineClipboardDocumentCheck, 
            color: "#3b82f6", 
            // THE FIX: Tell this specific card to render a progress bar using the percentage we just calculated
            hasProgress: true, 
            progressPercent: activeDutyPercentage 
        },
        { title: "AVAILABLE", number: availableCount.toString(), icon: HiOutlineUser, color: "#ef4444" }
    ];

    return (
        <div className="users-dashboard">
            {/* Header Section */}
            <div className="users-header">
                <div className="users-title-section">
                    <h1>User Management</h1>
                    <p>Manage active duty investigators, assignments, and access permissions.</p>
                </div>
               <button className="btn-add-user" onClick={() => setIsModalOpen(true)}>
                    <HiOutlineUser style={{ fontSize: '14px', marginRight: '6px' }} />
                    Add New Investigator
                </button>
            </div>

            {/* Dynamic Stats Cards */}
            {/* Dynamic Stats Cards */}
            <div className="users-stats-grid">
                {statsConfig.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="user-stat-card">
                            <div className="stat-content-wrapper">
                                <div className="stat-text-area">
                                    <h3 className="user-stat-title">{stat.title}</h3>
                                    <div className="user-stat-number" style={{ color: stat.title.includes('AVAILABLE') ? '#e60404' : '#0f172a' }}>
                                        {stat.number}
                                    </div>
                                </div>
                                <div className="user-stat-icon">
                                    <Icon style={{ color: stat.color, fontSize: '22px' }} />
                                </div>
                            </div>
                            
                            {/* THE FIX: Dynamically rendered progress bar at the bottom of the card */}
                            {stat.hasProgress && (
                                <div className="stat-progress-track">
                                    <div 
                                        className="stat-progress-fill" 
                                        style={{ 
                                            width: `${stat.progressPercent}%`, 
                                            backgroundColor: stat.color 
                                        }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Combined Filter & Instant Search Control Row */}
            <div className="users-filter-bar">
                <div className="users-search-wrapper">
                    <FiSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by name, user tag, role, or sector..." 
                        className="users-search-input"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); 
                        }}
                    />
                </div>
                
                <div className="users-filter-actions">
                    <span className="filter-label">STATUS</span>
                    <select 
                        className="users-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DUTY HEAD">Duty Head</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="ON LEAVE">On Leave</option>
                    </select>
                    <button className="btn-apply-filters" onClick={handleApplyFilters}>
                        <FiFilter style={{ marginRight: '4px' }} />
                        Apply
                    </button>
                </div>
            </div>

            {/* Data Table Wrapper */}
            <div className="users-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>NAME</th>
                            <th>LOCATION</th>
                            <th>ROLE</th>
                            <th>USER TAG</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{textAlign: "center", padding: "32px"}}>Initializing secure directory...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" style={{textAlign: "center", padding: "32px", color: "#ef4444"}}>Transmission Error: {error}</td></tr>
                        ) : currentTableData.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign: "center", padding: "32px"}}>No personnel records match criteria.</td></tr>
                        ) : (
                            currentTableData.map((user, index) => {
                                // Dynamic fallbacks to protect layout robustness
                                const avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&size=128`;
                                
                                return (
                                    <tr key={user.id || index}>
                                        <td>
                                            <div className="user-profile-cell">
                                                <img src={avatarSrc} alt="" className="user-avatar" />
                                                <div className="user-info">
                                                    <span className="user-name">{user.name || "N/A"}</span>
                                                    <span className="user-email">{user.email || "—"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.location || "Global Deployment"}</td>
                                        <td>
                                            <span className={`role-badge ${(user.role || 'staff').toLowerCase()}`}>
                                                {user.role ? user.role.toUpperCase() : "STAFF"}
                                            </span>
                                        </td>
                                        <td className="monospace" style={{ fontSize: '11px' }}>
                                            @{user.username || "user_tag"}
                                        </td>
                                        <td>
                                            {/* Matches the derived status perfectly to the filter */}
                                            <span className={`status-pill ${getUserStatus(user) === 'ON LEAVE' ? 'leave' : 'active'}`}>
                                                <span className="status-dot"></span>
                                                {getUserStatus(user) === 'DUTY HEAD' ? 'Duty Head' :
                                                 getUserStatus(user) === 'AVAILABLE' ? 'Available' :
                                                 getUserStatus(user) === 'ON LEAVE' ? 'On Leave' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="icon-btn" title="View Dossier"><FiEye /></button>
                                                <button className="icon-btn" title="Modify Permissions"><FiEdit2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Control Pagination Base Strip */}
                <div className="users-pagination">
                    <span className="showing-text">
                        Showing {filteredUsers.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                    </span>
                    
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button 
                                className="page-btn text-btn" 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            
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
                                className="page-btn text-btn" 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* =========================================
                ADD NEW USER MODAL OVERLAY
            ========================================= */}
            {isModalOpen && (
                <div className="users-modal-overlay">
                    <div className="users-modal-card">
                        
                        <div className="modal-header">
                            <h2>Add New Personnel</h2>
                            <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmitNewUser} noValidate>
                            <div className="modal-body">
                                
                                {/* Show backend server errors at the top if they happen */}
                                {formErrors.backend && <div className="backend-error-alert">{formErrors.backend}</div>}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" name="name" value={formData.name} onChange={handleInputChange} 
                                            className={formErrors.name ? 'error-input' : ''} 
                                            placeholder="e.g. John Doe" 
                                        />
                                        {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>User Tag</label>
                                        <input 
                                            type="text" name="username" value={formData.username} onChange={handleInputChange} 
                                            className={formErrors.username ? 'error-input' : ''} 
                                            placeholder="e.g. john_d" 
                                        />
                                        {formErrors.username && <span className="error-text">{formErrors.username}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Official Email</label>
                                        <input 
                                            type="email" name="email" value={formData.email} onChange={handleInputChange} 
                                            className={formErrors.email ? 'error-input' : ''} 
                                            placeholder="john.doe@agency.gov" 
                                        />
                                        {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="password-input-wrapper">
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                name="password" value={formData.password} onChange={handleInputChange} 
                                                className={formErrors.password ? 'error-input' : ''} 
                                                placeholder="Set default password" 
                                            />
                                            <button 
                                                type="button" 
                                                className="btn-toggle-password"
                                                onClick={() => setShowPassword(!showPassword)}
                                                title={showPassword ? "Hide Password" : "Show Password"}
                                            >
                                                {showPassword ? (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                                    </svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Assigned Role</label>
                                        <select name="role_id" value={formData.role_id} onChange={handleInputChange}>
                                            <option value="1">Admin</option>
                                            <option value="2">Investigator</option>
                                            <option value="3">Officer</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Base Location</label>
                                        <input 
                                            type="text" name="location" value={formData.location} onChange={handleInputChange} 
                                            className={formErrors.location ? 'error-input' : ''} 
                                            placeholder="e.g. United Kingdom" 
                                        />
                                        {formErrors.location && <span className="error-text">{formErrors.location}</span>}
                                    </div>
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Authorizing...' : 'Authorize User'}
                                </button>
                            </div>
                        </form>
                        
                    </div>
                </div>
            )}
            
        </div>
    );
}

export default Users;