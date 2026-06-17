import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  X,
  Star,
  AlertTriangle,
  Lightbulb,
  Save,
  Calendar,
  ChefHat,
  Search,
} from 'lucide-react';
import { reviewApi, recipeApi, feastApi } from '@/lib/api';
import type { Review, Recipe, Feast } from '@/types';
import { clsx } from 'clsx';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [feasts, setFeasts] = useState<Feast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedFeastId, setSelectedFeastId] = useState<string>('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tasteDeviation, setTasteDeviation] = useState('');
  const [adjustmentSuggestion, setAdjustmentSuggestion] = useState('');
  const [errorSteps, setErrorSteps] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [rv, rc, fs] = await Promise.all([
      reviewApi.getAll(),
      recipeApi.getAll(),
      feastApi.getAll(),
    ]);
    setReviews(rv);
    setRecipes(rc);
    setFeasts(fs);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReviews = reviews.filter(
    (r) =>
      r.recipeName.includes(searchTerm) ||
      r.tasteDeviation.includes(searchTerm) ||
      r.adjustmentSuggestion.includes(searchTerm)
  );

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);
  const selectedFeast = feasts.find((f) => f.id === selectedFeastId);

  const toggleErrorStep = (stepId: string) => {
    setErrorSteps((prev) =>
      prev.includes(stepId) ? prev.filter((s) => s !== stepId) : [...prev, stepId]
    );
  };

  const resetForm = () => {
    setSelectedFeastId('');
    setSelectedRecipeId('');
    setRating(0);
    setTasteDeviation('');
    setAdjustmentSuggestion('');
    setErrorSteps([]);
  };

  const handleSave = async () => {
    if (!selectedRecipeId || rating === 0) return;
    try {
      await reviewApi.create({
        feastId: selectedFeastId || undefined,
        recipeId: selectedRecipeId,
        recipeName: selectedRecipe?.name || '',
        tasteDeviation,
        adjustmentSuggestion,
        rating,
        errorSteps,
      });
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const getStepName = (stepId: string) => {
    for (const recipe of recipes) {
      const step = recipe.steps.find((s) => s.id === stepId);
      if (step) return `${recipe.name} - ${step.title}`;
    }
    return stepId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-500" />
            复盘记录
          </h1>
          <p className="text-sm text-stone-500 mt-1">记录口味偏差，标记出错步骤，留下改进建议</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          新增复盘
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="搜索菜品、口味偏差、改进建议..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-stone-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        />
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>还没有复盘记录，做完饭后记得记录一下吧！</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredReviews.map((review) => {
            const feast = feasts.find((f) => f.id === review.feastId);
            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-stone-800">{review.recipeName}</h3>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={clsx(
                              'w-4 h-4',
                              n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {feast && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {feast.name} · {review.createdAt.split('T')[0]}
                      </div>
                    )}
                  </div>
                </div>

                {review.tasteDeviation && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-rose-50 to-transparent border border-rose-100">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-rose-700 mb-1">口味偏差</p>
                        <p className="text-sm text-stone-700">{review.tasteDeviation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {review.adjustmentSuggestion && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-100">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 mb-1">下次调整建议</p>
                        <p className="text-sm text-stone-700">{review.adjustmentSuggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {review.errorSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-2">出错环节</p>
                    <div className="flex flex-wrap gap-1.5">
                      {review.errorSteps.map((stepId) => (
                        <span
                          key={stepId}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          {getStepName(stepId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800">新增复盘</h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">关联家宴（可选）</label>
                  <select
                    value={selectedFeastId}
                    onChange={(e) => setSelectedFeastId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none bg-white"
                  >
                    <option value="">不关联家宴</option>
                    {feasts.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}（{f.date}）</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">菜品 *</label>
                  <select
                    value={selectedRecipeId}
                    onChange={(e) => {
                      setSelectedRecipeId(e.target.value);
                      setErrorSteps([]);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none bg-white"
                  >
                    <option value="">请选择菜品</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">评分 *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={clsx(
                          'w-8 h-8 transition-colors',
                          n <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-stone-500">
                    {rating > 0 ? `${rating} 分` : '点击星星评分'}
                  </span>
                </div>
              </div>

              {selectedRecipe && selectedRecipe.steps.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    出错环节（可多选）
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {selectedRecipe.steps.map((step) => {
                      const isSelected = errorSteps.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          onClick={() => toggleErrorStep(step.id)}
                          className={clsx(
                            'text-left p-3 rounded-xl border transition-all text-sm',
                            isSelected
                              ? 'border-red-400 bg-red-50 text-red-700'
                              : 'border-stone-200 hover:border-red-200 bg-white text-stone-600'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-stone-100 text-xs flex items-center justify-center flex-shrink-0">
                              {step.order}
                            </span>
                            <span className="truncate">{step.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  口味偏差描述
                </label>
                <textarea
                  value={tasteDeviation}
                  onChange={(e) => setTasteDeviation(e.target.value)}
                  placeholder="这次的味道怎么样？咸了？淡了？糖色深了？口感如何..."
                  className="w-full p-4 rounded-xl border border-stone-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none min-h-[90px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-500" />
                  下次调整建议
                </label>
                <textarea
                  value={adjustmentSuggestion}
                  onChange={(e) => setAdjustmentSuggestion(e.target.value)}
                  placeholder="下次做的时候要怎么改进？减少盐？缩短时间？..."
                  className="w-full p-4 rounded-xl border border-stone-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none min-h-[90px]"
                />
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
                disabled={!selectedRecipeId || rating === 0}
                className={clsx(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                  !selectedRecipeId || rating === 0
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl'
                )}
              >
                <Save className="w-4 h-4" />
                保存复盘
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
