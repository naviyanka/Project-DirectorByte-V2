import React, { useEffect, useState } from 'react';

interface SharedProject {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  genre: string | null;
  style: string | null;
  currentStage: string;
}

// In a real Vite app with React Router, this would be a route component.
// It fetches the project using the token from the URL params.
export const SharedProjectPage: React.FC<{ token: string }> = ({ token }) => {
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/v1/projects/shared/${token}`);
        if (!response.ok) {
          throw new Error('Project not found or sharing is disabled.');
        }
        const data = await response.json();
        setProject(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center">
        <div className="animate-pulse text-[#8B5CF6]">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400">{error || 'Could not load project.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.title} className="w-full h-64 object-cover rounded-xl shadow-lg border border-gray-800" />
        ) : (
          <div className="w-full h-64 bg-gray-900 rounded-xl shadow-lg flex items-center justify-center border border-gray-800">
            <span className="text-gray-600">No Thumbnail Available</span>
          </div>
        )}
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">{project.title}</h1>
          {project.description && (
            <p className="text-lg text-gray-400">{project.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          {project.genre && (
            <span className="px-4 py-2 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full text-sm font-medium border border-[#8B5CF6]/20">
              {project.genre}
            </span>
          )}
          {project.style && (
            <span className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
              {project.style}
            </span>
          )}
          <span className="px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
            Stage: {project.currentStage}
          </span>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            Powered by <span className="text-[#8B5CF6] font-semibold">DirectorByte</span>
          </p>
        </div>
      </div>
    </div>
  );
};
