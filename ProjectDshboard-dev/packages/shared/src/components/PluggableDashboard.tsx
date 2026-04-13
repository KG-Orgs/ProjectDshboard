/**
 * Pluggable Dashboard Component
 * 
 * Dynamically renders feature tiles based on enabled features
 */

import React, { useEffect, useState } from 'react';
import { getFeatureRegistry, DashboardFeatureState } from '@shared/features';

interface PluggableDashboardProps {
  projectId: string;
  isAdmin?: boolean;
  onFeatureClick?: (featureId: string) => void;
}

const PluggableDashboard: React.FC<PluggableDashboardProps> = ({
  projectId,
  isAdmin = false,
  onFeatureClick,
}) => {
  const [features, setFeatures] = useState<DashboardFeatureState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectFeatures();
  }, [projectId]);

  const fetchProjectFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/features`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch features');
      }

      // Only show enabled features to users, show all to admins
      const shapedFeatures = data.data.allFeatures || data.data.features || [];
      setFeatures(
        isAdmin
          ? shapedFeatures
          : shapedFeatures.filter((f: any) => f.enabled)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching features:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureTile = (feature: DashboardFeatureState) => {
    const registry = getFeatureRegistry();
    const module = registry.get(feature.feature.id);

    if (!module) {
      // Fallback tile if module not found
      return (
        <div
          key={feature.feature.id}
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#f5f5f5',
            opacity: 0.5,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#999' }}>
            {feature.feature.name} (Not Installed)
          </div>
        </div>
      );
    }

    // Render the module's dashboard icon component
    return (
      <div
        key={feature.feature.id}
        onClick={() => {
          if (onFeatureClick) {
            onFeatureClick(feature.feature.id);
          }
        }}
        style={{
          cursor: 'pointer',
          opacity: feature.enabled ? 1 : 0.6,
          position: 'relative',
        }}
      >
        <module.DashboardIcon projectId={projectId} />

        {isAdmin && !feature.enabled && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#ff9800',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            ⊘
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading features...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Feature Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {features
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(renderFeatureTile)}

        {/* Admin "Add Feature" Tile */}
        {isAdmin && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#e8f5e9',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100px',
              border: '2px dashed #4caf50',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>+</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Add Feature</div>
          </div>
        )}
      </div>

      {/* Disabled Features Warning (Admin Only) */}
      {isAdmin && features.some((f) => !f.enabled) && (
        <div
          style={{
            backgroundColor: '#fff3cd',
            borderLeft: '4px solid #ffc107',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          <strong>Admin Note:</strong> {features.filter((f) => !f.enabled).length} feature(s)
          disabled.
        </div>
      )}
    </div>
  );
};

export default PluggableDashboard;

/**
 * Hook for managing feature state in components
 */
export const useDashboardFeatures = (projectId: string) => {
  const [features, setFeatures] = useState<DashboardFeatureState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/features`
        );
        const data = await response.json();
        if (data.success) {
          setFeatures(data.data.features || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [projectId]);

  const enableFeature = async (featureId: string, config?: Record<string, any>) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/features/${featureId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true, config }),
        }
      );
      const data = await response.json();
      if (data.success) {
        // Refresh features
        const featured = await fetch(`/api/projects/${projectId}/features`);
        const newData = await featured.json();
        setFeatures(newData.data.features || []);
      }
    } catch (error) {
      console.error('Error enabling feature:', error);
    }
  };

  const disableFeature = async (featureId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/features/${featureId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
        }
      );
      const data = await response.json();
      if (data.success) {
        // Refresh features
        const featured = await fetch(`/api/projects/${projectId}/features`);
        const newData = await featured.json();
        setFeatures(newData.data.features || []);
      }
    } catch (error) {
      console.error('Error disabling feature:', error);
    }
  };

  return {
    features,
    loading,
    enableFeature,
    disableFeature,
  };
};
