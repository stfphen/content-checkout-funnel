"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { callDirections, callOutcomeOptions, callStatuses } from "../../lib/telephony/constants.js";

const OUTCOME_EDIT_OPTIONS = [{ value: "", label: "— Set outcome —" }, ...callOutcomeOptions];
const OUTCOME_LABEL = new Map(callOutcomeOptions.map((option) => [option.value, option.label]));

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") return "—";
  const total = Number(seconds) || 0;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m${String(secs).padStart(2, "0")}s`;
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function CallsTable({ calls = [] }) {
  const router = useRouter();
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [outcome, setOutcome] = useState("");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls.filter((call) => {
      if (direction && call.direction !== direction) return false;
      if (status && call.status !== status) return false;
      if (outcome && call.outcome !== outcome) return false;
      if (q) {
        const haystack = [
          call.businessName,
          call.repName,
          call.leadPhone,
          call.fromNumber,
          call.toNumber
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [calls, direction, status, outcome, query]);

  async function saveOutcome(callId, nextOutcome) {
    if (!nextOutcome) return;
    setSavingId(callId);
    setError("");
    try {
      const response = await fetch("/api/admin/telephony/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, outcome: nextOutcome })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || `Could not save outcome (${response.status}).`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err?.message || "Network error.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="calls-log">
      <form className="calls-filters" onSubmit={(event) => event.preventDefault()}>
        <input
          placeholder="Search business, rep, number"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={direction} onChange={(event) => setDirection(event.target.value)}>
          <option value="">All directions</option>
          {callDirections.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {callStatuses.map((value) => (
            <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select value={outcome} onChange={(event) => setOutcome(event.target.value)}>
          <option value="">All outcomes</option>
          {callOutcomeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className="calls-filters__count">{filtered.length} of {calls.length}</span>
      </form>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="calls-table-wrap">
        <table className="calls-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Dir</th>
              <th>Rep</th>
              <th>When</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((call) => (
              <tr key={call.id}>
                <td>
                  {call.businessName ? (
                    <a href={`/admin?q=${encodeURIComponent(call.businessName)}`}>{call.businessName}</a>
                  ) : (
                    <span>{call.leadPhone || call.fromNumber || call.toNumber || "Unknown"}</span>
                  )}
                </td>
                <td>{call.direction === "inbound" ? "In" : "Out"}</td>
                <td>{call.repName || "—"}</td>
                <td>{formatWhen(call.startedAt || call.createdAt)}</td>
                <td>{formatDuration(call.durationSeconds)}</td>
                <td>
                  <span className={`status-pill status-pill--${call.status}`}>
                    {String(call.status || "").replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  <select
                    defaultValue={call.outcome || ""}
                    disabled={savingId === call.id}
                    onChange={(event) => saveOutcome(call.id, event.target.value)}
                    aria-label={`Outcome for call with ${call.businessName || "lead"}`}
                  >
                    {(call.outcome && !OUTCOME_LABEL.has(call.outcome)
                      ? [{ value: call.outcome, label: call.outcome }, ...OUTCOME_EDIT_OPTIONS]
                      : OUTCOME_EDIT_OPTIONS
                    ).map((option) => (
                      <option key={option.value || "none"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <p>No calls match the current filters.</p> : null}
      </div>
    </div>
  );
}
