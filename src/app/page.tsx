import dbConnect from '@/lib/db';
import Snapshot from '@/lib/models/snapshot';
import { WEBSITES, type WebsiteId, type SectionData } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

import Header from '@/components/dashboard/header';
import StatusCard from '@/components/dashboard/status-card';
import SectionCard from '@/components/dashboard/section-card';
import ActivityTimeline from '@/components/dashboard/activity-timeline';
import SubscribeForm from '@/components/dashboard/subscribe-form';
import CountdownTimer from '@/components/dashboard/countdown-timer';
import SSEProvider from '@/components/dashboard/sse-provider';

export const dynamic = 'force-dynamic';

interface LatestData {
  sections: SectionData;
  checkedAt: string;
  hasChanges: boolean;
}

async function getLatestSnapshots(): Promise<Record<WebsiteId, LatestData | null>> {
  try {
    await dbConnect();

    const websiteIds: WebsiteId[] = ['arcade-portal', 'facilitator-portal', 'portfolio'];
    const result: Record<string, LatestData | null> = {};

    for (const id of websiteIds) {
      const snapshot = await Snapshot.findOne({ website: id })
        .sort({ checkedAt: -1 })
        .lean();

      if (snapshot) {
        result[id] = {
          sections: snapshot.sections as SectionData,
          checkedAt: new Date(snapshot.checkedAt as Date).toISOString(),
          hasChanges: snapshot.hasChanges as boolean,
        };
      } else {
        result[id] = null;
      }
    }

    return result as Record<WebsiteId, LatestData | null>;
  } catch {
    return {
      'arcade-portal': null,
      'facilitator-portal': null,
      'portfolio': null,
    };
  }
}

export default async function DashboardPage() {
  const latestSnapshots = await getLatestSnapshots();
  const lastCheckedAt = Object.values(latestSnapshots).find((s) => s)?.checkedAt ?? null;

  return (
    <SSEProvider>
      <div className="min-h-screen">
        <Header />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 -mt-4">
          {/* Top row: Status + Countdown + Subscribe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatusCard />
            <CountdownTimer lastCheckedAt={lastCheckedAt} />
            <SubscribeForm />
          </div>

          {/* Website sections */}
          {(Object.keys(WEBSITES) as WebsiteId[]).map((websiteId) => {
            const website = WEBSITES[websiteId];
            const data = latestSnapshots[websiteId];
            const sections = data?.sections ?? {
              games: 'Coming Soon',
              bonus: 'Coming Soon',
              announcements: 'No Updates',
            };

            const lastUpdated = data?.checkedAt
              ? formatDistanceToNow(new Date(data.checkedAt), { addSuffix: true })
              : undefined;

            const checkedDisplay = data?.checkedAt
              ? format(new Date(data.checkedAt), 'h:mm a')
              : 'Never';

            return (
              <div key={websiteId} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2
                      className="text-lg font-bold text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {website.name}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {website.description} • Last checked {checkedDisplay}
                    </p>
                  </div>
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                  >
                    Visit →
                  </a>
                </div>

                <div className="dashboard-grid">
                  <SectionCard
                    section="games"
                    value={sections.games}
                    websiteName={website.name}
                    lastUpdated={lastUpdated}
                    recentlyChanged={data?.hasChanges}
                  />
                  <SectionCard
                    section="bonus"
                    value={sections.bonus}
                    websiteName={website.name}
                    lastUpdated={lastUpdated}
                    recentlyChanged={data?.hasChanges}
                  />
                  <SectionCard
                    section="announcements"
                    value={sections.announcements}
                    websiteName={website.name}
                    lastUpdated={lastUpdated}
                    recentlyChanged={data?.hasChanges}
                  />
                </div>
              </div>
            );
          })}

          {/* Activity Timeline */}
          <div className="max-w-2xl mx-auto">
            <ActivityTimeline />
          </div>

          {/* Footer */}
          <footer className="text-center mt-16 pt-8 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">
              Arcade Pulse • Monitoring Google Arcade in real-time
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Not affiliated with Google. Built for the community.
            </p>
          </footer>
        </main>
      </div>
    </SSEProvider>
  );
}
