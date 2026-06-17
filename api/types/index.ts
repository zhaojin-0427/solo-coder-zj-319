export type IngredientCategory = 'main' | 'seasoning' | 'side';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
}

export type HeatLevel = 'low' | 'medium' | 'high' | 'none';
export type StepType = 'wash-cut' | 'prep' | 'cooking' | 'plating';

export interface StepCard {
  id: string;
  recipeId: string;
  order: number;
  title: string;
  description: string;
  duration: number;
  heatLevel: HeatLevel;
  type: StepType;
  commonMistakes: string[];
  tips: string;
  ingredientIds: string[];
}

export interface Recipe {
  id: string;
  name: string;
  source: string;
  originalText: string;
  servings: number;
  ingredients: Ingredient[];
  steps: StepCard[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedRecipe {
  name: string;
  ingredients: Omit<Ingredient, 'id'>[];
  steps: Omit<StepCard, 'id' | 'recipeId'>[];
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export type TaskType = 'wash-cut' | 'prep' | 'cooking' | 'plating';

export interface FeastTask {
  id: string;
  type: TaskType;
  description: string;
  stepId?: string;
  recipeId?: string;
  recipeName?: string;
  assignedMemberId?: string;
  completed: boolean;
}

export type FeastStatus = 'planning' | 'in-progress' | 'completed';

export interface CalculatedIngredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  sourceRecipes: string[];
}

export interface Feast {
  id: string;
  name: string;
  date: string;
  people: number;
  recipeIds: string[];
  ingredients: CalculatedIngredient[];
  tasks: FeastTask[];
  status: FeastStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  feastId?: string;
  recipeId: string;
  recipeName: string;
  tasteDeviation: string;
  adjustmentSuggestion: string;
  rating: number;
  errorSteps: string[];
  createdAt: string;
}

export interface StatsOverview {
  totalRecipes: number;
  totalFeasts: number;
  totalReviews: number;
  totalMembers: number;
}

export interface PopularDish {
  name: string;
  count: number;
}

export interface TimeDistributionItem {
  type: string;
  label: string;
  avgMinutes: number;
}

export interface ErrorProneItem {
  step: string;
  errorCount: number;
}

export interface MemberCompletion {
  memberId: string;
  name: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}
