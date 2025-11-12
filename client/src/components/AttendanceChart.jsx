import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function AttendanceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="percentage"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Attendance %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AttendanceBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" fill="#10b981" name="Present" />
        <Bar dataKey="absent" fill="#ef4444" name="Absent" />
      </BarChart>
    </ResponsiveContainer>
  );
}
