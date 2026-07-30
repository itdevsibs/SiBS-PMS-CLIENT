import {
  BarChart3,
  Gauge,
  LineChart,
  PieChart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export const sidebarModules = [
  { name: "Dashboard", icon: Gauge, path: "/admin-dashboard" },
  {
    name: "Employee Performance",
    icon: TrendingUp,
    path: "/employee-performance",
  },
  { name: "Employee Rating", icon: Star, path: "/employee-rating" },
  { name: "Reports", icon: BarChart3, path: "/reports" },
];

export const stats = [
  {
    label: "Reviewed Employees",
    value: "128",
    change: "+12%",
    note: "than last cycle",
    icon: Users,
  },
  {
    label: "Average Rating",
    value: "4.6",
    change: "+3%",
    note: "than last month",
    icon: Star,
  },
  {
    label: "Performance Score",
    value: "92%",
    change: "+8%",
    note: "than last review",
    icon: TrendingUp,
  },
  {
    label: "Reports Ready",
    value: "18",
    change: "+5%",
    note: "than yesterday",
    icon: BarChart3,
  },
];

export const performanceRows = [
  { name: "Operations", owner: "Maria Santos", score: "92%", progress: 92 },
  { name: "Human Resources", owner: "John Reyes", score: "88%", progress: 88 },
  { name: "Finance", owner: "Andrea Cruz", score: "95%", progress: 95 },
  { name: "Administration", owner: "Paolo Lim", score: "84%", progress: 84 },
];

export const chartCards = [
  {
    title: "Performance Views",
    subtitle: "Weekly review activity",
    footer: "updated 2 days ago",
    icon: BarChart3,
    values: [48, 44, 22, 28, 50, 60, 76],
    type: "bar",
  },
  {
    title: "Daily Ratings",
    subtitle: "(+15%) increase in today scores.",
    footer: "updated 4 min ago",
    icon: LineChart,
    values: [18, 36, 24, 70, 42, 58, 44, 30, 50, 54, 38],
    type: "line",
  },
  {
    title: "Completed Reviews",
    subtitle: "Monthly completion trend",
    footer: "just updated",
    icon: PieChart,
    values: [16, 14, 42, 34, 72, 46, 60, 38, 70],
    type: "line",
  },
];

export const activityItems = [
  { title: "Quarterly review finalized", time: "Today 9:30 AM" },
  { title: "New employee rating submitted", time: "Yesterday 4:12 PM" },
  { title: "Performance report exported", time: "21 Dec 11:00 AM" },
  { title: "Department score updated", time: "20 Dec 3:45 PM" },
];
