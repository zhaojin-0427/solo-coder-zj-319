import React, { useEffect, useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import type { MemberProfile, TasteLevel, AllergenType, HealthPriority } from '../types';
import { memberApi } from '../lib/api';

const TASTE_LEVELS: { value: TasteLevel; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'mild', label: '轻' },
  { value: 'medium', label: '中' },
  { value: 'strong', label: '重' },
];

const ALLERGEN_TYPES: { value: AllergenType; label: string }[] = [
  { value: 'peanut', label: '花生' },
  { value: 'tree-nut', label: '坚果' },
  { value: 'milk', label: '牛奶' },
  { value: 'egg', label: '鸡蛋' },
  { value: 'wheat', label: '小麦' },
  { value: 'soy', label: '大豆' },
  { value: 'fish', label: '鱼类' },
  { value: 'shellfish', label: '贝类' },
  { value: 'sesame', label: '芝麻' },
  { value: 'other', label: '其他' },
];

const PRIORITY_LEVELS: { value: HealthPriority; label: string; color: string }[] = [
  { value: 'low', label: '低', color: 'bg-gray-200 text-gray-700' },
  { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: '高', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: '紧急', color: 'bg-red-100 text-red-700' },
];

const getDefaultProfile = (): MemberProfile => ({
  tastePreference: { spicy: 'none', sweet: 'none', salty: 'none', sour: 'none', greasy: 'none' },
  avoidedIngredients: [],
  allergens: [],
  healthRequirements: {
    lowSalt: false,
    lowOil: false,
    lowSugar: false,
    vegetarian: false,
    glutenFree: false,
    notes: '',
  },
  favoriteIngredients: [],
  importantNotes: '',
});

interface Props {
  memberId: string;
  memberName: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const MemberProfileEditor: React.FC<Props> = ({ memberId, memberName, open, onClose, onSaved }) => {
  const [profile, setProfile] = useState<MemberProfile>(getDefaultProfile());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAvoided, setNewAvoided] = useState('');
  const [newFavorite, setNewFavorite] = useState('');
  const [newAllergenType, setNewAllergenType] = useState<AllergenType>('peanut');
  const [newAllergenName, setNewAllergenName] = useState('');
  const [newAllergenSeverity, setNewAllergenSeverity] = useState<HealthPriority>('high');

  useEffect(() => {
    if (open && memberId) {
      setLoading(true);
      memberApi
        .getProfile(memberId)
        .then((p) => setProfile(p))
        .finally(() => setLoading(false));
    }
  }, [open, memberId]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await memberApi.saveProfile(memberId, profile);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addAvoided = () => {
    if (!newAvoided.trim()) return;
    setProfile({ ...profile, avoidedIngredients: [...profile.avoidedIngredients, newAvoided.trim()] });
    setNewAvoided('');
  };

  const removeAvoided = (idx: number) => {
    setProfile({
      ...profile,
      avoidedIngredients: profile.avoidedIngredients.filter((_, i) => i !== idx),
    });
  };

  const addFavorite = () => {
    if (!newFavorite.trim()) return;
    setProfile({ ...profile, favoriteIngredients: [...profile.favoriteIngredients, newFavorite.trim()] });
    setNewFavorite('');
  };

  const removeFavorite = (idx: number) => {
    setProfile({
      ...profile,
      favoriteIngredients: profile.favoriteIngredients.filter((_, i) => i !== idx),
    });
  };

  const addAllergen = () => {
    if (!newAllergenName.trim()) return;
    setProfile({
      ...profile,
      allergens: [
        ...profile.allergens,
        { type: newAllergenType, name: newAllergenName.trim(), severity: newAllergenSeverity },
      ],
    });
    setNewAllergenName('');
  };

  const removeAllergen = (idx: number) => {
    setProfile({
      ...profile,
      allergens: profile.allergens.filter((_, i) => i !== idx),
    });
  };

  const TasteSlider = ({ label, field }: { label: string; field: keyof MemberProfile['tastePreference'] }) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-14 text-sm text-gray-600">{label}</span>
      <div className="flex flex-1 gap-1">
        {TASTE_LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => setProfile({ ...profile, tastePreference: { ...profile.tastePreference, [field]: l.value } })}
            className={`flex-1 py-1.5 text-xs rounded-md border transition ${
              profile.tastePreference[field] === l.value
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">口味画像 - {memberName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">记录口味偏好、忌口、过敏源和健康要求</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <>
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-500 rounded-full" />
                  口味偏好
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                  <TasteSlider label="辛辣" field="spicy" />
                  <TasteSlider label="甜度" field="sweet" />
                  <TasteSlider label="咸度" field="salty" />
                  <TasteSlider label="酸度" field="sour" />
                  <TasteSlider label="油腻" field="greasy" />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-500 rounded-full" />
                  <AlertTriangle size={14} className="text-red-500" />
                  过敏源
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={newAllergenType}
                      onChange={(e) => setNewAllergenType(e.target.value as AllergenType)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {ALLERGEN_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newAllergenSeverity}
                      onChange={(e) => setNewAllergenSeverity(e.target.value as HealthPriority)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {PRIORITY_LEVELS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={newAllergenName}
                      onChange={(e) => setNewAllergenName(e.target.value)}
                      placeholder="过敏源名称，如花生、虾"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={addAllergen}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition flex items-center gap-1"
                    >
                      <Plus size={16} /> 添加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergens.map((a, idx) => {
                      const prio = PRIORITY_LEVELS.find((p) => p.value === a.severity)!;
                      const typeLabel = ALLERGEN_TYPES.find((t) => t.value === a.type)?.label || a.type;
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${prio.color}`}
                        >
                          <b>{typeLabel}:</b>
                          {a.name}
                          <button type="button" onClick={() => removeAllergen(idx)} className="ml-1 hover:text-red-600">
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded-full" />
                  忌口食材
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={newAvoided}
                      onChange={(e) => setNewAvoided(e.target.value)}
                      placeholder="如香菜、葱、姜"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAvoided())}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={addAvoided}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition flex items-center gap-1"
                    >
                      <Plus size={16} /> 添加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.avoidedIngredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs border border-orange-100"
                      >
                        {ing}
                        <button type="button" onClick={() => removeAvoided(idx)} className="ml-0.5 hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded-full" />
                  健康要求
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'lowSalt', label: '低盐' },
                      { key: 'lowOil', label: '低油' },
                      { key: 'lowSugar', label: '低糖' },
                      { key: 'vegetarian', label: '素食' },
                      { key: 'glutenFree', label: '无麸质' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.healthRequirements[key as keyof typeof profile.healthRequirements] as boolean}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              healthRequirements: {
                                ...profile.healthRequirements,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    value={profile.healthRequirements.notes || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        healthRequirements: { ...profile.healthRequirements, notes: e.target.value },
                      })
                    }
                    placeholder="其他健康备注..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  喜爱食材
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={newFavorite}
                      onChange={(e) => setNewFavorite(e.target.value)}
                      placeholder="如番茄、牛肉、鱼"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFavorite())}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={addFavorite}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition flex items-center gap-1"
                    >
                      <Plus size={16} /> 添加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteIngredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100"
                      >
                        {ing}
                        <button type="button" onClick={() => removeFavorite(idx)} className="ml-0.5 hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gray-500 rounded-full" />
                  重要备注
                </h4>
                <textarea
                  value={profile.importantNotes || ''}
                  onChange={(e) => setProfile({ ...profile, importantNotes: e.target.value })}
                  rows={2}
                  placeholder="重要注意事项..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </section>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存画像'}
          </button>
        </div>
      </div>
    </div>
  );
};
