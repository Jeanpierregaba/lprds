import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceStatsCardsProps {
  stats: AttendanceStats;
  loading?: boolean;
}

export const AttendanceStatsCards = ({ stats, loading = false }: AttendanceStatsCardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      title: 'Total Enfants',
      value: stats.total,
      description: 'Dans le groupe',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Présents',
      value: stats.present,
      description: `${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% du groupe`,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: 'Absents',
      value: stats.absent,
      description: `${stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% du groupe`,
      icon: UserX,
      color: 'text-red-600',
    },
    {
      title: 'En Retard',
      value: stats.late,
      description: 'Arrivés après l\'heure',
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statsConfig.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stat.color}`}>
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
