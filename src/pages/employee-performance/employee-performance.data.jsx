import {
  Award,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export const performanceStats = [
  {
    label: "Active Reviews",
    value: "42",
    note: "ongoing this cycle",
    icon: Clock3,
  },
  {
    label: "Completed Reviews",
    value: "86",
    note: "submitted by managers",
    icon: CheckCircle2,
  },
  {
    label: "Top Performers",
    value: "24",
    note: "above target score",
    icon: Award,
  },
  {
    label: "Improvement Plans",
    value: "9",
    note: "for coaching",
    icon: Target,
  },
];

export const employeeRows = [
  {
    employee: "Maria Santos",
    department: "Operations",
    role: "Operations Lead",
    score: 94,
    status: "Excellent",
  },
  {
    employee: "John Reyes",
    department: "Human Resources",
    role: "HR Specialist",
    score: 88,
    status: "On Track",
  },
  {
    employee: "Andrea Cruz",
    department: "Finance",
    role: "Finance Analyst",
    score: 91,
    status: "Excellent",
  },
  {
    employee: "Paolo Lim",
    department: "Administration",
    role: "Admin Officer",
    score: 79,
    status: "Needs Review",
  },
];

export const focusAreas = [
  { label: "Goal Completion", value: 92, icon: TrendingUp },
  { label: "Team Collaboration", value: 86, icon: Users },
  { label: "Quality of Work", value: 90, icon: CheckCircle2 },
];
