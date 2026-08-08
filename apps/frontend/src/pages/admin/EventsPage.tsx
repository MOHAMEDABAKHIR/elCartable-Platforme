import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchAnalyticsEvents, fetchAuditLog } from '../../lib/queries';
import type { AnalyticsEventType, AuditAction } from '../../lib/types';
import {
  ANALYTICS_EVENT_LABELS,
  AUDIT_ACTION_LABELS,
  analyticsEventColor,
  auditActionColor,
  formatDate,
} from '../../lib/format';
import { Alert, Badge, Card, EmptyState, Field, Input, Select, Spinner } from '../../components/ui';

type Tab = 'audit' | 'analytics';

const REFRESH_MS = 15_000;

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-brand-500 text-white' : 'text-brand-600 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  );
}

function AuditLogPanel() {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['audit-log', action, entityType, from, to],
    queryFn: () =>
      fetchAuditLog({
        action: action || undefined,
        entityType: entityType || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        limit: 100,
      }),
    refetchInterval: REFRESH_MS,
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Action">
            <Select value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')}>
              <option value="">Toutes</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type d'entité">
            <Input
              placeholder="ex: Order, Product…"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
          </Field>
          <Field label="Depuis">
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Jusqu'à">
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <Spinner label="Chargement du journal d'audit…" />
      ) : isError ? (
        <Alert>Impossible de charger le journal d'audit.</Alert>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Aucun événement"
          description="Aucune action ne correspond à ces filtres pour le moment."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50 text-left text-xs font-semibold uppercase text-brand-500">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entité</th>
                <th className="px-4 py-3">Auteur</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {data.map((entry) => (
                <tr key={entry.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3">
                    <Badge className={auditActionColor(entry.action)}>
                      {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {entry.entityType ?? '—'}
                    {entry.entityId && <span className="text-brand-400"> · {entry.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 text-brand-700">
                    {entry.user ? (
                      <div>
                        <div className="font-medium">{entry.user.fullName}</div>
                        <div className="text-xs text-brand-400">{entry.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-brand-400">Public / système</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-500">{entry.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-500">{formatDate(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-right text-xs text-brand-400">
        {isFetching ? 'Actualisation…' : `Actualisé automatiquement toutes les ${REFRESH_MS / 1000}s`}
      </p>
    </div>
  );
}

function AnalyticsEventsPanel() {
  const [type, setType] = useState<AnalyticsEventType | ''>('');
  const [sessionId, setSessionId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['analytics-events', type, sessionId, from, to],
    queryFn: () =>
      fetchAnalyticsEvents({
        type: type || undefined,
        sessionId: sessionId || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      }),
    refetchInterval: REFRESH_MS,
  });

  const sorted = data ? [...data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) : [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Type d'événement">
            <Select value={type} onChange={(e) => setType(e.target.value as AnalyticsEventType | '')}>
              <option value="">Tous</option>
              {Object.entries(ANALYTICS_EVENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Session">
            <Input
              placeholder="ID de session…"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
          </Field>
          <Field label="Depuis">
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Jusqu'à">
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <Spinner label="Chargement des événements…" />
      ) : isError ? (
        <Alert>Impossible de charger les événements analytics.</Alert>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Aucun événement"
          description="Aucun événement visiteur ne correspond à ces filtres pour le moment."
        />
      ) : (
        <Card>
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {sorted.map((event) => (
              <div key={event.id} className="flex items-start gap-3 border-b border-brand-50 pb-3 last:border-0">
                <Badge className={analyticsEventColor(event.type)}>
                  {ANALYTICS_EVENT_LABELS[event.type] ?? event.type}
                </Badge>
                <div className="flex-1">
                  <div className="text-sm text-brand-800">
                    {event.path ?? <span className="text-brand-400">Chemin non renseigné</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-brand-400">
                    <span>Session {event.sessionId.slice(0, 8)}</span>
                    <span>{formatDate(event.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="text-right text-xs text-brand-400">
        {isFetching ? 'Actualisation…' : `Actualisé automatiquement toutes les ${REFRESH_MS / 1000}s`}
      </p>
    </div>
  );
}

export function EventsPage() {
  const [tab, setTab] = useState<Tab>('audit');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Événements</h1>
        <p className="mt-1 text-brand-500">
          Journal d'audit des actions back-office et événements de comportement des visiteurs, en direct.
        </p>
      </div>

      <div className="flex gap-2 border-b border-brand-100 pb-2">
        <TabButton active={tab === 'audit'} onClick={() => setTab('audit')}>
          Journal d'audit
        </TabButton>
        <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')}>
          Événements du site
        </TabButton>
      </div>

      {tab === 'audit' ? <AuditLogPanel /> : <AnalyticsEventsPanel />}
    </div>
  );
}
