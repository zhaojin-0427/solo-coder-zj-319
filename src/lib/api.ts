import type {
  Recipe,
  Member,
  Feast,
  Review,
  ParsedRecipe,
  StepCard,
  StatsOverview,
  PopularDish,
  TimeDistributionItem,
  ErrorProneItem,
  MemberCompletion,
  Ingredient,
  FeastTask,
  PurchaseStatus,
  ReplacementIngredient,
  PurchaseStats,
  FeastPurchaseOverview,
  CalculatedIngredient,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}

export const recipeApi = {
  getAll: () => request<Recipe[]>('/recipes'),
  getById: (id: string) => request<Recipe>(`/recipes/${id}`),
  parse: (text: string, name?: string) =>
    request<ParsedRecipe>('/recipes/parse', {
      method: 'POST',
      body: JSON.stringify({ text, name }),
    }),
  create: (data: {
    name: string;
    source: string;
    originalText: string;
    servings: number;
    ingredients: Omit<Ingredient, 'id'>[];
    steps: Omit<StepCard, 'id' | 'recipeId'>[];
    tags: string[];
  }) =>
    request<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Recipe>) =>
    request<Recipe>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/recipes/${id}`, { method: 'DELETE' }),
};

export const stepApi = {
  getByRecipe: (recipeId: string) => request<StepCard[]>(`/steps/recipe/${recipeId}`),
  create: (recipeId: string, data: Omit<StepCard, 'id' | 'recipeId'>) =>
    request<StepCard[]>(`/steps/recipe/${recipeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (stepId: string, data: Partial<StepCard>) =>
    request<StepCard>(`/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (stepId: string) => request<StepCard[]>(`/steps/${stepId}`, { method: 'DELETE' }),
  reorder: (recipeId: string, orderedIds: string[]) =>
    request<StepCard[]>(`/steps/reorder/recipe/${recipeId}`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
};

export const memberApi = {
  getAll: () => request<Member[]>('/members'),
  getById: (id: string) => request<Member>(`/members/${id}`),
  create: (data: Partial<Member>) =>
    request<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Member>) =>
    request<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/members/${id}`, { method: 'DELETE' }),
};

export const feastApi = {
  getAll: () => request<Feast[]>('/feasts'),
  getById: (id: string) => request<Feast>(`/feasts/${id}`),
  create: (data: { name: string; date: string; people: number; recipeIds: string[] }) =>
    request<Feast>('/feasts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Feast>) =>
    request<Feast>(`/feasts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  recalculate: (id: string, people: number) =>
    request<Feast>(`/feasts/${id}/recalculate`, {
      method: 'PUT',
      body: JSON.stringify({ people }),
    }),
  updateTask: (feastId: string, taskId: string, data: Partial<FeastTask>) =>
    request<FeastTask>(`/feasts/${feastId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addTask: (feastId: string, data: Omit<FeastTask, 'id' | 'completed'>) =>
    request<FeastTask[]>(`/feasts/${feastId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTask: (feastId: string, taskId: string) =>
    request<FeastTask[]>(`/feasts/${feastId}/tasks/${taskId}`, { method: 'DELETE' }),
  delete: (id: string) => request<void>(`/feasts/${id}`, { method: 'DELETE' }),
  updateIngredientPurchaseStatus: (
    feastId: string,
    ingredientName: string,
    data: {
      status: PurchaseStatus;
      outOfStockNote?: string;
      replacement?: ReplacementIngredient;
    }
  ) =>
    request<CalculatedIngredient>(
      `/feasts/${feastId}/ingredients/${encodeURIComponent(ingredientName)}/purchase-status`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),
  batchUpdateIngredients: (
    feastId: string,
    updates: Array<{
      name: string;
      status?: PurchaseStatus;
      outOfStockNote?: string;
      replacement?: ReplacementIngredient;
    }>
  ) =>
    request<CalculatedIngredient[]>(`/feasts/${feastId}/ingredients/batch-update`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    }),
};

export const reviewApi = {
  getAll: (params?: { feastId?: string; recipeId?: string }) => {
    const query = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : '';
    return request<Review[]>(`/reviews${query}`);
  },
  getById: (id: string) => request<Review>(`/reviews/${id}`),
  create: (data: {
    feastId?: string;
    recipeId: string;
    recipeName: string;
    tasteDeviation: string;
    adjustmentSuggestion: string;
    rating: number;
    errorSteps: string[];
  }) =>
    request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const statsApi = {
  getOverview: () => request<StatsOverview>('/stats/overview'),
  getPopularDishes: () => request<PopularDish[]>('/stats/popular-dishes'),
  getTimeDistribution: () => request<TimeDistributionItem[]>('/stats/time-distribution'),
  getErrorProne: () => request<ErrorProneItem[]>('/stats/error-prone'),
  getMemberCompletion: () => request<MemberCompletion[]>('/stats/member-completion'),
  getPurchaseStats: () => request<PurchaseStats>('/stats/purchase-stats'),
  getPurchaseOverview: () => request<FeastPurchaseOverview[]>('/stats/purchase-overview'),
};
