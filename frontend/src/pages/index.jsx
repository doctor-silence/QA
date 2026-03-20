import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Repository from "./Repository";

import Execution from "./Execution";

import Reports from "./Reports";

import Traceability from "./Traceability";

import PublicReport from "./PublicReport";

import Home from "./Home";

import SharedSteps from "./SharedSteps";

import Workload from "./Workload";

import Reviews from "./Reviews";

import Billing from "./Billing";

import Projects from "./Projects";

import TestDataStore from "./TestDataStore";

import Team from "./Team";

import MindMap from "./MindMap";

import AutomationAPI from "./AutomationAPI";

import AuditLog from "./AuditLog";

import Management from "./Management";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Repository: Repository,
    
    Execution: Execution,
    
    Reports: Reports,
    
    Traceability: Traceability,
    
    PublicReport: PublicReport,
    
    Home: Home,
    
    SharedSteps: SharedSteps,
    
    Workload: Workload,
    
    Reviews: Reviews,
    
    Billing: Billing,
    
    Projects: Projects,
    
    TestDataStore: TestDataStore,
    
    Team: Team,
    
    MindMap: MindMap,
    
    AutomationAPI: AutomationAPI,
    
    AuditLog: AuditLog,
    
    Management: Management,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Repository" element={<Repository />} />
                
                <Route path="/Execution" element={<Execution />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Traceability" element={<Traceability />} />
                
                <Route path="/PublicReport" element={<PublicReport />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/SharedSteps" element={<SharedSteps />} />
                
                <Route path="/Workload" element={<Workload />} />
                
                <Route path="/Reviews" element={<Reviews />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/TestDataStore" element={<TestDataStore />} />
                
                <Route path="/Team" element={<Team />} />
                
                <Route path="/MindMap" element={<MindMap />} />
                
                <Route path="/AutomationAPI" element={<AutomationAPI />} />
                
                <Route path="/AuditLog" element={<AuditLog />} />
                
                <Route path="/Management" element={<Management />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}