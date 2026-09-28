import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import {
    AppShell,
    Workspace,
} from "./App.styles.js";

import {
    Sidebar,
} from "./components/Sidebar/Sidebar.jsx";

import {
    ScannerPage,
} from "./pages/ScannerPage/ScannerPage.jsx";

import {
    CompaniesPage,
} from "./pages/CompaniesPage/CompaniesPage.jsx";

import {
    CampaignsPage,
} from "./pages/CampaignsPage/CampaignsPage.jsx";

import {
    HistoryPage,
} from "./pages/HistoryPage/HistoryPage.jsx";


const App = () => {
    return (
        <AppShell>
            <Sidebar />

            <Workspace>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ScannerPage />
                        }
                    />

                    <Route
                        path="/companies"
                        element={
                            <CompaniesPage />
                        }
                    />

                    <Route
                        path="/campaigns"
                        element={
                            <CampaignsPage />
                        }
                    />

                    <Route
                        path="/history"
                        element={
                            <HistoryPage />
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />
                </Routes>
            </Workspace>
        </AppShell>
    );
};


export default App;
