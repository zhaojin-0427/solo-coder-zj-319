import React, { useEffect, useState } from 'react';
import { X, Plus, Info } from 'lucide-react';
import type { RecipeRiskTags, TasteLevel, AllergenType } from '../types';
import { recipeApi } from '../lib/api';

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

const getDefaultRiskTags = (): RecipeRiskTags => ({
  spicyLevel: 'none',
  sweetLevel: 'none',
  saltyLevel: 'none',
  greasyLevel: 'none',
  containsAllergens: [],
  highSalt: false,
  highOil: false,
  highSugar: false,
  containsMeat: false,
  containsGluten: false,
  keyIngredients: [],
  replaceableIngredients: [],
});

interface Props {
  recipeId: string;
  recipeName: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const RecipeRiskTagsEditor: React.FC<Props> = ({ recipeId, recipeName, open, onClose, onSaved }) => {
  const [tags, setTags] = useState<RecipeRiskTags>(getDefaultRiskTags());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newOriginal, setNewOriginal] = useState('');
  const [newAlternatives, setNewAlternatives] = useState('');

  useEffect(() => {
    if (open && recipeId) {
      setLoading(true);
      recipeApi
        .getRiskTags(recipeId)
        .then((t) => setTags(t))
        .finally(() => setLoading(false));
    }
  }, [open, recipeId]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await recipeApi.saveRiskTags(recipeId, tags);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergen = (type: AllergenType) => {
    setTags({
      ...tags,
      containsAllergens: tags.containsAllergens.includes(type)
        ? tags.containsAllergens.filter((t) => t !== type)
        : [...tags.containsAllergens, type],
    });
  };

  const addKey = () => {
    if (!newKey.trim()) return;
    setTags({ ...tags, keyIngredients: [...tags.keyIngredients, newKey.trim()] });
    setNewKey('');
  };

  const removeKey = (idx: number) => {
    setTags({ ...tags, keyIngredients: tags.keyIngredients.filter((_, i) => i !== idx) });
  };

  const addReplaceable = () => {
    if (!newOriginal.trim()) return;
    const alternatives = newAlternatives.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
    setTags({
      ...tags,
      replaceableIngredients: [...tags.replaceableIngredients, { original: newOriginal.trim(), alternatives }],
    });
    setNewOriginal('');
    setNewAlternatives('');
  };

  const removeReplaceable = (idx: number) => {
    setTags({ ...tags, replaceableIngredients: tags.replaceableIngredients.filter((_, i) => i !== idx) });
  };

  const TasteSlider = ({ label, field }: { label: string; field: 'spicyLevel' | 'sweetLevel' | 'saltyLevel' | 'greasyLevel' }) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-14 text-sm text-gray-600">{label}</span>
      <div className="flex flex-1 gap-1">
        {TASTE_LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => setTags({ ...tags, [field]: l.value })}
            className={`flex-1 py-1.5 text-xs rounded-md border transition ${
              tags[field] === l.value
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
            <h3 className="text-lg font-semibold text-gray-900">风险标签 - {recipeName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">标记口味程度、过敏源、关键/可替换食材</p>
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
                  口味等级
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                  <TasteSlider label="辛辣" field="spicyLevel" />
                  <TasteSlider label="甜度" field="sweetLevel" />
                  <TasteSlider label="咸度" field="saltyLevel" />
                  <TasteSlider label="油脂" field="greasyLevel" />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-500 rounded-full" />
                  含过敏源
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleAllergen(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        tags.containsAllergens.includes(t.value)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded-full" />
                  健康属性
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'highSalt', label: '高盐' },
                      { key: 'highOil', label: '高油' },
                      { key: 'highSugar', label: '高糖' },
                      { key: 'containsMeat', label: '含肉类' },
                      { key: 'containsGluten', label: '含麸质' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tags[key as keyof RecipeRiskTags] as boolean}
                          onChange={(e) => setTags({ ...tags, [key]: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded-full" />
                  关键食材
                  <Info size={13} className="text-gray-400" />
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="如花生、香菜、虾"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKey())}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={addKey}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition flex items-center gap-1"
                    >
                      <Plus size={16} /> 添加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.keyIngredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs border border-orange-100"
                      >
                        {ing}
                        <button type="button" onClick={() => removeKey(idx)} className="ml-0.5 hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  可替换食材
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={newOriginal}
                      onChange={(e) => setNewOriginal(e.target.value)}
                      placeholder="原食材，如花生油"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      value={newAlternatives}
                      onChange={(e) => setNewAlternatives(e.target.value)}
                      placeholder="替代品（逗号分隔），如玉米油,橄榄油"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={addReplaceable}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition flex items-center gap-1"
                    >
                      <Plus size={16} /> 添加
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tags.replaceableIngredients.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs border border-blue-100"
                      >
                        <span className="font-medium text-blue-700">{r.original}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-blue-600 flex-1">{r.alternatives.join('、')}</span>
                        <button type="button" onClick={() => removeReplaceable(idx)} className="hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
            {saving ? '保存中...' : '保存标签'}
          </button>
        </div>
      </div>
    </div>
  );
};
