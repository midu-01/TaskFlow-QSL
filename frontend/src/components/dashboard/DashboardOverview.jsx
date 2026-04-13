import { TREND_CHART_HEIGHT, TREND_CHART_WIDTH } from '../../constants/taskConstants'

function StatusSummaryRow({ taskStats }) {
  return (
    <div className="status-row">
      <span className="status-item pending">
        <i className="dot" />
        Pending {taskStats.pending}
      </span>
      <span className="status-item in-progress">
        <i className="dot" />
        In Progress {taskStats.inProgress}
      </span>
      <span className="status-item completed">
        <i className="dot" />
        Completed {taskStats.completed}
      </span>
    </div>
  )
}

export default function DashboardOverview({ taskStats, insights, deliveryTrend }) {
  return (
    <>
      <section className="metric-grid">
        <article className="metric-card green">
          <div className="metric-head">
            <div className="metric-icon">○</div>
          </div>
          <p className="metric-label">Active Tasks</p>
          <h2>{taskStats.inProgress}</h2>
          <p className="metric-meta">In delivery right now</p>
        </article>

        <article className="metric-card blue">
          <div className="metric-head">
            <div className="metric-icon">◉</div>
          </div>
          <p className="metric-label">Total Tasks</p>
          <h2>{taskStats.total}</h2>
          <p className="metric-meta">All records in workspace</p>
        </article>

        <article className="metric-card pink">
          <div className="metric-head">
            <div className="metric-icon">◎</div>
          </div>
          <p className="metric-label">Completed Tasks</p>
          <h2>{taskStats.completed}</h2>
          <p className="metric-meta">{insights.completedRate}% completion rate</p>
        </article>
      </section>

      <section className="insight-grid">
        <article className="insight-card centered-card">
          <div className="insight-header">
            <h3>Task Progress</h3>
            <span className="pill">Live</span>
          </div>
          <div className="progress-main">{insights.completedRate}%</div>
          <p className="muted">Average task completion</p>
          <div className="stacked-bars">
            <div className="bar pending" style={{ width: `${insights.pendingRate}%` }} />
            <div className="bar progress" style={{ width: `${insights.inProgressRate}%` }} />
            <div className="bar complete" style={{ width: `${insights.completedRate}%` }} />
          </div>
          <StatusSummaryRow taskStats={taskStats} />
        </article>

        <article className="insight-card centered-card">
          <div className="insight-header">
            <h3>Task Status</h3>
            <span className="pill">Summary</span>
          </div>
          <div
            className="status-ring"
            style={{
              background: `conic-gradient(
                #16a34a 0deg ${insights.completedRate * 3.6}deg,
                #3b82f6 ${insights.completedRate * 3.6}deg ${(insights.completedRate + insights.inProgressRate) * 3.6}deg,
                #ec4899 ${(insights.completedRate + insights.inProgressRate) * 3.6}deg 360deg
              )`,
            }}
          >
            <div className="status-ring-inner">
              <strong>{taskStats.total}</strong>
              <span>tasks</span>
            </div>
          </div>
          <StatusSummaryRow taskStats={taskStats} />
        </article>

        <article className="insight-card">
          <div className="insight-header">
            <h3>Delivery Trend</h3>
            <span className="pill">Last 7 Days</span>
          </div>
          <svg
            className="trend-chart"
            viewBox={`0 0 ${TREND_CHART_WIDTH} ${TREND_CHART_HEIGHT}`}
            role="img"
            aria-label="Task delivery trend for created and completed tasks over the last seven days"
          >
            <path d={deliveryTrend.createdPath} />
            <path d={deliveryTrend.completedPath} />
          </svg>
          <div className="trend-legend">
            <span className="legend-item">
              <i className="legend-dot created" />
              Created
            </span>
            <span className="legend-item">
              <i className="legend-dot completed" />
              Completed
            </span>
            <span className="trend-window">
              {deliveryTrend.startLabel} to {deliveryTrend.endLabel}
            </span>
          </div>
          <div className="trend-meta">
            <div>
              <span>Created</span>
              <strong>{deliveryTrend.createdThisWeek}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{deliveryTrend.completedThisWeek}</strong>
            </div>
          </div>
          <p className="trend-footnote">{deliveryTrend.paceLabel}</p>
        </article>
      </section>
    </>
  )
}
