import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import MapPage from "./pages/MapPage";
import AboutUsPage from "./pages/AboutUsPage";
import AnalysisPage from "./pages/AnalysisPage";
import ContactUs from "./pages/ContactUs";
import WardrivingGamePage from "./pages/WardrivingGamePage";
import GameDashboardPage from "./pages/admin/GameDashboardPage";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashBoard from "./pages/admin/AdminDashBoard";
import AdminUploadPage from "./pages/admin/AdminUploadPage";
import AdminAnalysisPage from "./pages/admin/AdminAnalysisPage";
import AdminMapPage from "./pages/admin/AdminMapPage";
import Layout from "./layouts/Layout";
import { WiFiDataProvider } from "./context/WiFiDataContext";
import "./index.css";

// You'll need to create these components for the nested routes when uncommented
// import DashboardContent from "./pages/admin/DashboardContent";
// import ProcessCSVKML from "./pages/admin/ProcessCSVKML";
// import ProcessMerge from "./pages/admin/ProcessMerge";
import MessagingPage from "./pages/admin/MessagingPage";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WiFiDataProvider>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/game" element={<WardrivingGamePage />} />
          <Route path="/game_dashboard" element={<GameDashboardPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes - All nested routes require admin authentication */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashBoard />
              </PrivateRoute>
            }
          >
            {/* Admin Upload Page - handles file uploads for wardriving data */}
            <Route path="upload" element={<AdminUploadPage />} />

            {/* Admin Analysis Page - displays analysis charts for admin */}
            <Route path="analysis" element={<AdminAnalysisPage />} />

            <Route path="map" element={<AdminMapPage />} />

            {/* Dashboard main content - overview/home page for admin panel */}
            {/* <Route path="dashboard" element={<DashboardContent />} /> */}

            {/* File processing routes - handle CSV and KML data processing */}
            {/* <Route path="process/csv-kml" element={<ProcessCSVKML />} />
            <Route path="process/merge" element={<ProcessMerge />} /> */}

            {/* Messaging system - admin communication features */}
            <Route path="messaging" element={<MessagingPage />} />q
          </Route>
        </Routes>
      </Layout>
      </WiFiDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);