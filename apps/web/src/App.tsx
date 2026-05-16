import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { PlusCircle, Film } from 'lucide-react';
import { queryClient } from './lib/queryClient';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider, ToastViewport } from './design-system/components/Toast/Toast';
import { Button, Card, Badge, Input, Stat, ProgressBar } from './design-system/components';

const DashboardDemo = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-bold">Good morning, Director</h2>
        <p className="text-muted">Here is what's happening with your projects today.</p>
      </div>
      <Button iconLeft={<PlusCircle size={18} />}>Create New Project</Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card hoverable>
        <Stat 
          label="Active Projects" 
          value="12" 
          delta={{ value: 15, isUp: true, label: 'vs last month' }} 
        />
        <Badge variant="success" size="sm" className="mt-4">+2 this week</Badge>
      </Card>
      <Card hoverable>
        <Stat 
          label="Credits Remaining" 
          value="1,240" 
        />
        <Badge variant="brand" size="sm" className="mt-4">Pro Plan</Badge>
      </Card>
      <Card hoverable>
        <Stat 
          label="Storage Used" 
          value="4.2 GB" 
        />
        <ProgressBar value={42} size="sm" className="mt-4" />
      </Card>
    </div>

    <Card header={<h3 className="text-lg font-bold">Recent Generations</h3>}>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-surface-300 flex items-center justify-center">
                <Film size={20} className="text-brand-400" />
              </div>
              <div>
                <p className="font-medium">Cyberpunk Cityscape #{i}</p>
                <p className="text-xs text-hint">Video Gen • 5s • Gen-3 Alpha</p>
              </div>
            </div>
            <Badge variant="success">Completed</Badge>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardDemo />} />
              <Route path="*" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Coming Soon</h2><p className="text-muted">This page is under construction.</p></div>} />
            </Routes>
          </AppLayout>
        </Router>
        <ToastViewport />
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
