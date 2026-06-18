export type IngredientCategory = 'main' | 'seasoning' | 'side';

export type PurchaseStatus = 'pending' | 'purchased' | 'out-of-stock' | 'replaced';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
}

export interface ReplacementIngredient {
  name: string;
  amount: number;
  unit: string;
  note?: string;
}

export type HeatLevel = 'low' | 'medium' | 'high' | 'none';
export type StepType = 'wash-cut' | 'prep' | 'cooking' | 'plating';

export type KitchenEquipment =
  | 'gas-stove'
  | 'wok'
  | 'steamer'
  | 'oven'
  | 'rice-cooker'
  | 'cutting-board'
  | 'pot'
  | 'none';

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
  equipment?: KitchenEquipment;
  parallel?: boolean;
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
  latestReadyTime?: string;
  keepWarmDuration?: number;
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
  purchaseStatus: PurchaseStatus;
  outOfStockNote?: string;
  replacement?: ReplacementIngredient;
  purchasedAt?: string;
}

export type ScheduleConflictType = 'equipment' | 'member' | 'keep-warm' | 'too-late';

export interface ScheduleItem {
  id: string;
  taskId: string;
  stepId?: string;
  recipeId?: string;
  recipeName?: string;
  stepTitle: string;
  stepOrder: number;
  type: TaskType;
  memberId?: string;
  memberName?: string;
  equipment?: KitchenEquipment;
  duration: number;
  startTime: string;
  endTime: string;
  locked: boolean;
  parallel: boolean;
}

export interface ScheduleConflict {
  id: string;
  type: ScheduleConflictType;
  severity: 'error' | 'warning';
  message: string;
  itemIds: string[];
}

export interface CookingSchedule {
  feastId: string;
  mealTime: string;
  items: ScheduleItem[];
  conflicts: ScheduleConflict[];
  generatedAt: string;
  updatedAt: string;
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
  schedule?: CookingSchedule;
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

export interface PurchaseStats {
  totalIngredients: number;
  purchasedCount: number;
  pendingCount: number;
  outOfStockCount: number;
  replacedCount: number;
  purchaseCompletionRate: number;
  outOfStockRate: number;
  replacementRate: number;
}

export interface FeastPurchaseOverview {
  feastId: string;
  feastName: string;
  feastDate: string;
  totalIngredients: number;
  purchasedCount: number;
  pendingCount: number;
  outOfStockCount: number;
  replacedCount: number;
  completionRate: number;
}

export interface EquipmentUsageItem {
  equipment: KitchenEquipment;
  label: string;
  count: number;
  totalMinutes: number;
}

export interface ScheduleSummary {
  totalSchedules: number;
  totalItems: number;
  totalConflicts: number;
  avgConflicts: number;
  avgItems: number;
}

export interface MemberScheduleLoad {
  memberId: string;
  name: string;
  totalMinutes: number;
  itemCount: number;
}

export interface ScheduleOverview {
  feastId: string;
  feastName: string;
  feastDate: string;
  mealTime: string;
  itemCount: number;
  conflictCount: number;
  earliestStart: string;
  memberCount: number;
  updatedAt: string;
}
