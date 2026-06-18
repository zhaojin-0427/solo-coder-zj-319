import { useState, useEffect } from 'react';
import {
  ChefHat,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Clock,
  Flame,
  AlertTriangle,
  Lightbulb,
  Save,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { recipeApi } from '@/lib/api';
import type { Recipe, ParsedRecipe, Ingredient, StepCard, HeatLevel, StepType, IngredientCategory } from '@/types';
import { RecipeRiskTagsEditor } from '@/components/RecipeRiskTagsEditor';
import { clsx } from 'clsx';

const heatLevelMap: Record<HeatLevel, { label: string; color: string }> = {
  high: { label: '大火', color: 'bg-red-100 text-red-700' },
  medium: { label: '中火', color: 'bg-orange-100 text-orange-700' },
  low: { label: '小火', color: 'bg-yellow-100 text-yellow-700' },
  none: { label: '无火', color: 'bg-stone-100 text-stone-600' },
};

const stepTypeMap: Record<StepType, { label: string; color: string }> = {
  'wash-cut': { label: '洗切备菜', color: 'bg-blue-100 text-blue-700' },
  'prep': { label: '备料调味', color: 'bg-purple-100 text-purple-700' },
  'cooking': { label: '烹饪烧制', color: 'bg-rose-100 text-rose-700' },
  'plating': { label: '装盘出品', color: 'bg-emerald-100 text-emerald-700' },
};

const categoryMap: Record<IngredientCategory, { label: string; color: string }> = {
  main: { label: '主料', color: 'bg-rose-100 text-rose-700' },
  seasoning: { label: '调料', color: 'bg-amber-100 text-amber-700' },
  side: { label: '配菜', color: 'bg-emerald-100 text-emerald-700' },
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [recipeName, setRecipeName] = useState('');
  const [recipeSource, setRecipeSource] = useState('');
  const [recipeServings, setRecipeServings] = useState(2);
  const [recipeTags, setRecipeTags] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id'>[]>([]);
  const [steps, setSteps] = useState<Omit<StepCard, 'id' | 'recipeId'>[]>([]);

  const [riskTagsEditor, setRiskTagsEditor] = useState<{ open: boolean; recipeId: string; recipeName: string }>({
    open: false,
    recipeId: '',
    recipeName: '',
  });

  const fetchRecipes = () => {
    setLoading(true);
    recipeApi.getAll().then((data) => {
      setRecipes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter((r) =>
    r.name.includes(searchTerm) ||
    r.tags.some((t) => t.includes(searchTerm)) ||
    r.source.includes(searchTerm)
  );

  const resetForm = () => {
    setRecipeName('');
    setRecipeSource('');
    setRecipeServings(2);
    setRecipeTags('');
    setOriginalText('');
    setParsedRecipe(null);
    setIngredients([]);
    setSteps([]);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setRecipeName(recipe.name);
    setRecipeSource(recipe.source);
    setRecipeServings(recipe.servings);
    setRecipeTags(recipe.tags.join('，'));
    setOriginalText(recipe.originalText);
    setIngredients(recipe.ingredients.map(({ id, ...rest }) => rest));
    setSteps(recipe.steps.map(({ id, recipeId, ...rest }) => rest));
    setParsedRecipe({
      name: recipe.name,
      ingredients: recipe.ingredients.map(({ id, ...rest }) => rest),
      steps: recipe.steps.map(({ id, recipeId, ...rest }) => rest),
    });
    setShowModal(true);
  };

  const handleParse = async () => {
    if (!originalText.trim()) return;
    setIsParsing(true);
    try {
      const result = await recipeApi.parse(originalText, recipeName || undefined);
      setParsedRecipe(result);
      setIngredients(result.ingredients);
      setSteps(result.steps);
      if (!recipeName) setRecipeName(result.name);
    } catch (e) {
      console.error(e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!recipeName.trim() || ingredients.length === 0 || steps.length === 0) return;
    try {
      const tags = recipeTags
        .split(/[，,、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingId) {
        await recipeApi.update(editingId, {
          name: recipeName,
          source: recipeSource,
          servings: recipeServings,
          tags,
          originalText,
          ingredients: ingredients as Ingredient[],
          steps: steps as StepCard[],
        });
      } else {
        await recipeApi.create({
          name: recipeName,
          source: recipeSource,
          originalText,
          servings: recipeServings,
          ingredients,
          steps,
          tags,
        });
      }
      fetchRecipes();
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这道菜谱吗？')) return;
    try {
      await recipeApi.delete(id);
      fetchRecipes();
    } catch (e) {
      console.error(e);
    }
  };

  const updateIngredient = (idx: number, field: keyof Omit<Ingredient, 'id'>, value: string | number) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as Omit<Ingredient, 'id'>;
      return next;
    });
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { name: '', amount: 1, unit: '克', category: 'main' },
    ]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof Omit<StepCard, 'id' | 'recipeId' | 'ingredientIds'>, value: any) => {
    setSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as Omit<StepCard, 'id' | 'recipeId'>;
      return next;
    });
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        title: `第${prev.length + 1}步`,
        description: '',
        duration: 10,
        heatLevel: 'medium',
        type: 'cooking',
        commonMistakes: [],
        tips: '',
        ingredientIds: [],
      },
    ]);
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-orange-500" />
            菜谱复原
          </h1>
          <p className="text-sm text-stone-500 mt-1">录入长辈的手写菜谱或口述做法，拆解成标准化做菜卡</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          新建菜谱
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="搜索菜谱名、标签、来源..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800">{recipe.name}</h3>
                  <p className="text-xs text-stone-500 mt-1">{recipe.source}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(recipe)}
                    className="p-2 rounded-lg hover:bg-orange-50 text-stone-500 hover:text-orange-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                <span className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4 text-orange-500" />
                  {recipe.ingredients.length}种食材
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-rose-500" />
                  {recipe.steps.reduce((s, st) => s + st.duration, 0)}分钟
                </span>
                {recipe.riskTags && (recipe.riskTags.containsAllergens.length > 0 || recipe.riskTags.highSalt || recipe.riskTags.highOil || recipe.riskTags.highSugar) && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <ShieldAlert className="w-4 h-4" />
                    有风险标签
                  </span>
                )}
              </div>

              {recipe.riskTags && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.riskTags.containsAllergens.slice(0, 3).map((a) => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                      含{a}
                    </span>
                  ))}
                  {recipe.riskTags.highSalt && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">高盐</span>
                  )}
                  {recipe.riskTags.highOil && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">高油</span>
                  )}
                  {recipe.riskTags.highSugar && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">高糖</span>
                  )}
                  {recipe.riskTags.spicyLevel !== 'none' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                      {recipe.riskTags.spicyLevel === 'mild' ? '微辣' : recipe.riskTags.spicyLevel === 'medium' ? '中辣' : '重辣'}
                    </span>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setRiskTagsEditor({ open: true, recipeId: recipe.id, recipeName: recipe.name })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition font-medium"
                >
                  <ShieldAlert size={12} />
                  {recipe.riskTags ? '编辑风险标签' : '设置风险标签'}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(recipe)}
                    className="p-1.5 rounded-lg hover:bg-orange-50 text-stone-500 hover:text-orange-600 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredRecipes.length === 0 && (
            <div className="col-span-full text-center py-16 text-stone-400">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>还没有菜谱，点击右上角新建第一道菜吧！</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800">
                {editingId ? '编辑菜谱' : '新建菜谱'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-2xl p-5 border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-stone-800">智能解析</h3>
                </div>
                <p className="text-sm text-stone-600 mb-3">
                  粘贴手写菜谱内容或口述做法，AI会自动识别食材、步骤、火候和常见失误
                </p>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="示例：五花肉一斤切块，冷水下锅焯水。锅里放油加糖炒出糖色，下肉翻炒上色..."
                  className="w-full h-28 p-4 rounded-xl bg-white border border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none text-sm"
                />
                <button
                  onClick={handleParse}
                  disabled={isParsing || !originalText.trim()}
                  className={clsx(
                    'mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                    isParsing || !originalText.trim()
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl'
                  )}
                >
                  {isParsing ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isParsing ? '解析中...' : '智能解析'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">菜谱名称 *</label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="如：奶奶的红烧肉"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">来源</label>
                  <input
                    type="text"
                    value={recipeSource}
                    onChange={(e) => setRecipeSource(e.target.value)}
                    placeholder="如：奶奶口述 / 妈妈手写菜谱"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">份量（人）</label>
                  <input
                    type="number"
                    min={1}
                    value={recipeServings}
                    onChange={(e) => setRecipeServings(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">标签（用逗号或顿号分隔）</label>
                  <input
                    type="text"
                    value={recipeTags}
                    onChange={(e) => setRecipeTags(e.target.value)}
                    placeholder="如：家常菜，硬菜，奶奶拿手"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold">1</span>
                    食材清单
                  </h3>
                  <button
                    onClick={addIngredient}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 添加食材
                  </button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        placeholder="食材名称"
                        className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                        className="w-20 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                      />
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        placeholder="单位"
                        className="w-20 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                      />
                      <select
                        value={ing.category}
                        onChange={(e) => updateIngredient(idx, 'category', e.target.value as IngredientCategory)}
                        className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                      >
                        <option value="main">主料</option>
                        <option value="seasoning">调料</option>
                        <option value="side">配菜</option>
                      </select>
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {ingredients.length === 0 && (
                    <div className="text-center py-8 text-stone-400 text-sm bg-stone-50 rounded-xl">
                      暂无食材，点击上方添加或使用智能解析
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">2</span>
                    步骤卡片
                  </h3>
                  <button
                    onClick={addStep}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 添加步骤
                  </button>
                </div>
                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <div key={idx} className="border border-stone-200 rounded-2xl p-4 bg-gradient-to-br from-white to-stone-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                            {step.order}
                          </span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(idx, 'title', e.target.value)}
                            className="font-semibold text-stone-800 bg-transparent outline-none focus:bg-white focus:rounded-lg focus:px-2 focus:py-0.5 focus:border focus:border-orange-200"
                          />
                        </div>
                        <button
                          onClick={() => removeStep(idx)}
                          className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        value={step.description}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        placeholder="详细步骤说明..."
                        className="w-full p-3 rounded-xl bg-white border border-stone-200 text-sm outline-none focus:border-orange-400 resize-none min-h-[60px] mb-3"
                      />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 时长(分)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={step.duration}
                            onChange={(e) => updateStep(idx, 'duration', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> 火候
                          </label>
                          <select
                            value={step.heatLevel}
                            onChange={(e) => updateStep(idx, 'heatLevel', e.target.value as HeatLevel)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                          >
                            <option value="high">大火</option>
                            <option value="medium">中火</option>
                            <option value="low">小火</option>
                            <option value="none">无火</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">步骤类型</label>
                          <select
                            value={step.type}
                            onChange={(e) => updateStep(idx, 'type', e.target.value as StepType)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-orange-400"
                          >
                            <option value="wash-cut">洗切备菜</option>
                            <option value="prep">备料调味</option>
                            <option value="cooking">烹饪烧制</option>
                            <option value="plating">装盘出品</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">分类</label>
                          <div className="flex gap-1 flex-wrap">
                            <span className={clsx('text-xs px-2 py-1.5 rounded-lg', stepTypeMap[step.type].color)}>
                              {stepTypeMap[step.type].label}
                            </span>
                            <span className={clsx('text-xs px-2 py-1.5 rounded-lg', heatLevelMap[step.heatLevel].color)}>
                              {heatLevelMap[step.heatLevel].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                          <label className="block text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 常见失误（每行一个）
                          </label>
                          <textarea
                            value={step.commonMistakes.join('\n')}
                            onChange={(e) => updateStep(idx, 'commonMistakes', e.target.value.split('\n').filter(Boolean))}
                            placeholder="火太大容易糊&#10;中途开盖次数多"
                            className="w-full p-2 rounded-lg bg-white border border-red-100 text-xs outline-none focus:border-red-300 resize-none min-h-[60px]"
                          />
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                          <label className="block text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" /> 凭经验判断备注
                          </label>
                          <textarea
                            value={step.tips}
                            onChange={(e) => updateStep(idx, 'tips', e.target.value)}
                            placeholder="看到糖冒细密小泡就差不多了"
                            className="w-full p-2 rounded-lg bg-white border border-amber-100 text-xs outline-none focus:border-amber-300 resize-none min-h-[60px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {steps.length === 0 && (
                    <div className="text-center py-8 text-stone-400 text-sm bg-stone-50 rounded-xl">
                      暂无步骤，点击上方添加或使用智能解析
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-200 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!recipeName.trim() || ingredients.length === 0 || steps.length === 0}
                className={clsx(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                  !recipeName.trim() || ingredients.length === 0 || steps.length === 0
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl'
                )}
              >
                <Save className="w-4 h-4" />
                保存菜谱
              </button>
            </div>
          </div>
        </div>
      )}

      <RecipeRiskTagsEditor
        open={riskTagsEditor.open}
        recipeId={riskTagsEditor.recipeId}
        recipeName={riskTagsEditor.recipeName}
        onClose={() => setRiskTagsEditor({ ...riskTagsEditor, open: false })}
        onSaved={() => fetchRecipes()}
      />
    </div>
  );
}
