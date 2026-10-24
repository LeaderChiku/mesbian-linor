'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_CMS_CONTENT, type CmsFields } from '@/lib/cms';

interface AdminCmsPanelProps {
  cmsData?: Record<string, string>;
  onCmsUpdated?: () => void;
}

export default function AdminCmsPanel({ cmsData, onCmsUpdated }: AdminCmsPanelProps) {
  const [form, setForm] = useState<CmsFields>(() => ({
    ...DEFAULT_CMS_CONTENT,
    ...(cmsData as unknown as Partial<CmsFields>),
  }));
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (cmsData) {
      setForm((prev) => ({
        ...prev,
        ...(cmsData as unknown as Partial<CmsFields>),
      }));
    }
  }, [cmsData]);

  const handleChange = (key: keyof CmsFields, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: 'CMS content updated successfully!' });
        if (onCmsUpdated) onCmsUpdated();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to save changes' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving CMS content' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all content fields to default text?')) {
      setForm({ ...DEFAULT_CMS_CONTENT });
    }
  };

  return (
    <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
            Content Management System (CMS)
          </span>
          <h2 className="font-serif text-2xl text-cream-100">Edit Story Texts & Wishes</h2>
          <p className="text-xs text-stone-400 mt-1">
            Customize all visitor-facing text, letters, ending wishes, and declaration without writing code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-700 transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Content'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            statusMsg.type === 'success'
              ? 'bg-pistachio-950/70 border-pistachio-800 text-pistachio-200'
              : 'bg-blush-950/70 border-blush-800 text-blush-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── 1. Hero & Welcome ── */}
        <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800/80 flex flex-col gap-4">
          <h3 className="font-serif text-base text-cream-100 flex items-center gap-2">
            <span>🌿</span>
            <span>Hero & Welcome Header</span>
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Botanical Crest Label</label>
            <input
              type="text"
              value={form.heroDedication}
              onChange={(e) => handleChange('heroDedication', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Story Title</label>
            <input
              type="text"
              value={form.heroTitle}
              onChange={(e) => handleChange('heroTitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Welcome Description</label>
            <textarea
              rows={3}
              value={form.heroWelcomeText}
              onChange={(e) => handleChange('heroWelcomeText', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Ready to Begin Button Label</label>
            <input
              type="text"
              value={form.readyToBeginLabel}
              onChange={(e) => handleChange('readyToBeginLabel', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>
        </div>

        {/* ── 2. Story Letter ── */}
        <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800/80 flex flex-col gap-4">
          <h3 className="font-serif text-base text-cream-100 flex items-center gap-2">
            <span>📜</span>
            <span>Parchment Story Letter</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-stone-400">Letter Title</label>
              <input
                type="text"
                value={form.letterTitle}
                onChange={(e) => handleChange('letterTitle', e.target.value)}
                className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-stone-400">Letter Date / Dedication</label>
              <input
                type="text"
                value={form.letterDate}
                onChange={(e) => handleChange('letterDate', e.target.value)}
                className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Salutation</label>
            <input
              type="text"
              value={form.letterSalutation}
              onChange={(e) => handleChange('letterSalutation', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Paragraph 1</label>
            <textarea
              rows={2}
              value={form.letterParagraph1}
              onChange={(e) => handleChange('letterParagraph1', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Paragraph 2</label>
            <textarea
              rows={2}
              value={form.letterParagraph2}
              onChange={(e) => handleChange('letterParagraph2', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Paragraph 3</label>
            <textarea
              rows={2}
              value={form.letterParagraph3}
              onChange={(e) => handleChange('letterParagraph3', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-stone-400">Signature</label>
            <input
              type="text"
              value={form.letterSignature}
              onChange={(e) => handleChange('letterSignature', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>
        </div>

        {/* ── 3. Four Categories Titles & Descriptions ── */}
        <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800/80 flex flex-col gap-4">
          <h3 className="font-serif text-base text-cream-100 flex items-center gap-2">
            <span>📷</span>
            <span>Category Descriptions</span>
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-amber-300 font-semibold">1. The Golden Hour</label>
            <input
              type="text"
              placeholder="Title"
              value={form.catGoldenHourTitle}
              onChange={(e) => handleChange('catGoldenHourTitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500 mb-1"
            />
            <input
              type="text"
              placeholder="Caption / Subtitle"
              value={form.catGoldenHourDesc}
              onChange={(e) => handleChange('catGoldenHourDesc', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-rose-300 font-semibold">2. Late Night Queues</label>
            <input
              type="text"
              placeholder="Title"
              value={form.catLateNightTitle}
              onChange={(e) => handleChange('catLateNightTitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500 mb-1"
            />
            <input
              type="text"
              placeholder="Caption / Subtitle"
              value={form.catLateNightDesc}
              onChange={(e) => handleChange('catLateNightDesc', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-pistachio-300 font-semibold">3. Our Little World</label>
            <input
              type="text"
              placeholder="Title"
              value={form.catOurWorldTitle}
              onChange={(e) => handleChange('catOurWorldTitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500 mb-1"
            />
            <input
              type="text"
              placeholder="Caption / Subtitle"
              value={form.catOurWorldDesc}
              onChange={(e) => handleChange('catOurWorldDesc', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-blush-300 font-semibold">4. Folded Whispers</label>
            <input
              type="text"
              placeholder="Title"
              value={form.catFoldedWhispersTitle}
              onChange={(e) => handleChange('catFoldedWhispersTitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500 mb-1"
            />
            <input
              type="text"
              placeholder="Caption / Subtitle"
              value={form.catFoldedWhispersDesc}
              onChange={(e) => handleChange('catFoldedWhispersDesc', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>
        </div>

        {/* ── 4. Endings & Romantic Twist Wishes ── */}
        <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800/80 flex flex-col gap-4">
          <h3 className="font-serif text-base text-cream-100 flex items-center gap-2">
            <span>✨</span>
            <span>Endings & Romantic Twist</span>
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-pistachio-400 font-semibold">Ending A 11:11 Wish</label>
            <input
              type="text"
              value={form.endingAWish}
              onChange={(e) => handleChange('endingAWish', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-blush-400 font-semibold">Ending B 11:11 Wish</label>
            <input
              type="text"
              value={form.endingBWish}
              onChange={(e) => handleChange('endingBWish', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-amber-400 font-semibold">Ending C 11:11 Wish</label>
            <input
              type="text"
              value={form.endingCWish}
              onChange={(e) => handleChange('endingCWish', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-rose-300 font-semibold">Romantic Twist Title & Subtitle</label>
            <input
              type="text"
              placeholder="Twist Title"
              value={form.twistTitle}
              onChange={(e) => handleChange('twistTitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500 mb-1"
            />
            <input
              type="text"
              placeholder="Twist Subtitle"
              value={form.twistSubtitle}
              onChange={(e) => handleChange('twistSubtitle', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-rose-300 font-semibold">Romantic Declaration Message</label>
            <textarea
              rows={3}
              value={form.twistDeclaration}
              onChange={(e) => handleChange('twistDeclaration', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
            <label className="text-[11px] text-rose-300 font-semibold">Romantic Twist 11:11 Wish</label>
            <input
              type="text"
              value={form.twistWish}
              onChange={(e) => handleChange('twistWish', e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
