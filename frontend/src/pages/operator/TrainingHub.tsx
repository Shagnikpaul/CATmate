import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/apiService';
import type { TrainingModule, TrainingRecommendation } from '../../types';
import {
  GraduationCap,
  Play,
  Clock,
  Search,
  Filter,
  Zap,
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const TrainingHub: React.FC = () => {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<TrainingRecommendation | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<TrainingModule | null>(null);

  useEffect(() => {
    const loadTraining = async () => {
      const rec = await api.getTrainingRecommendations(user?.user_id || 'OP1001');
      setRecommendation(rec);
      const allMods = api.getAllTrainingModules();
      setModules(allMods);
    };

    loadTraining();
  }, [user]);

  const topics = ['all', 'braking', 'idling', 'fuel efficiency', 'safety'];

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || m.topic.toLowerCase() === selectedTopic.toLowerCase();
    return matchesSearch && matchesTopic;
  });

  const heroModule = recommendation?.recommended_modules?.[0] || modules[0];

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[#FFC300]" />
          <h1 className="font-industrial text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-primary">
            Operator Training &amp; Wellness Hub
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Micro-training modules nudged automatically by telemetry behavior flags and equipment safety rules.
        </p>
      </div>

      {/* Recommended Hero Module Card */}
      {heroModule && (
        <div className="bg-surface border-2 border-[#FFC300] rounded p-4 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs uppercase font-industrial font-bold text-[#E88C1F] mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Telemetry-Triggered Recommendation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Thumbnail */}
            <div className="md:col-span-5 relative rounded overflow-hidden aspect-video bg-black group border border-border">
              <img
                src={heroModule.thumbnail_url}
                alt={heroModule.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={() => setActiveVideo(heroModule)}
                  aria-label={`Play ${heroModule.title}`}
                  className="w-14 h-14 rounded-full bg-[#FFC300] text-[#211E1C] flex items-center justify-center shadow-lg hover:scale-110 transition"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-mono px-2 py-0.5 rounded font-bold">
                {heroModule.duration_sec}s
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3">
              <div>
                {/* Reason badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#E88C1F]/15 border border-[#E88C1F]/40 text-[#B86500] dark:text-[#F2A63D] text-xs font-bold uppercase mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    Reason: {heroModule.reason || '3 hard-braking events today (>0.45g)'}
                  </span>
                </div>

                <h2 className="font-industrial text-xl sm:text-2xl font-black uppercase text-text-primary tracking-tight">
                  {heroModule.title}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                  {heroModule.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveVideo(heroModule)}
                  className="btn-touch px-6 py-2.5 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-industrial font-black text-base uppercase tracking-wider flex items-center gap-2 transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Play Micro-Lesson ({heroModule.duration_sec}s)</span>
                </button>
                <span className="text-xs text-text-secondary font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Duration: {heroModule.duration_sec} seconds</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Catalog Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FFC300]" />
            <h2 className="font-industrial text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary">
              Full Module Library
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-9 pr-3 py-1.5 rounded bg-bg border border-border text-xs text-text-primary font-medium focus:outline-none focus:border-[#FFC300]"
            />
          </div>
        </div>

        {/* Topic Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-4 h-4 text-text-secondary shrink-0 mr-1" />
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1 rounded font-industrial font-bold uppercase tracking-wider text-xs whitespace-nowrap transition border ${
                selectedTopic === topic
                  ? 'bg-[#FFC300] text-[#211E1C] border-[#FFC300]'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Grid of Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
            <div
              key={mod.module_id}
              className="bg-surface border border-border hover:border-[#FFC300] rounded overflow-hidden flex flex-col justify-between group transition"
            >
              <div>
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={mod.thumbnail_url}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                    <button
                      onClick={() => setActiveVideo(mod)}
                      className="w-11 h-11 rounded-full bg-[#FFC300] text-[#211E1C] flex items-center justify-center opacity-90 group-hover:opacity-100 transition shadow"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                    {mod.duration_sec}s
                  </div>
                  <div className="absolute top-2 left-2 bg-[#FFC300] text-[#211E1C] text-[10px] font-industrial uppercase px-1.5 py-0.5 rounded font-bold">
                    {mod.topic}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-industrial text-lg font-bold uppercase tracking-tight text-text-primary group-hover:text-[#FFC300] transition line-clamp-1">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border/40 mt-auto flex items-center justify-between text-xs text-text-secondary font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {mod.duration_sec}s runtime
                </span>
                <button
                  onClick={() => setActiveVideo(mod)}
                  className="font-industrial font-bold uppercase text-[#FFC300] hover:underline"
                >
                  Watch Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-surface border-2 border-[#FFC300] rounded max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-industrial uppercase font-bold text-[#FFC300]">
                  Micro-Lesson • {activeVideo.topic}
                </span>
                <h3 className="font-industrial text-lg font-black uppercase text-text-primary">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="btn-touch p-2 rounded text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="aspect-video bg-black">
              <video
                src={activeVideo.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-bg flex items-center justify-between">
              <div className="text-xs text-text-secondary">
                Duration: <strong className="text-text-primary">{activeVideo.duration_sec}s</strong>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="btn-touch px-4 py-2 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-industrial font-bold uppercase text-xs"
              >
                Mark Lesson Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
