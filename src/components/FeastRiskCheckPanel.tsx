import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  User,
  ChefHat,
  ShieldAlert,
} from 'lucide-react';
import type {
  FeastRiskCheck,
  RecipeMemberRisk,
  FeastRiskResolution,
  ConflictResolutionStatus,
  RiskSeverity,
} from '../types';
import { feastApi } from '../lib/api';

const severityColor: Record<RiskSeverity, { bg: string; border: string; text: string; badge: string }> = {
  danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500' },
};

const severityLabel: Record<RiskSeverity, string> = {
  danger: '严重',
  warning: '警告',
  info: '提示',
};

const statusIcon: Record<ConflictResolutionStatus, React.ReactNode> = {
  pending: <Clock size={16} className="text-gray-400" />,
  resolved: <CheckCircle2 size={16} className="text-green-500" />,
  confirmed: <CheckCircle2 size={16} className="text-blue-500" />,
  ignored: <XCircle size={16} className="text-gray-400" />,
};

const statusLabel: Record<ConflictResolutionStatus, string> = {
  pending: '待处理',
  resolved: '已解决',
  confirmed: '已确认',
  ignored: '已忽略',
};

interface Props {
  feastId: string;
  riskCheck?: FeastRiskCheck;
  onUpdate?: (rc: FeastRiskCheck) => void;
}

export const FeastRiskCheckPanel: React.FC<Props> = ({ feastId, riskCheck: initialRiskCheck, onUpdate }) => {
  const [riskCheck, setRiskCheck] = useState<FeastRiskCheck | null>(initialRiskCheck || null);
  const [loading, setLoading] = useState(!initialRiskCheck);
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<RiskSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ConflictResolutionStatus | 'all'>('all');

  useEffect(() => {
    if (!initialRiskCheck && feastId) {
      setLoading(true);
      feastApi
        .getRiskCheck(feastId)
        .then((rc) => {
          setRiskCheck(rc);
          onUpdate?.(rc);
        })
        .finally(() => setLoading(false));
    }
  }, [feastId, initialRiskCheck, onUpdate]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 text-center text-gray-500">
        <ShieldAlert size={32} className="mx-auto mb-2 text-amber-400 animate-pulse" />
        正在进行口味与忌口检查...
      </div>
    );
  }

  if (!riskCheck) return null;

  const { compatibility, resolutions } = riskCheck;

  const getResolution = (riskId: string): FeastRiskResolution | undefined =>
    resolutions.find((r) => r.riskId === riskId);

  const getRiskStatus = (riskId: string): ConflictResolutionStatus =>
    getResolution(riskId)?.status || 'pending';

  const handleStatusChange = async (
    risk: RecipeMemberRisk,
    status: ConflictResolutionStatus,
    resolutionType?: FeastRiskResolution['resolutionType'],
    resolutionNote?: string
  ) => {
    try {
      const updated = await feastApi.updateRiskResolution(feastId, risk.riskId, {
        status,
        resolutionType,
        resolutionNote,
      });
      setRiskCheck(updated);
      onUpdate?.(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recipeRisks = new Map<string, RecipeMemberRisk[]>();
  for (const risk of compatibility.allRisks) {
    const list = recipeRisks.get(risk.recipeId) || [];
    list.push(risk);
    recipeRisks.set(risk.recipeId, list);
  }

  const filteredRisks = compatibility.allRisks.filter((r) => {
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && getRiskStatus(r.riskId) !== filterStatus) return false;
    return true;
  });

  const scoreColor =
    compatibility.overallScore >= 80
      ? 'text-green-600'
      : compatibility.overallScore >= 60
      ? 'text-amber-600'
      : 'text-red-600';
  const scoreBg =
    compatibility.overallScore >= 80
      ? 'bg-green-50 border-green-200'
      : compatibility.overallScore >= 60
      ? 'bg-amber-50 border-amber-200'
      : 'bg-red-50 border-red-200';

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className={`p-5 border-b ${scoreBg}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ShieldAlert size={20} className="text-amber-500" />
              口味与忌口检查
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              共检测到 <b className="text-red-600">{compatibility.allRisks.length}</b> 项风险，其中
              <b className="text-red-600 ml-1">{compatibility.criticalRiskCount}</b> 项严重风险
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${scoreColor}`}>{compatibility.overallScore}</div>
            <div className="text-xs text-gray-500">整体适配度</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {compatibility.recipeScores.map((s) => {
            const color =
              s.totalScore >= 80
                ? 'bg-green-500'
                : s.totalScore >= 60
                ? 'bg-amber-500'
                : 'bg-red-500';
            return (
              <div key={s.recipeId} className="bg-white/60 rounded-lg p-2.5 border border-white/80">
                <div className="flex items-center justify-between">
                  <ChefHat size={14} className="text-gray-500" />
                  <span className={`text-sm font-bold ${color.replace('bg-', 'text-')}`}>{s.totalScore}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1 truncate">{s.recipeName}</div>
                <div className="text-xs text-gray-400">{s.riskCount} 项风险</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">严重程度:</span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 text-xs rounded-full ${filterSeverity === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            全部
          </button>
          {(['danger', 'warning', 'info'] as RiskSeverity[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-2.5 py-1 text-xs rounded-full ${filterSeverity === s ? severityColor[s].badge + ' text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {severityLabel[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500">处理状态:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 text-xs rounded-full ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            全部
          </button>
          {(['pending', 'resolved', 'confirmed', 'ignored'] as ConflictResolutionStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 text-xs rounded-full ${filterStatus === s ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y max-h-[500px] overflow-y-auto">
        {filteredRisks.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-green-400" />
            没有匹配的风险项
          </div>
        ) : (
          filteredRisks.map((risk) => {
            const color = severityColor[risk.severity];
            const expanded = expandedRisks.has(risk.riskId);
            const resolution = getResolution(risk.riskId);
            const status = getRiskStatus(risk.riskId);

            return (
              <div key={risk.riskId} className={`${color.bg} border-l-4 ${color.border.replace('border-', 'border-l-')}`}>
                <button
                  onClick={() => toggleExpand(risk.riskId)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/50 transition"
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${color.badge}`}>
                    {risk.severity === 'danger' ? '!' : risk.severity === 'warning' ? '⚠' : 'i'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${color.text}`}>
                        {risk.category} · {severityLabel[risk.severity]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <User size={11} /> {risk.memberName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <ChefHat size={11} /> {risk.recipeName}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">{risk.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                      {statusIcon[status]} {statusLabel[status]}
                    </span>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-0 ml-9">
                    {risk.affectedIngredients && risk.affectedIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-xs text-gray-500 mr-1">相关食材:</span>
                        {risk.affectedIngredients.map((ing) => (
                          <span key={ing} className="px-2 py-0.5 bg-white rounded text-xs border border-gray-200 text-gray-700">
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}

                    {risk.suggestions && risk.suggestions.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1.5">调整建议</div>
                            <ul className="space-y-1">
                              {risk.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                                  <span className="text-gray-400">{i + 1}.</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {resolution?.resolutionNote && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                        <div className="text-xs font-medium text-green-700 mb-1">处理记录</div>
                        <div className="text-xs text-green-800">{resolution.resolutionNote}</div>
                        {resolution.handledBy && (
                          <div className="text-xs text-green-600 mt-1">处理人: {resolution.handledBy}</div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(risk, 'resolved', 'replace-ingredient', '已替换食材')}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition"
                          >
                            ✓ 标记已替换食材
                          </button>
                          <button
                            onClick={() => handleStatusChange(risk, 'confirmed', 'custom', '已确认，成员接受')}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition"
                          >
                            ✓ 成员确认接受
                          </button>
                          <button
                            onClick={() => handleStatusChange(risk, 'resolved', 'replace-recipe', '已从菜单移除')}
                            className="px-3 py-1.5 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600 transition"
                          >
                            从菜单移除
                          </button>
                          <button
                            onClick={() => handleStatusChange(risk, 'ignored', 'custom', '风险可忽略')}
                            className="px-3 py-1.5 bg-white text-gray-600 rounded-md text-xs font-medium border border-gray-300 hover:bg-gray-50 transition"
                          >
                            忽略此风险
                          </button>
                        </>
                      )}
                      {status !== 'pending' && (
                        <button
                          onClick={() => handleStatusChange(risk, 'pending')}
                          className="px-3 py-1.5 bg-white text-gray-600 rounded-md text-xs font-medium border border-gray-300 hover:bg-gray-50 transition"
                        >
                          ↺ 重新标记为待处理
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
