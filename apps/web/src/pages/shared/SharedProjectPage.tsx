import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Share2, Grid, Scroll } from 'lucide-react';
import { Button } from '../../design-system/components';
import { useAuthStore } from '../../store/auth.store';
import styles from './SharedProjectPage.module.css';

interface SharedProject {
  id: string;
  title: string;
  description: string;
  genre: string;
  style: string;
  duration: number;
  script: string;
  keyframes: any[];
  videoClips: any[];
}

export function SharedProjectPage() {
  const { token } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedProject = async () => {
      try {
        const response = await axios.get(`/api/v1/projects/shared/${token}`);
        setProject(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Project not found or sharing is disabled');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedProject();
  }, [token]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading cinematic preview...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.error}>
        <h2>404</h2>
        <p>{error || 'This project link has expired or is invalid.'}</p>
        <Link to="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>🎬</div>
          <span className={styles.wordmark}>DirectorByte</span>
        </Link>
        <div className={styles.actions}>
          {isAuthenticated ? (
            <Link to={`/studio/${project.id}`}>
              <Button variant="primary">Open in Studio</Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button variant="primary">Create Your Own Film</Button>
            </Link>
          )}
        </div>
      </header>

      <main className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.meta}>
            <span className={styles.genre}>{project.genre}</span>
            <span className={styles.style}>{project.style}</span>
            <span className={styles.duration}>{project.duration}s</span>
          </div>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.description}>{project.description}</p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Scroll size={20} />
              <h3>Script Excerpt</h3>
            </div>
            <div className={styles.scriptPreview}>
              {project.script || 'No script generated yet.'}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Grid size={20} />
              <h3>Keyframes</h3>
            </div>
            {project.keyframes && project.keyframes.length > 0 ? (
              <div className={styles.keyframesGrid}>
                {project.keyframes.map((kf, i) => (
                  <div key={i} className={styles.keyframe}>
                    <img src={kf.url} alt={`Scene ${i + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No keyframes generated yet.</p>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Play size={20} />
              <h3>Video Clips</h3>
            </div>
            {project.videoClips && project.videoClips.length > 0 ? (
              <div className={styles.videoGrid}>
                {project.videoClips.map((clip, i) => (
                  <div key={i} className={styles.videoCard}>
                    <video src={clip.url} controls />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No video clips generated yet.</p>
            )}
          </section>
        </div>

        <div className={styles.footerCTA}>
          <h3>Want to turn your ideas into films?</h3>
          <p>Join 10,000+ creators using AI to revolutionize filmmaking.</p>
          <Link to="/signup">
            <Button size="lg" iconRight={<Share2 size={20} />}>Get Started for Free</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
