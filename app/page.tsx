'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Sparkles, Target, Trophy, ArrowRight, CheckCircle2, ShieldCheck,
  Camera, Share2, FileText, Award, TrendingUp, Lock, Droplets, Sun, Activity,
  Database, AlertTriangle, Loader2, Copy, ExternalLink, Terminal, ShieldAlert,
  Instagram, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';

function WaitlistPortal({ userEmail }: { userEmail: string }) {
  const [streak, setStreak] = useState(2);
  const [pollDone, setPollDone] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [igFollowDone, setIgFollowDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rank: 12409, referrals: 0, total: 12408, invitedBy: '' });
  const [leaderboard, setLeaderboard] = useState<{ email: string; referrals: number; rank: number }[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${encodeURIComponent(userEmail)}`
    : `https://jildai.com/?ref=${encodeURIComponent(userEmail)}`;

  const maskEmail = (emailStr: string) => {
    const parts = emailStr.split('@');
    if (parts.length < 2) return emailStr;
    const local = parts[0];
    const domain = parts[1];
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const sqlSetupScript = `-- 1. Create waitlist table
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  referred_by text,
  referrals integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table waitlist enable row level security;

-- 3. Create active policies for public select, insert, and update
create policy "Allow public read access" on waitlist for select using (true);
create policy "Allow public insert" on waitlist for insert with check (true);
create policy "Allow public update" on waitlist for update using (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchWaitlistStats() {
      try {
        setLoading(true);

        const emailClean = userEmail.toLowerCase().trim();

        // Fetch current user row
        const { data: userRow, error: fetchErr } = await supabase
          .from('waitlist')
          .select('referrals, created_at, referred_by')
          .eq('email', emailClean)
          .maybeSingle();

        let refCount = 0;
        let createdAt = new Date().toISOString();
        let invitedByValVal = 'rarblowup@gmail.com';

        if (userRow) {
          refCount = userRow.referrals || 0;
          createdAt = userRow.created_at;
          invitedByValVal = userRow.referred_by || 'rarblowup@gmail.com';
        } else {
          // Attempt on-the-fly insert if missing
          const { data: insertedRow } = await supabase
            .from('waitlist')
            .insert([{ email: emailClean, referred_by: 'rarblowup@gmail.com' }])
            .select()
            .maybeSingle();
          if (insertedRow) {
            createdAt = insertedRow.created_at;
            invitedByValVal = insertedRow.referred_by || 'rarblowup@gmail.com';
          }
        }

        // Calculate dynamic rank: count of users with more referrals than current user,
        // or if referrals are equal, those who registered earlier (created_at < current user's created_at)
        const { count: rankCount } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .or(`referrals.gt.${refCount},and(referrals.eq.${refCount},created_at.lt.${createdAt})`);

        const currentRank = (rankCount !== null ? rankCount + 1 : 1);

        // Fetch total count
        const { count: totalCount } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true });

        setStats({
          rank: currentRank,
          referrals: refCount,
          total: totalCount || 1,
          invitedBy: invitedByValVal
        });

        // Fetch top 10 leaderboard
        const { data: topRows } = await supabase
          .from('waitlist')
          .select('email, referrals')
          .order('referrals', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(10);

        if (topRows) {
          const processed = topRows.map((row, idx) => ({
            email: maskEmail(row.email),
            referrals: row.referrals || 0,
            rank: idx + 1
          }));
          setLeaderboard(processed);
        }

        setIsDbConnected(true);
      } catch (err) {
        console.warn('Supabase not fully set up or offline. Reverting to local state.', err);
        setIsDbConnected(false);
        // Fallback simulator database so it fails gracefully & securely in AI Studio previews:
        setStats({
          rank: 12,
          referrals: 3,
          total: 12408,
          invitedBy: 'rarblowup@gmail.com'
        });
        setLeaderboard([
          { email: 'rar***@gmail.com', referrals: 24, rank: 1 },
          { email: 'sk***@hotmail.com', referrals: 18, rank: 2 },
          { email: 'co***@io.co', referrals: 15, rank: 3 },
          { email: 'ma***@gmail.com', referrals: 12, rank: 4 },
          { email: 'li***@me.com', referrals: 10, rank: 5 },
          { email: 'da***@gmail.com', referrals: 8, rank: 6 },
          { email: 'ph***@proton.me', referrals: 7, rank: 7 },
          { email: 'al***@yahoo.com', referrals: 5, rank: 8 },
          { email: 'th***@outlook.com', referrals: 4, rank: 9 },
          { email: 'an***@jild.ai', referrals: 3, rank: 10 }
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (userEmail) {
      fetchWaitlistStats();
    }
  }, [userEmail]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTask = (task: 'poll' | 'share' | 'instagram') => {
    if (task === 'poll' && !pollDone) {
      setPollDone(true);
      setStreak(prev => Math.min(prev + 1, 4));
    }
    if (task === 'share' && !shareDone) {
      setShareDone(true);
      setStreak(prev => Math.min(prev + 1, 4));
    }
    if (task === 'instagram' && !igFollowDone) {
      setIgFollowDone(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-24 space-y-16 z-10 relative"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/10">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Welcome to your Dashboard</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <p className="text-white/50">Your position: <span className="text-blue-400 font-mono font-bold">#{loading ? '...' : stats.rank}</span></p>
            <span className="text-white/20 hidden sm:inline">•</span>
            <p className="text-white/50">Referred By: <span className="text-white/80 font-mono text-xs">{loading ? '...' : stats.invitedBy}</span></p>
            <span className="text-white/20 hidden sm:inline">•</span>
            <p className="text-white/50">Total Invites: <span className="text-green-400 font-mono font-bold">{loading ? '...' : stats.referrals}</span></p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
           <Trophy className="w-5 h-5" />
           <span>Week {streak} Streak</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-white/40">Synchronizing database metrics...</p>
        </div>
      ) : (
        <>
          {/* Gamification / Streak */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold tracking-tight">Unlock Premium Status</h3>
                <span className="text-sm font-mono text-white/50 uppercase">4-Week Goal</span>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
               {[1, 2, 3, 4].map((week) => (
                 <div key={week} className={`p-6 rounded-2xl border ${streak >= week ? 'bg-blue-950/40 border-blue-500/30 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-black/50 border-white/5 opacity-50'} relative overflow-hidden transition-all duration-500`}>
                    {streak >= week && <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-xl rounded-full" />}
                    <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Week {week}</p>
                    {week === 4 && streak === 4 ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-blue-400"
                      >
                        <Award className="w-8 h-8 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <p className="font-bold">Unlocked JILDAIVIP</p>
                      </motion.div>
                    ) : streak >= week ? (
                      <div className="text-white">
                        <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                        <p className="font-bold">Completed</p>
                      </div>
                    ) : (
                      <div className="text-white/30">
                        <Lock className="w-8 h-8 mb-2" />
                        <p className="font-medium">Locked</p>
                      </div>
                    )}
                 </div>
               ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-4">
               <button 
                 onClick={() => handleTask('poll')}
                 disabled={pollDone}
                 className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${pollDone ? 'border-blue-500/20 bg-blue-500/5 text-blue-400 pointer-events-none' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer'}`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pollDone ? 'bg-blue-500/10' : 'bg-black/50'}`}>
                       <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="font-bold">Weekly Skin Poll</p>
                       <p className="text-sm opacity-60">Help refine custom routines (+1 Week)</p>
                    </div>
                 </div>
                 {pollDone ? <CheckCircle2 className="w-6 h-6 animate-bounce" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
               </button>

               <button 
                 onClick={() => handleTask('share')}
                 disabled={shareDone}
                 className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${shareDone ? 'border-blue-500/20 bg-blue-500/5 text-blue-400 pointer-events-none' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer'}`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${shareDone ? 'bg-blue-500/10' : 'bg-black/50'}`}>
                       <Share2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="font-bold">Share Waitlist</p>
                       <p className="text-sm opacity-60">Invite a friend (+1 Week)</p>
                    </div>
                 </div>
                 {shareDone ? <CheckCircle2 className="w-6 h-6 text-blue-400 animate-bounce" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
               </button>

               <a 
                 href="https://www.instagram.com/rarwithidk/"
                 target="_blank"
                 rel="noreferrer"
                 onClick={() => handleTask('instagram')}
                 className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${igFollowDone ? 'border-pink-500/20 bg-pink-500/5 text-pink-400 pointer-events-none' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer'}`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${igFollowDone ? 'bg-pink-500/10' : 'bg-black/50'}`}>
                       <Instagram className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="text-left">
                       <p className="font-bold">Follow on Instagram</p>
                       <p className="text-sm opacity-60">Receive live launch notifications</p>
                    </div>
                 </div>
                 {igFollowDone ? <CheckCircle2 className="w-6 h-6 text-pink-500 animate-bounce" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
               </a>
            </div>
          </section>

          {/* Referral Link & Share Section */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Your Referral Engine</h3>
                <p className="text-sm text-white/50 max-w-lg">Invite others to rise up the queue. The top referrers get lifetime premium status and immediate beta releases.</p>
              </div>
              <div className="w-full md:w-auto">
                <p className="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">My Exclusive Link</p>
                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-1.5 w-full md:w-[380px]">
                  <input 
                    readOnly
                    value={referralLink}
                    className="bg-transparent text-xs text-white/80 px-3 py-2 outline-none flex-1 truncate font-mono"
                  />
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-[0_2px_10px_rgba(59,130,246,0.2)]"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Live Leaders & Setup Guide Side-by-Side */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Top 10 Leaderboard */}
            <section className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real-time Rankings</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Top 10 Waitlist Referrers</h3>
                </div>
                <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5 text-xs text-white/40 font-bold">
                  {stats.total} Total Registered
                </div>
              </div>

              <div className="flex-1 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {leaderboard.map((user, idx) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;
                  const isCurrentUser = user.email.toLowerCase() === maskEmail(userEmail).toLowerCase() || (user.email === 'You');

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all ${
                        isCurrentUser 
                          ? 'bg-blue-500/10 border-blue-500/40 shadow-[inset_0_1px_30px_rgba(59,130,246,0.05)]' 
                          : 'bg-black/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
                          isGold ? 'bg-amber-500/20 text-yellow-400 border border-amber-500/30' :
                          isSilver ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                          isBronze ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {user.rank}
                        </span>
                        <p className={`text-sm font-medium ${isCurrentUser ? 'text-blue-200 font-semibold' : 'text-white/80'}`}>
                          {user.email} {isCurrentUser && <span className="text-[10px] uppercase font-bold text-blue-400 ml-1.5">(You)</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">invites</span>
                        <span className={`text-sm font-mono font-bold ${
                          isCurrentUser ? 'text-blue-400' :
                          isGold ? 'text-yellow-400' :
                          'text-white'
                        }`}>
                          {user.referrals}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Supabase Technical Database Guide */}
            <section className="lg:col-span-2 bg-[#0c0c0e]/80 border border-blue-500/10 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
              
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-[#a8aacc]/50 font-black">Supabase Engine</p>
                    <h3 className="text-xl font-bold text-white tracking-tight">Database Schema</h3>
                  </div>
                  {isDbConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse shadow-sm">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Live Synced
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold rounded-full">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      Fallback Mode
                    </span>
                  )}
                </div>

                {isDbConnected ? (
                  <div className="space-y-4">
                    <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-5 space-y-3">
                      <p className="text-xs text-green-300 font-medium leading-relaxed">
                        ✓ Your Supabase instance is connected successfully!
                      </p>
                      <p className="text-xs text-white/50">
                        Waitlist registrations are instantly saved and ranks are dynamic based on actual referral indices.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-medium text-white/50 flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <span>Schema: <span className="font-mono font-bold text-white/80">public.waitlist</span> is active.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 space-y-2">
                      <p className="text-xs text-yellow-300 font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        Supabase Table Setup Required!
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        To activate real SQL persistence, copy the schema script below and paste it in the <span className="font-bold text-white/80">SQL Editor</span> of your Supabase Workspace.
                      </p>
                    </div>

                    <div className="relative group">
                      <div className="absolute top-3 right-3 z-10">
                        <button 
                          onClick={handleCopySql}
                          className="p-2 bg-black/60 border border-white/10 rounded-lg hover:bg-black/90 active:scale-95 text-xs flex items-center gap-1.5 font-bold text-white"
                        >
                          {sqlCopied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-[10px] text-blue-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-black/60 border border-white/10 rounded-xl p-4 pt-10 text-[10px] font-mono text-white/60 max-h-[170px] overflow-y-auto leading-normal">
<pre>{sqlSetupScript}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white transition-colors"
                >
                  Supabase Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] font-mono text-white/20">v1.2 active</span>
              </div>
            </section>
          </div>
        </>
      )}

      {/* 3D App Mockups Section */}
      <section className="space-y-16 pt-16 border-t border-white/10">
         <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4 text-white">Experience Premium</h3>
            <p className="text-white/50 text-lg">A dynamic interface designed to adapt to your environment. Choose between the high-contrast Obsidian or immaculate Pearl themes.</p>
         </div>

         <div className="relative w-full h-[600px] flex items-center justify-center [perspective:2000px]">
            <motion.div
               animate={{ rotateY: [0, 360] }}
               transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
               className="relative w-[300px] sm:w-[340px] h-[600px] [transform-style:preserve-3d]"
            >
               {/* Dark Mockup */}
               <div className="absolute inset-0 bg-[#0a0a0a] border-4 border-neutral-800 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)] p-6 flex flex-col" style={{ transform: 'translateZ(180px)', backfaceVisibility: 'hidden' }}>
                  <div className="w-32 h-6 bg-black rounded-b-3xl mx-auto absolute top-0 left-1/2 -translate-x-1/2" />
                  <div className="mt-8 flex items-center justify-between">
                     <span className="font-bold text-lg">Obsidian</span>
                     <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-serif font-bold text-sm">J.</div>
                  </div>
                  <div className="mt-12 space-y-4">
                     <div className="h-32 rounded-3xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-4 flex flex-col justify-end">
                        <p className="text-xs font-mono text-white/50">Morning Routine</p>
                        <p className="font-bold">4 Steps</p>
                     </div>
                     <div className="h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center px-4 gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10"></div>
                        <div>
                          <p className="text-sm font-bold">Hydrating Serum</p>
                          <p className="text-xs text-white/50">Step 2</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1 h-32 rounded-3xl bg-blue-500/10 border border-blue-500/20 p-4 flex flex-col justify-end">
                           <p className="text-xs font-mono text-blue-400 uppercase font-bold">Streak</p>
                           <p className="font-bold text-blue-400 text-2xl">24d</p>
                        </div>
                        <div className="flex-1 h-32 rounded-3xl bg-white/5 border border-white/5"></div>
                     </div>
                  </div>
               </div>

               {/* Light Mockup */}
               <div className="absolute inset-0 bg-[#FAFAFA] border-4 border-neutral-200 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.8)] p-6 flex flex-col text-black" style={{ transform: 'rotateY(180deg) translateZ(180px)', backfaceVisibility: 'hidden' }}>
                  <div className="w-32 h-6 bg-neutral-200 rounded-b-3xl mx-auto absolute top-0 left-1/2 -translate-x-1/2" />
                  <div className="mt-8 flex items-center justify-between">
                     <span className="font-bold text-lg text-black">Pearl</span>
                     <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-serif font-bold text-sm">J.</div>
                  </div>
                  <div className="mt-12 space-y-4">
                     <div className="h-32 rounded-3xl bg-gradient-to-b from-black/5 to-transparent border border-black/5 p-4 flex flex-col justify-end">
                        <p className="text-xs font-mono text-black/50">Evening Routine</p>
                        <p className="font-bold">5 Steps</p>
                     </div>
                     <div className="h-20 rounded-3xl bg-white border border-black/5 flex items-center px-4 gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-black/5"></div>
                        <div>
                          <p className="text-sm font-bold">Retinol Cream</p>
                          <p className="text-xs text-black/50">Step 3</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1 h-32 rounded-3xl bg-black border border-black p-4 flex flex-col justify-end text-white">
                           <p className="text-xs font-mono text-white/50 uppercase">Clarity</p>
                           <p className="font-bold text-2xl">98%</p>
                        </div>
                        <div className="flex-1 h-32 rounded-3xl bg-white border border-black/5 shadow-sm"></div>
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>
    </motion.div>
  );
}

const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'getairmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'temp-mail.io',
  'fakeinbox.com',
  'generator.email',
  'maildrop.cc',
  'disposable.com'
];

const getEmailDomain = (emailStr: string) => {
  const parts = emailStr.split('@');
  return parts.length > 1 ? parts[1].toLowerCase().trim() : '';
};

const isValidEmailFormat = (emailStr: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(emailStr);
};

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [inviterEmail, setInviterEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [popupCopied, setPopupCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      setInviterEmail(refParam || 'rarblowup@gmail.com');
      const savedEmail = localStorage.getItem('jildai_user_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setIsSubmitted(true);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchCount() {
      try {
        const cached = localStorage.getItem('jildai_total_count');
        if (cached) {
          setTotalCount(parseInt(cached, 10));
        }
        const { count } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true });
        if (count !== null) {
          setTotalCount(count);
          localStorage.setItem('jildai_total_count', String(count));
        }
      } catch {
        setTotalCount(prev => prev === null ? 0 : prev);
      }
    }
    fetchCount();
  }, []);

  const handlePopupCopy = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${encodeURIComponent(email)}` : `https://jildai.com/?ref=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(link);
    setPopupCopied(true);
    setTimeout(() => setPopupCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setIsSubmitting(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmailFormat(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    const domain = getEmailDomain(trimmedEmail);
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      setEmailError('Temporary or disposable emails are not permitted.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Check if user already exists
      const { data: existingUser } = await supabase
        .from('waitlist')
        .select('email, referred_by')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existingUser) {
        // User already in waitlist - direct login
        localStorage.setItem('jildai_user_email', trimmedEmail);
        setIsSubmitted(true);
        setShowPopup(true);
        setIsSubmitting(false);
        return;
      }

      // 2. Insert new user into waitlist
      const cleanInviter = inviterEmail.trim().toLowerCase();
      const hasReferrer = cleanInviter && isValidEmailFormat(cleanInviter) && (cleanInviter !== trimmedEmail);
      const chosenInviter = hasReferrer ? cleanInviter : 'rarblowup@gmail.com';

      const { error: insertErr } = await supabase
        .from('waitlist')
        .insert([{
          email: trimmedEmail,
          referred_by: chosenInviter
        }]);

      if (insertErr) {
        throw insertErr;
      }

      // 3. Increment referral count for referrer
      const { data: referrerData } = await supabase
        .from('waitlist')
        .select('referrals')
        .eq('email', chosenInviter)
        .maybeSingle();

      if (referrerData) {
        await supabase
          .from('waitlist')
          .update({ referrals: (referrerData.referrals || 0) + 1 })
          .eq('email', chosenInviter);
      } else {
        // Create on-the-fly referrer record if they didn't exist
        await supabase
          .from('waitlist')
          .insert([{
            email: chosenInviter,
            referred_by: 'rarblowup@gmail.com',
            referrals: 1
          }]);
      }

      localStorage.setItem('jildai_user_email', trimmedEmail);
      setIsSubmitted(true);
      setShowPopup(true);
    } catch (err) {
      console.warn('Supabase not configured or table missing. Using offline memory state.', err);
      // Fails gracefully in offline/unprovisioned AI studio workflows
      localStorage.setItem('jildai_user_email', trimmedEmail);
      setIsSubmitted(true);
      setShowPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const featureCards = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Precision Personalization',
      description: 'Your unique skin profile meets state-of-the-art matching algorithms. Get dynamic routines that evolve as your skin changes.',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Interactive Tracking',
      description: 'Visualize your progress in real-time with stunning 3D analytics dashboard and skin health metrics.',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Monthly Rewards',
      description: 'Build your streak, unlock premium tiers, and earn exclusive skincare rewards every month.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden text-white flex flex-col font-sans" style={{ background: 'radial-gradient(circle at 50% 50%, #111111 0%, #050505 100%)' }}>
      {/* Background elegant lighting effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full flex items-center justify-between px-6 lg:px-12 py-8 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsSubmitted(false)}
        >
          <div className="w-10 h-10 rounded-lg relative overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
             <Image src="/212.png" alt="JildAI Logo" fill className="object-cover p-1" />
          </div>
          <span className="text-2xl font-bold tracking-tighter">JildAI</span>
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: 'easeOut' }}
           className="flex items-center gap-6 text-sm font-medium text-white/50"
        >
          <span className="tracking-widest uppercase hidden sm:inline-block">Invite Only</span>
          {isSubmitted && (
            <button 
              onClick={() => {
                localStorage.removeItem('jildai_user_email');
                setEmail('');
                setIsSubmitted(false);
              }}
              className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-all border border-red-500/10 hover:border-red-500/30 bg-red-500/5 px-3.5 py-2 rounded-xl cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </motion.div>
      </nav>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col flex-1"
          >
            {/* Hero Section */}
            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center w-full px-6 lg:px-12 py-12 lg:py-24 z-10">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center w-full max-w-7xl mx-auto">
                
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-start text-left lg:pr-12 space-y-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest uppercase text-white/60 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    <span>Premium Access Opening Soon</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight drop-shadow-xl">
                    Flawless skin, <br />
                    <span className="text-white/40">engineered.</span>
                  </h1>
                  
                  <p className="text-lg text-white/60 max-w-md">
                    Experience the world&apos;s first personalized, data-driven skincare ecosystem. Gamified routines, microscopic progress tracking, and precision recommendations.
                  </p>

                  <form suppressHydrationWarning onSubmit={handleSubmit} className="w-full max-w-md relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-white/5 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative flex flex-col bg-[#0a0a0a] border border-white/10 rounded-xl p-2 dropdown-shadow gap-2">
                      <input 
                        suppressHydrationWarning
                        type="email" 
                        name="email"
                        autoComplete="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 outline-none text-white placeholder-white/30 font-light focus:border-blue-500/50 transition-colors"
                      />
                      <div className="flex gap-2">
                        <input 
                          suppressHydrationWarning
                          type="text" 
                          name="invited_by"
                          autoComplete="off"
                          placeholder="Invited by? Enter their email (optional)"
                          value={inviterEmail}
                          onChange={(e) => setInviterEmail(e.target.value)}
                          className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-white/30 font-light text-sm"
                        />
                        <button 
                          suppressHydrationWarning
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Joining...</span>
                            </>
                          ) : (
                            <>
                              <span>Join</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {emailError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg flex items-center gap-2 w-full max-w-md"
                    >
                      <span className="text-sm">⚠</span>
                      <span>{emailError}</span>
                    </motion.div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-blue-400 font-medium bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
                     <Award className="w-4 h-4 text-blue-400" />
                     <span>The top inviters get free lifetime premium access.</span>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full border-2 border-black bg-neutral-600 flex items-center justify-center text-xs shadow-md">J1</div>
                      <div className="w-10 h-10 rounded-full border-2 border-black bg-neutral-500 flex items-center justify-center text-xs shadow-md">A2</div>
                      <div className="w-10 h-10 rounded-full border-2 border-black bg-neutral-400 flex items-center justify-center text-xs shadow-md">X3</div>
                    </div>
                    {totalCount !== null && totalCount > 0 && (
                      <span className="text-sm text-white/40">
                        <span className="text-white font-bold">{totalCount.toLocaleString()}</span> innovators joined already
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-white/40 text-sm font-light">
                     <ShieldCheck className="w-4 h-4" />
                     <span>Secure waitlist. No spam, ever.</span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="w-full flex justify-center items-center relative py-12 lg:py-0"
                >
                  {/* Premium 3D Routine Card */}
                  <motion.div 
                     animate={{ 
                       rotateY: [-3, 3, -3],
                       rotateX: [3, -3, 3]
                     }}
                     transition={{ 
                       duration: 12, 
                       repeat: Infinity,
                       ease: "linear"
                     }}
                     className="relative w-full max-w-[400px] h-[500px] bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(255,255,255,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)] flex flex-col p-8 text-black transform lg:-rotate-3 hover:rotate-0 transition-transform duration-500 [transform-style:preserve-3d]"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Analysis v1.02</p>
                        <h3 className="text-3xl font-bold mt-1 tracking-tight">Routine</h3>
                      </div>
                      <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="mt-12 space-y-4 flex-1">
                      <div className="bg-black/5 p-4 rounded-2xl flex items-center justify-between border border-black/5">
                        <div>
                          <p className="text-xs font-bold opacity-50 uppercase">AM Step 01</p>
                          <p className="font-bold">Hydrating Cleanser</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      </div>
                      <div className="bg-black/5 p-4 rounded-2xl flex items-center justify-between opacity-50">
                        <div>
                          <p className="text-xs font-bold opacity-50 uppercase">AM Step 02</p>
                          <p className="font-bold">Niacinamide Serum</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-black/20"></div>
                      </div>
                      <div className="bg-black/5 p-4 rounded-2xl flex items-center justify-between opacity-50">
                        <div>
                          <p className="text-xs font-bold opacity-50 uppercase">AM Step 03</p>
                          <p className="font-bold">Broad Spectrum SPF</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-black/20"></div>
                      </div>
                    </div>

                    {/* Streak Reward UI */}
                    <div className="mt-auto pt-4">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Current Streak</p>
                          <p className="text-4xl font-black">24 Days</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-black/30">Next Reward</p>
                          <p className="text-sm font-bold">Premium Sample</p>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '80%' }}
                          transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                          className="h-full bg-black rounded-full" 
                        />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Floating Interactive Badge */}
                  <div className="hidden lg:flex absolute top-4 right-2 bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-6 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.3)] transform rotate-12 flex-col items-center justify-center border-4 border-[#050505] z-20">
                    <p className="text-3xl font-black text-center leading-none mb-1">TOP</p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-center">Get Lifetime<br/>Free Access</p>
                  </div>
                </motion.div>
              </div>
            </main>

            {/* Features Section */}
            <section className="w-full border-t border-white/10 bg-black/50 backdrop-blur-xl relative z-10 py-24">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight drop-shadow-md">Precision meets Progression</h2>
                  <p className="text-white/50 max-w-2xl mx-auto font-light">Join the waitlist to secure your spot for a transformative skincare experience backed by data, advanced science, and elite rewards.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {featureCards.map((card, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-500 group shadow-lg"
                    >
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500">
                        {card.icon}
                      </div>
                      <h3 className="text-xl font-medium mb-3">{card.title}</h3>
                      <p className="text-white/50 font-light leading-relaxed text-sm">
                        {card.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <WaitlistPortal key="portal" userEmail={email} />
        )}
      </AnimatePresence>

      {/* Unified Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowPopup(false)}
            />
            
            {/* Modal card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative w-full max-w-md bg-[#0c0c0e] border border-blue-500/20 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden z-20"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Success icon / badge */}
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight mb-3 text-white">
                You&apos;re in the waitlist!
              </h3>
              
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                We have successfully reserved your spot in JildAI. We will notify you as soon as early access opens.
              </p>

              {/* Specific Security Directive Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl p-5 mb-6 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#ffd366]">Security Directive & Updates</p>
                    <p className="text-xs text-[#ffeabd] leading-normal font-medium">
                      You are in the waitlist. Protect your account and stay connected with these essential steps:
                    </p>
                  </div>
                </div>

                <div className="border-t border-amber-500/20 pt-3 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-[#ffeabd] leading-normal font-medium">
                    <Instagram className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Follow us on Instagram <a href="https://www.instagram.com/rarwithidk/" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline font-bold">@rarwithidk</a> where we will announce as soon as the app goes live.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-[#ffeabd] leading-normal font-medium">
                    <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>
                      All official notifications will come exclusively from <strong className="text-white">rarblowup@gmail.com</strong>. Do not trust or respond to any emails from other addresses claiming to represent us—protect yourself from scams.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 text-left space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Your Invitation Link</p>
                  <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-1">
                    <input 
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${encodeURIComponent(email)}` : `https://jildai.com/?ref=${encodeURIComponent(email)}`}
                      className="bg-transparent text-[11px] text-white/80 px-2.5 py-1.5 outline-none flex-1 truncate font-mono"
                    />
                    <button 
                      onClick={handlePopupCopy}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      {popupCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Next Steps</p>
                  <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      Complete weekly polls to boost your rank
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      Share your waitlist link for exclusive perks
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowPopup(false)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 px-6 lg:px-12 py-10 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-white/30 text-xs font-medium space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} JildAI. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
