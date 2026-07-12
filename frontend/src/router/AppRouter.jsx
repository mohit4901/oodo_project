import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// Pages imports
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import VehicleRegistryPage from '../features/vehicle-registry/pages/VehicleRegistryPage.jsx';
import DriverSafetyProfilePage from '../features/driver-safety-profile/pages/DriverSafetyProfilePage.jsx';
import TripDispatcherPage from '../features/trip-dispatcher/pages/TripDispatcherPage.jsx';
import MaintenancePage from '../features/maintenance/pages/MaintenancePage.jsx';
import FuelExpensePage from '../features/fuel-expense-management/pages/FuelExpensePage.jsx';
import ReportsAnalysisPage from '../features/reports-analysis/pages/ReportsAnalysisPage.jsx';
import SettingsPage from '../features/settings-rbac/pages/SettingsPage.jsx';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated layout routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Index path redirects to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Feature pages */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          <Route 
            path="fleet" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']}>
                <VehicleRegistryPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="drivers" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']}>
                <DriverSafetyProfilePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="trips" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'dispatcher', 'driver', 'safety_officer', 'financial_analyst']}>
                <TripDispatcherPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="maintenance" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver']}>
                <MaintenancePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="expenses" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'dispatcher', 'financial_analyst', 'driver', 'safety_officer']}>
                <FuelExpensePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'financial_analyst', 'safety_officer', 'dispatcher']}>
                <ReportsAnalysisPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="settings" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']}>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
