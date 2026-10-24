import React, { useState, useEffect } from 'react';
import { Shipment } from './types';
import { getStoredShipments, saveStoredShipments, INITIAL_SHIPMENTS } from './data/defaultShipments';
import { fetchShipmentsFromSupabase, upsertShipmentToSupabase } from './services/supabase';
import { TrackingView } from './components/TrackingView';
import { AdminPortal } from './components/AdminPortal';

export default function App() {
  const [shipments, setShipments] = useState<Shipment[]>(() => getStoredShipments());
  const [targetTrackingCode, setTargetTrackingCode] = useState<string>('');

  // Initial cloud sync from Supabase if configured
  useEffect(() => {
    let isMounted = true;
    async function loadCloudShipments() {
      try {
        const cloudData = await fetchShipmentsFromSupabase();
        if (cloudData && cloudData.length > 0 && isMounted) {
          setShipments(cloudData);
          saveStoredShipments(cloudData);
        }
      } catch (err) {
        console.warn('Auto Supabase sync notice:', err);
      }
    }
    loadCloudShipments();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if current path or hash matches /adminquanly
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    return (
      path === '/adminquanly' ||
      path.endsWith('/adminquanly') ||
      path.endsWith('/adminquanly/') ||
      hash === '#adminquanly' ||
      hash === '#/adminquanly' ||
      search.includes('adminquanly')
    );
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(checkIsAdminRoute);

  // Listen to browser navigation (back/forward, URL changes)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Optional keyboard shortcut for testing: Ctrl + Shift + A to jump to /adminquanly
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        navigateToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateToAdmin = () => {
    try {
      window.history.pushState(null, '', '/adminquanly');
    } catch {
      window.location.hash = '#adminquanly';
    }
    setIsAdminView(true);
  };

  const navigateToCustomer = (code?: string) => {
    try {
      window.history.pushState(null, '', '/');
    } catch {
      window.location.hash = '';
    }
    if (code) {
      setTargetTrackingCode(code);
    }
    setIsAdminView(false);
  };

  const handleSaveShipments = (updated: Shipment[]) => {
    setShipments(updated);
    saveStoredShipments(updated);
  };

  const handleResetShipments = () => {
    setShipments(INITIAL_SHIPMENTS);
    saveStoredShipments(INITIAL_SHIPMENTS);
  };

  if (isAdminView) {
    return (
      <AdminPortal
        shipments={shipments}
        onSaveShipments={handleSaveShipments}
        onResetShipments={handleResetShipments}
        onGoToCustomerTracking={(code) => navigateToCustomer(code)}
      />
    );
  }

  return (
    <TrackingView
      shipments={shipments}
      initialTrackingCode={targetTrackingCode || ''}
      onCodeSearched={(code) => setTargetTrackingCode(code)}
    />
  );
}
